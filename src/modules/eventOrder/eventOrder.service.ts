import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { generateQRCode, formatEventDateTime, generateTicketId } from '../../utils/qrCode.js';
import logger from '../../utils/logger.js';
import { Event } from '../event/event.model.js';
import { User } from '../auth/auth.model.js';
import '../businessProfile/businessProfile.model.js';
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

  // Fetch host user details to get organizer name
  const hostUser = await User.findById(payload.hostId).populate('businessProfile');
  const organizerName =
    (hostUser as any)?.businessProfile?.businessName || hostUser?.name || 'Music of Tour';

  // Generate a unique ObjectId and readable Ticket ID (e.g. MOT3203920212)
  const orderId = new Types.ObjectId();
  const ticketId = generateTicketId(organizerName || event.title);

  // Match the exact fields shown in the ticket design
  const qrData = {
    event: event.title,
    eventLocation: event.placeName,
    dateTime: formatEventDateTime(event.startDate),
    eventOrganizer: organizerName,
    ticketId,
    orderId: orderId.toString(),
    eventId: event._id.toString(),
    userId: payload.userId,
    totalTicketQuantity: payload.totalTicketQuantity,
    totalAmount: payload.totalAmount,
    tickets: formattedTickets.map((t) => ({
      categoryName: t.categoryName,
      unitPrice: t.unitPrice,
      quantity: t.quantity,
    })),
  };

  const qrCode = await generateQRCode(
    qrData,
    `order-${orderId.toString()}.png`,
    'qrcodes'
  );

  const createData: any = {
    _id: orderId,
    user: payload.userId,
    hostId: payload.hostId,
    eventId: payload.eventId,
    ticketId,
    tickets: formattedTickets,
    totalTicketQuantity: payload.totalTicketQuantity,
    totalAmount: payload.totalAmount,
    qrCode,
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
    .populate({
      path: 'hostId',
      select: 'name profileImage',
      populate: { path: 'businessProfile', select: 'businessName' },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await EventOrder.countDocuments(filter);
  const totalPage = Math.ceil(total / limit);

  // Auto-generate and upload QR codes to S3 for any retrieved orders missing qrCode or ticketId
  await Promise.all(
    orders.map(async (order) => {
      let isUpdated = false;
      const eventDoc = order.eventId as any;
      const hostDoc = order.hostId as any;
      const organizerName =
        hostDoc?.businessProfile?.businessName || hostDoc?.name || 'Music of Tour';

      if (!order.ticketId) {
        order.ticketId = generateTicketId(organizerName || eventDoc?.title);
        isUpdated = true;
      }

      if (!order.qrCode) {
        try {
          const qrData = {
            event: eventDoc?.title || 'Event',
            eventLocation: eventDoc?.placeName || 'Event Location',
            dateTime: formatEventDateTime(eventDoc?.startDate || order.createdAt),
            eventOrganizer: organizerName,
            ticketId: order.ticketId,
            orderId: order._id.toString(),
            eventId: eventDoc?._id?.toString() || order.eventId.toString(),
            userId: order.user.toString(),
            totalTicketQuantity: order.totalTicketQuantity,
            totalAmount: order.totalAmount,
            tickets: order.tickets?.map((t) => ({
              categoryName: t.categoryName,
              unitPrice: t.unitPrice,
              quantity: t.quantity,
            })),
          };

          const qrCodeUrl = await generateQRCode(
            qrData,
            `order-${order._id.toString()}.png`,
            'qrcodes'
          );
          order.qrCode = qrCodeUrl;
          isUpdated = true;
        } catch (err: any) {
          logger.error(`[getMyEventOrders] Failed to generate/upload QR code for order ${order._id}:`, err);
        }
      }

      if (isUpdated) {
        await EventOrder.updateOne(
          { _id: order._id },
          { qrCode: order.qrCode, ticketId: order.ticketId }
        );
      }
    })
  );

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
  const order = await EventOrder.findById(orderId)
    .populate('eventId', 'title description placeName images startDate endDate priceCategories')
    .populate({
      path: 'hostId',
      select: 'name profileImage',
      populate: { path: 'businessProfile', select: 'businessName' },
    });

  if (!order) {
    throw new AppError('Event order not found', 404);
  }

  const hostUserId =
    (order.hostId as any)?._id?.toString() ||
    (order.hostId ? (order.hostId as any).toString() : '');

  if (order.user.toString() !== userId && hostUserId !== userId) {
    throw new AppError('Not authorized to view this event order', 403);
  }

  let isUpdated = false;
  const eventDoc = order.eventId as any;
  const hostDoc = order.hostId as any;
  const organizerName =
    hostDoc?.businessProfile?.businessName || hostDoc?.name || 'Music of Tour';

  if (!order.ticketId) {
    order.ticketId = generateTicketId(organizerName || eventDoc?.title);
    isUpdated = true;
  }

  if (!order.qrCode) {
    const qrData = {
      event: eventDoc?.title || 'Event',
      eventLocation: eventDoc?.placeName || 'Event Location',
      dateTime: formatEventDateTime(eventDoc?.startDate || order.createdAt),
      eventOrganizer: organizerName,
      ticketId: order.ticketId,
      orderId: order._id.toString(),
      eventId: eventDoc?._id?.toString() || order.eventId.toString(),
      userId: order.user.toString(),
      totalTicketQuantity: order.totalTicketQuantity,
      totalAmount: order.totalAmount,
      tickets: order.tickets?.map((t) => ({
        categoryName: t.categoryName,
        unitPrice: t.unitPrice,
        quantity: t.quantity,
      })),
    };

    order.qrCode = await generateQRCode(
      qrData,
      `order-${order._id.toString()}.png`,
      'qrcodes'
    );
    isUpdated = true;
  }

  if (isUpdated) {
    await EventOrder.updateOne(
      { _id: order._id },
      { qrCode: order.qrCode, ticketId: order.ticketId }
    );
  }

  return order;
};

export const EventOrderService = {
  createEventOrder,
  getMyEventOrders,
  getEventOrderById,
};
