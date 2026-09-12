import { AppError } from '../../utils/AppError.js';
import { User } from '../auth/auth.model.js';
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

  const orderData: Partial<IOrder> = {
    user: user._id as any,
    itemType,
    quantity,
    status: 'CLAIMED',
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

  return order;
};

export const OrderService = {
  createOrder,
  getMyOrders,
  getOrderById,
};
