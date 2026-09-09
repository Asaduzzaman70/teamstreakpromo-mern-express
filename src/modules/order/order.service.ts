import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { User } from '../auth/auth.model.js';
import { Marketplace } from '../marketplace/marketplace.model.js';
// import { Event } from '../event/event.model.js'; // Uncomment when Event claiming is implemented
import { Order } from './order.model.js';
import type { IOrder } from './order.interface.js';

const createOrder = async (
  userId: string,
  payload: { itemType: 'MARKETPLACE' | 'EVENT'; itemId: string; quantity: number }
): Promise<IOrder> => {
  const { itemType, itemId, quantity = 1 } = payload;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  let totalPointsRequired = 0;

  if (itemType === 'MARKETPLACE') {
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

    totalPointsRequired = marketplaceItem.points * quantity;

    // Check if user has enough points
    if (user.totalPoints < totalPointsRequired) {
      throw new AppError(`Insufficient points. You need ${totalPointsRequired} points.`, 400);
    }

    // Process the order
    user.totalPoints -= totalPointsRequired;
    await user.save();

    marketplaceItem.claimQuantity = (marketplaceItem.claimQuantity || 0) + quantity;
    await marketplaceItem.save();
  } else if (itemType === 'EVENT') {
    // Implement Event claiming logic here
    // Similar to marketplace but requires checking Event/Reward models
    throw new AppError('Event item claiming is not fully implemented yet', 501);
  }

  // Create order
  const order = await Order.create({
    user: userId,
    itemType,
    item: itemId,
    quantity,
    totalPoints: totalPointsRequired,
    status: 'CLAIMED',
  });

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
    .populate('item') // Populates using the dynamic refPath
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(filter);
  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: orders,
  };
};

export const OrderService = {
  createOrder,
  getMyOrders,
};
