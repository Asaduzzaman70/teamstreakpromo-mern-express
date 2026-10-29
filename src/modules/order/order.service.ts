import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { generateQRCode } from '../../utils/qrCode.js';
import logger from '../../utils/logger.js';
import { User } from '../auth/auth.model.js';
import '../businessProfile/businessProfile.model.js';
import { Marketplace } from '../marketplace/marketplace.model.js';
import { Event } from '../event/event.model.js';
import { Employee } from '../employee/employee.model.js';
import { Order } from './order.model.js';
import type { IOrder } from './order.interface.js';

const createOrder = async (
  userId: string,
  payload: {
    itemType: 'MARKETPLACE' | 'EVENT';
    itemId?: string;
    eventId?: string;
    rewardItemId?: string;
    quantity?: number;
  }
): Promise<IOrder> => {
  const { itemType, quantity = 1 } = payload;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const orderId = new Types.ObjectId();

  const orderData: Partial<IOrder> & { _id: Types.ObjectId } = {
    _id: orderId,
    user: user._id as any,
    itemType,
    quantity,
    status: 'CLAIMED',
    qrCode: '',
  };

  if (itemType === 'MARKETPLACE') {
    const itemId = payload.itemId;
    if (!itemId) {
      throw new AppError('Item ID is required for marketplace order', 400);
    }

    const marketplaceItem = await Marketplace.findById(itemId);
    if (!marketplaceItem) {
      throw new AppError('Marketplace item not found', 404);
    }

    if (!marketplaceItem.isActive) {
      throw new AppError('This marketplace item is no longer active', 400);
    }

    const availableQuantity = marketplaceItem.quantity - (marketplaceItem.claimQuantity || 0);
    if (availableQuantity < quantity) {
      throw new AppError(`Only ${availableQuantity} items left in stock`, 400);
    }

    const totalPointsRequired = marketplaceItem.points * quantity;

    if (user.totalPoints < totalPointsRequired) {
      throw new AppError(`Insufficient points. You need ${totalPointsRequired} points.`, 400);
    }

    // 1. Atomically reserve marketplace stock
    const updatedMarketplace = await Marketplace.findOneAndUpdate(
      {
        _id: marketplaceItem._id,
        isActive: true,
        $expr: {
          $gte: [
            { $subtract: ['$quantity', { $ifNull: ['$claimQuantity', 0] }] },
            quantity,
          ],
        },
      },
      { $inc: { claimQuantity: quantity } },
      { new: true }
    );

    if (!updatedMarketplace) {
      throw new AppError('Insufficient marketplace stock available', 400);
    }

    // 2. Atomically deduct user points
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        totalPoints: { $gte: totalPointsRequired },
      },
      { $inc: { totalPoints: -totalPointsRequired } },
      { new: true }
    );

    if (!updatedUser) {
      // Roll back marketplace stock reservation
      await Marketplace.updateOne(
        { _id: marketplaceItem._id },
        { $inc: { claimQuantity: -quantity } }
      );
      throw new AppError(`Insufficient points. You need ${totalPointsRequired} points.`, 400);
    }

    orderData.businessOwnerId = marketplaceItem.businessOwnerId as any;
    orderData.itemId = marketplaceItem._id as any;
    orderData.itemPoints = marketplaceItem.points;

    // Fetch seller information for the QR code payload
    const ownerUser = await User.findById(marketplaceItem.businessOwnerId).populate('businessProfile');
    const sellerName =
      (ownerUser as any)?.businessProfile?.businessName || ownerUser?.name || 'Marketplace Seller';

    const qrData = {
      orderId: orderId.toString(),
      itemType: 'MARKETPLACE',
      title: marketplaceItem.title,
      description: marketplaceItem.description || '',
      location: marketplaceItem.location || '',
      seller: sellerName,
      points: marketplaceItem.points,
      totalPoints: totalPointsRequired,
      quantity,
      status: 'CLAIMED',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      claimedAt: new Date().toISOString(),
    };

    try {
      const qrCodeUrl = await generateQRCode(
        qrData,
        `order-${orderId.toString()}.png`,
        'qrcodes'
      );
      orderData.qrCode = qrCodeUrl;
    } catch (err: any) {
      logger.error('[createOrder] Failed to generate marketplace QR code:', err);
    }
  } else if (itemType === 'EVENT') {
    const eventId = payload.eventId || payload.itemId;
    if (!eventId) {
      throw new AppError('Event ID is required for event order', 400);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const rewardItemId = payload.rewardItemId || payload.itemId;
    const reward = event.rewards.find(
      (r: any) => r._id?.toString() === rewardItemId?.toString()
    ) || event.rewards[0];

    if (!reward || !reward._id) {
      throw new AppError('Reward item not found in event', 404);
    }
    const targetRewardId = reward._id;

    if (reward.stock < quantity) {
      throw new AppError(`Only ${reward.stock} items left in stock`, 400);
    }

    const totalPointsRequired = reward.pointsRequired * quantity;

    if (user.totalPoints < totalPointsRequired) {
      throw new AppError(`Insufficient points. You need ${totalPointsRequired} points.`, 400);
    }

    // 1. Atomically reserve event reward stock
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: event._id,
        rewards: {
          $elemMatch: {
            _id: targetRewardId,
            stock: { $gte: quantity },
          },
        },
      },
      { $inc: { 'rewards.$.stock': -quantity } },
      { new: true }
    );

    if (!updatedEvent) {
      throw new AppError('Insufficient reward stock available', 400);
    }

    // 2. Atomically deduct user points
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        totalPoints: { $gte: totalPointsRequired },
      },
      { $inc: { totalPoints: -totalPointsRequired } },
      { new: true }
    );

    if (!updatedUser) {
      // Roll back event reward stock reservation
      await Event.updateOne(
        { _id: event._id, 'rewards._id': targetRewardId },
        { $inc: { 'rewards.$.stock': quantity } }
      );
      throw new AppError(`Insufficient points. You need ${totalPointsRequired} points.`, 400);
    }

    orderData.hostId = event.hostId as any;
    orderData.rewardItemId = reward._id as any;
    orderData.eventId = event._id as any;
    orderData.itemPoints = reward.pointsRequired;

    // Fetch organizer information for the QR code payload
    const hostUser = await User.findById(event.hostId).populate('businessProfile');
    const organizerName =
      (hostUser as any)?.businessProfile?.businessName || hostUser?.name || 'Event Organizer';

    const qrData = {
      orderId: orderId.toString(),
      itemType: 'EVENT',
      eventTitle: event.title,
      rewardTitle: reward.title || event.title,
      description: reward.description || event.description || '',
      location: event.placeName || '',
      organizer: organizerName,
      points: reward.pointsRequired,
      totalPoints: totalPointsRequired,
      quantity,
      status: 'CLAIMED',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      claimedAt: new Date().toISOString(),
    };

    try {
      const qrCodeUrl = await generateQRCode(
        qrData,
        `order-${orderId.toString()}.png`,
        'qrcodes'
      );
      orderData.qrCode = qrCodeUrl;
    } catch (err: any) {
      logger.error('[createOrder] Failed to generate event reward QR code:', err);
    }
  }

  // Create order
  const order = await Order.create(orderData);

  return order;
};

const getMyOrders = async (userId: string, query: any) => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = { user: userId };
  if (query.itemType) {
    filter.itemType = query.itemType;
  }
  if (query.status) {
    filter.status = query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('itemId', 'title description location photos points')
      .populate('eventId', 'title description placeName images rewards')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const totalPage = Math.ceil(total / limit);

  // Trigger non-blocking background QR backfill for any legacy orders missing qrCode
  const ordersMissingQr = orders.filter((order) => !order.qrCode);
  if (ordersMissingQr.length > 0) {
    void Promise.all(
      ordersMissingQr.map(async (order) => {
        try {
          let qrData: any = null;
          if (order.itemType === 'MARKETPLACE') {
            const marketplace = order.itemId as any;
            const ownerUser = order.businessOwnerId
              ? await User.findById(order.businessOwnerId).populate('businessProfile')
              : null;
            const sellerName =
              (ownerUser as any)?.businessProfile?.businessName || ownerUser?.name || 'Marketplace Seller';

            qrData = {
              orderId: order._id.toString(),
              itemType: 'MARKETPLACE',
              title: marketplace?.title || 'Marketplace Item',
              description: marketplace?.description || '',
              location: marketplace?.location || '',
              seller: sellerName,
              points: order.itemPoints || marketplace?.points || 0,
              totalPoints: (order.itemPoints || marketplace?.points || 0) * (order.quantity || 1),
              quantity: order.quantity || 1,
              status: order.status,
              userId: userId,
              claimedAt: order.createdAt?.toISOString?.() || new Date().toISOString(),
            };
          } else if (order.itemType === 'EVENT') {
            const event = order.eventId as any;
            let rewardTitle = event?.title || 'Event Reward';
            let description = event?.description || '';
            if (event?.rewards && Array.isArray(event.rewards) && order.rewardItemId) {
              const reward = event.rewards.find(
                (r: any) => r._id?.toString() === order.rewardItemId?.toString()
              );
              if (reward) {
                rewardTitle = reward.title || event.title;
                description = reward.description || event.description || '';
              }
            }
            const hostUser = order.hostId
              ? await User.findById(order.hostId).populate('businessProfile')
              : null;
            const organizerName =
              (hostUser as any)?.businessProfile?.businessName || hostUser?.name || 'Event Organizer';

            qrData = {
              orderId: order._id.toString(),
              itemType: 'EVENT',
              eventTitle: event?.title || 'Event',
              rewardTitle,
              description,
              location: event?.placeName || '',
              organizer: organizerName,
              points: order.itemPoints || 0,
              totalPoints: (order.itemPoints || 0) * (order.quantity || 1),
              quantity: order.quantity || 1,
              status: order.status,
              userId: userId,
              claimedAt: order.createdAt?.toISOString?.() || new Date().toISOString(),
            };
          }

          if (qrData) {
            const qrCodeUrl = await generateQRCode(
              qrData,
              `order-${order._id.toString()}.png`,
              'qrcodes'
            );
            await Order.updateOne({ _id: order._id }, { qrCode: qrCodeUrl });
          }
        } catch (err: any) {
          logger.error(`[getMyOrders] Failed to backfill QR code for order ${order._id}:`, err);
        }
      })
    );
  }

  const formattedOrders = orders.map((order) => {
    let title = '';
    let description = '';
    let location = '';
    let photos: string[] = [];
    const points = order.itemPoints || 0;

    if (order.itemType === 'MARKETPLACE' && order.itemId) {
      const marketplace = order.itemId as any;
      title = marketplace.title || '';
      description = marketplace.description || '';
      location = marketplace.location || '';
      photos = marketplace.photos || [];
    } else if (order.itemType === 'EVENT' && order.eventId) {
      const event = order.eventId as any;
      if (event.rewards && Array.isArray(event.rewards) && order.rewardItemId) {
        const reward = event.rewards.find(
          (r: any) => r._id?.toString() === order.rewardItemId?.toString()
        );
        if (reward) {
          title = reward.title || event.title || '';
          description = reward.description || event.description || '';
          photos = reward.images && reward.images.length > 0 ? reward.images : event.images || [];
        } else {
          title = event.title || '';
          description = event.description || '';
          photos = event.images || [];
        }
      } else {
        title = event.title || '';
        description = event.description || '';
        photos = event.images || [];
      }
      location = event.placeName || '';
    }

    return {
      _id: order._id,
      itemType: order.itemType,
      title,
      photos,
      description,
      location,
      points,
      quantity: order.quantity,
      status: order.status,
      qrCode: order.qrCode || '',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: formattedOrders,
  };
};

const getOrderById = async (userId: string, orderId: string, role?: string): Promise<any> => {
  const filter: any = { _id: orderId };
  if (role === 'USER') {
    filter.user = userId;
  } else if (role === 'BUSINESS') {
    filter.businessOwnerId = userId;
  } else if (role === 'HOST') {
    filter.hostId = userId;
  } else if (role === 'EMPLOYEE') {
    const employee = await Employee.findById(userId)
      .select('employerId employerType isActive')
      .lean();
    if (!employee || !employee.isActive) {
      throw new AppError('Employee account is inactive or not found', 403);
    }
    if (employee.employerType === 'BUSINESS') {
      filter.businessOwnerId = employee.employerId;
    } else {
      filter.hostId = employee.employerId;
    }
  }

  const order = await Order.findOne(filter)
    .populate('itemId')
    .populate('eventId')
    .populate('businessOwnerId', 'name email role profileImage phoneNumber')
    .populate('hostId', 'name email role profileImage phoneNumber')
    .populate('user', 'name email role profileImage phoneNumber');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Auto-backfill QR code if missing
  if (!order.qrCode) {
    try {
      let qrData: any = null;
      if (order.itemType === 'MARKETPLACE') {
        const marketplace = order.itemId as any;
        const ownerUser = order.businessOwnerId as any;
        const sellerName =
          ownerUser?.businessProfile?.businessName || ownerUser?.name || 'Marketplace Seller';

        qrData = {
          orderId: order._id.toString(),
          itemType: 'MARKETPLACE',
          title: marketplace?.title || 'Marketplace Item',
          description: marketplace?.description || '',
          location: marketplace?.location || '',
          seller: sellerName,
          points: order.itemPoints || marketplace?.points || 0,
          totalPoints: (order.itemPoints || marketplace?.points || 0) * (order.quantity || 1),
          quantity: order.quantity || 1,
          status: order.status,
          user: {
            id: (order.user as any)?._id?.toString() || (order.user as any)?.toString(),
            name: (order.user as any)?.name,
            email: (order.user as any)?.email,
          },
          claimedAt: order.createdAt?.toISOString?.() || new Date().toISOString(),
        };
      } else if (order.itemType === 'EVENT') {
        const event = order.eventId as any;
        let rewardTitle = event?.title || 'Event Reward';
        let description = event?.description || '';
        if (event?.rewards && Array.isArray(event.rewards) && order.rewardItemId) {
          const reward = event.rewards.find(
            (r: any) => r._id?.toString() === order.rewardItemId?.toString()
          );
          if (reward) {
            rewardTitle = reward.title || event.title;
            description = reward.description || event.description || '';
          }
        }
        const hostUser = order.hostId as any;
        const organizerName =
          hostUser?.businessProfile?.businessName || hostUser?.name || 'Event Organizer';

        qrData = {
          orderId: order._id.toString(),
          itemType: 'EVENT',
          eventTitle: event?.title || 'Event',
          rewardTitle,
          description,
          location: event?.placeName || '',
          organizer: organizerName,
          points: order.itemPoints || 0,
          totalPoints: (order.itemPoints || 0) * (order.quantity || 1),
          quantity: order.quantity || 1,
          status: order.status,
          user: {
            id: (order.user as any)?._id?.toString() || (order.user as any)?.toString(),
            name: (order.user as any)?.name,
            email: (order.user as any)?.email,
          },
          claimedAt: order.createdAt?.toISOString?.() || new Date().toISOString(),
        };
      }

      if (qrData) {
        const qrCodeUrl = await generateQRCode(
          qrData,
          `order-${order._id.toString()}.png`,
          'qrcodes'
        );
        order.qrCode = qrCodeUrl;
        await Order.updateOne({ _id: order._id }, { qrCode: qrCodeUrl });
      }
    } catch (err: any) {
      logger.error(`[getOrderById] Failed to backfill QR code for order ${order._id}:`, err);
    }
  }

  const orderObj = order.toObject ? order.toObject() : order;
  return {
    ...orderObj,
    isRedeemed: order.status === 'REDEEMED',
  };
};

const getBusinessOrders = async (actorId: string, actorRole: string | undefined, query: any) => {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.max(1, parseInt(query.limit as string, 10) || 10);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (actorRole === 'EMPLOYEE') {
    const employee = await Employee.findById(actorId)
      .select('employerId employerType isActive')
      .lean();

    if (!employee || !employee.isActive) {
      throw new AppError('Employee account is inactive or not found', 403);
    }

    if (employee.employerType === 'BUSINESS') {
      filter.businessOwnerId = employee.employerId;
      filter.itemType = 'MARKETPLACE';
    } else {
      filter.hostId = employee.employerId;
      filter.itemType = 'EVENT';
    }
  } else if (actorRole === 'BUSINESS') {
    filter.businessOwnerId = actorId;
    filter.itemType = 'MARKETPLACE';
  } else if (actorRole === 'HOST') {
    filter.hostId = actorId;
    filter.itemType = 'EVENT';
  } else if (actorRole !== 'ADMIN') {
    throw new AppError('Not authorized to view business reward orders', 403);
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.itemId && Types.ObjectId.isValid(String(query.itemId))) {
    filter.itemId = new Types.ObjectId(String(query.itemId));
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('itemId', 'title description location photos points quantity claimQuantity')
      .populate('eventId', 'title description placeName images rewards')
      .populate('user', 'name email phoneNumber profileImage')
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const totalPage = Math.ceil(total / limit);

  const formattedOrders = orders.map((order) => {
    let title = '';
    let description = '';
    let location = '';
    let photos: string[] = [];
    const points = order.itemPoints || 0;

    if (order.itemType === 'MARKETPLACE' && order.itemId) {
      const marketplace = order.itemId as any;
      title = marketplace.title || '';
      description = marketplace.description || '';
      location = marketplace.location || '';
      photos = marketplace.photos || [];
    } else if (order.itemType === 'EVENT' && order.eventId) {
      const event = order.eventId as any;
      if (event.rewards && Array.isArray(event.rewards) && order.rewardItemId) {
        const reward = event.rewards.find(
          (r: any) => r._id?.toString() === order.rewardItemId?.toString()
        );
        if (reward) {
          title = reward.title || event.title || '';
          description = reward.description || event.description || '';
          photos = reward.images && reward.images.length > 0 ? reward.images : event.images || [];
        } else {
          title = event.title || '';
          description = event.description || '';
          photos = event.images || [];
        }
      } else {
        title = event.title || '';
        description = event.description || '';
        photos = event.images || [];
      }
      location = event.placeName || '';
    }

    return {
      _id: order._id,
      orderId: order._id.toString(),
      itemType: order.itemType,
      itemId: (order.itemId as any)?._id || order.itemId,
      title,
      photos,
      description,
      location,
      points,
      quantity: order.quantity,
      status: order.status,
      isRedeemed: order.status === 'REDEEMED',
      user: order.user,
      qrCode: order.qrCode || '',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: formattedOrders,
  };
};

const redeemOrder = async (
  orderId: string,
  actorId: string,
  actorRole?: string
): Promise<IOrder> => {
  if (actorRole === 'EMPLOYEE') {
    throw new AppError(
      'Forbidden: Employees cannot redeem rewards. Only the user can click redeem; employees can only view the redemption status.',
      403
    );
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.status === 'REDEEMED') {
    throw new AppError('Order is already redeemed', 400);
  }

  if (order.status === 'CANCELLED') {
    throw new AppError('Cannot redeem a cancelled order', 400);
  }

  const isOwner = order.businessOwnerId?.toString() === actorId;
  const isHost = order.hostId?.toString() === actorId;
  const isUser = order.user?.toString() === actorId;
  const isAdmin = actorRole === 'ADMIN';

  if (!isOwner && !isHost && !isUser && !isAdmin) {
    throw new AppError('Not authorized to redeem this order', 403);
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, status: 'CLAIMED' },
    { $set: { status: 'REDEEMED' } },
    { new: true }
  );

  if (!updatedOrder) {
    throw new AppError('Order is already redeemed or cancelled', 400);
  }

  logger.info(
    `[OrderService] Order ${orderId} marked as REDEEMED by user ${actorId} (${actorRole})`
  );
  return updatedOrder;
};

const redeemOrder = async (
  orderId: string,
  actorId: string,
  actorRole?: string
): Promise<IOrder> => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.status === 'REDEEMED') {
    throw new AppError('Order is already redeemed', 400);
  }

  if (order.status === 'CANCELLED') {
    throw new AppError('Cannot redeem a cancelled order', 400);
  }

  const isOwner = order.businessOwnerId?.toString() === actorId;
  const isHost = order.hostId?.toString() === actorId;
  const isUser = order.user?.toString() === actorId;
  const isAdmin = actorRole === 'ADMIN';

  if (!isOwner && !isHost && !isUser && !isAdmin) {
    throw new AppError('Not authorized to redeem this order', 403);
  }

  order.status = 'REDEEMED';
  await order.save();

  logger.info(
    `[OrderService] Order ${orderId} marked as REDEEMED by user ${actorId} (${actorRole})`
  );
  return order;
};

export const OrderService = {
  createOrder,
  getMyOrders,
  getBusinessOrders,
  getOrderById,
  redeemOrder,
};
