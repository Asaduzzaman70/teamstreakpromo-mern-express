import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { generateQRCode } from '../../utils/qrCode.js';
import logger from '../../utils/logger.js';
import { User } from '../auth/auth.model.js';
import '../businessProfile/businessProfile.model.js';
import { Marketplace } from '../marketplace/marketplace.model.js';
import { Event } from '../event/event.model.js';
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

    // Check if user has enough points
    if (user.totalPoints < totalPointsRequired) {
      throw new AppError(`Insufficient points. You need ${totalPointsRequired} points.`, 400);
    }

    // Process the order
    user.totalPoints -= totalPointsRequired;
    await user.save();

    marketplaceItem.claimQuantity = (marketplaceItem.claimQuantity || 0) + quantity;
    await marketplaceItem.save();

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

    if (!reward) {
      throw new AppError('Reward item not found in event', 404);
    }

    if (reward.stock < quantity) {
      throw new AppError(`Only ${reward.stock} items left in stock`, 400);
    }

    const totalPointsRequired = reward.pointsRequired * quantity;

    // Check if user has enough points
    if (user.totalPoints < totalPointsRequired) {
      throw new AppError(`Insufficient points. You need ${totalPointsRequired} points.`, 400);
    }

    // Process the order
    user.totalPoints -= totalPointsRequired;
    await user.save();

    reward.stock -= quantity;
    await event.save();

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

  const orders = await Order.find(filter)
    .populate('itemId', 'title description location photos points')
    .populate('eventId', 'title description placeName images rewards')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(filter);
  const totalPage = Math.ceil(total / limit);

  // Auto-backfill QR codes for any older orders missing qrCode
  await Promise.all(
    orders.map(async (order) => {
      if (!order.qrCode) {
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
            order.qrCode = qrCodeUrl;
            await Order.updateOne({ _id: order._id }, { qrCode: qrCodeUrl });
          }
        } catch (err: any) {
          logger.error(`[getMyOrders] Failed to backfill QR code for order ${order._id}:`, err);
        }
      }
    })
  );

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

const getOrderById = async (userId: string, orderId: string, role?: string): Promise<IOrder> => {
  const filter: any = { _id: orderId };
  if (role !== 'ADMIN') {
    filter.user = userId;
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

  return order;
};

export const OrderService = {
  createOrder,
  getMyOrders,
  getOrderById,
};
