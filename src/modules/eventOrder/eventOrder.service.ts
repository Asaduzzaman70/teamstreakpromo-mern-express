import { AppError } from '../../utils/AppError.js';
import { Event } from '../event/event.model.js';
import { EventOrder } from './eventOrder.model.js';
import type { IEventOrder, IEventOrderTicket } from './eventOrder.interface.js';

export interface CreateEventOrderTicketPayload {
  priceCategoryId?: string;
  categoryName?: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateEventOrderPayload {
  userId: string;
  hostId: string;
  eventId: string;
  tickets: CreateEventOrderTicketPayload[];
  totalTicketQuantity: number;
  totalAmount: number;
  stripeSessionId?: string;
  pointsEarned: number;
}

const createEventOrder = async (payload: CreateEventOrderPayload): Promise<IEventOrder> => {
  const event = await Event.findById(payload.eventId);
  if (!event) {
    throw new AppError('Event not found when creating event order', 404);
  }

  // Deduct individual price category stock
  for (const t of payload.tickets) {
    if (event.priceCategories && event.priceCategories.length > 0) {
      const priceCat = t.priceCategoryId
        ? event.priceCategories.find((pc: any) => pc._id?.toString() === t.priceCategoryId)
        : event.priceCategories[0];

      if (priceCat && priceCat.stock !== undefined) {
        priceCat.stock = Math.max(0, priceCat.stock - t.quantity);
      }
    }
  }


  await event.save();

  const formattedTickets: IEventOrderTicket[] = payload.tickets.map((t) => {
    const item: IEventOrderTicket = {
      categoryName: t.categoryName || 'General',
      unitPrice: t.unitPrice,
      quantity: t.quantity,
    };
    if (t.priceCategoryId) {
      item.priceCategoryId = t.priceCategoryId as any;
    }
    return item;
  });

  const createData: any = {
    user: payload.userId,
    hostId: payload.hostId,
    eventId: payload.eventId,
    tickets: formattedTickets,
    totalTicketQuantity: payload.totalTicketQuantity,
    totalAmount: payload.totalAmount,
    status: 'PAID',
    pointsEarned: payload.pointsEarned,
  };

  if (payload.stripeSessionId) {
    createData.stripeSessionId = payload.stripeSessionId;
  }

  const eventOrder = await EventOrder.create(createData);

  return eventOrder;
};

const getMyEventOrders = async (userId: string, query: any = {}) => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const filter: any = { user: userId };
  if (query.status) {
    filter.status = query.status;
  }

  const orders = await EventOrder.find(filter)
    .populate('eventId', 'title description placeName images startDate endDate priceCategories')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await EventOrder.countDocuments(filter);
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

const getEventOrderById = async (orderId: string, userId: string): Promise<IEventOrder> => {
  const order = await EventOrder.findById(orderId).populate(
    'eventId',
    'title description placeName images startDate endDate priceCategories'
  );


  if (!order) {
    throw new AppError('Event order not found', 404);
  }

  if (order.user.toString() !== userId && order.hostId.toString() !== userId) {
    throw new AppError('Not authorized to view this event order', 403);
  }

  return order;
};

export const EventOrderService = {
  createEventOrder,
  getMyEventOrders,
  getEventOrderById,
};
