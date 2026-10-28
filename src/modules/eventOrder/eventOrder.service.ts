import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import { generateQRCode, formatEventDateTime, generateTicketId } from '../../utils/qrCode.js';
import logger from '../../utils/logger.js';
import { Event } from '../event/event.model.js';
import { User } from '../auth/auth.model.js';
import { Employee } from '../employee/employee.model.js';
import '../businessProfile/businessProfile.model.js';
import { EventOrder } from './eventOrder.model.js';
import type {
  IEventOrder,
  IEventOrderTicket,
  ScanEventTicketInput,
  IScanEventTicketResponse,
  IScannedTicketDashboardItem,
  IScannedTicketsQuery,
} from './eventOrder.interface.js';

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

const isValidObjectId = (val: string): boolean => {
  return Types.ObjectId.isValid(val) && new Types.ObjectId(val).toString() === val;
};

/**
 * Helper to verify if an actor (HOST, BUSINESS, EMPLOYEE, or ADMIN) is authorized for a given hostId.
 */
const isActorAuthorizedForHost = async (
  actorId: string,
  actorRole: string | undefined,
  eventHostId: string
): Promise<boolean> => {
  if (actorRole === 'ADMIN') {
    return true;
  }

  if (actorId === eventHostId) {
    return true;
  }

  // Check if the actor is an active subordinate employee belonging to the event host
  if (isValidObjectId(actorId)) {
    const employee = await Employee.findById(actorId)
      .select('employerId isActive')
      .lean();
    if (employee && employee.isActive && employee.employerId.toString() === eventHostId) {
      return true;
    }
  }

  return false;
};

const createEventOrder = async (payload: CreateEventOrderPayload): Promise<IEventOrder> => {
  const event = await Event.findById(payload.eventId);
  if (!event) {
    throw new AppError('Event not found when creating event order', 404);
  }

  // Atomically deduct individual price category stock
  for (const t of payload.tickets) {
    if (event.priceCategories && event.priceCategories.length > 0) {
      const priceCat = t.priceCategoryId
        ? event.priceCategories.find((pc: any) => pc._id?.toString() === t.priceCategoryId)
        : event.priceCategories[0];

      if (priceCat && (priceCat as any)._id) {
        const targetCatId = (priceCat as any)._id;
        const atomicResult = await Event.findOneAndUpdate(
          {
            _id: event._id,
            priceCategories: {
              $elemMatch: {
                _id: targetCatId,
                stock: { $gte: t.quantity },
              },
            },
          },
          { $inc: { 'priceCategories.$.stock': -t.quantity } }
        );

        // If concurrent checkout caused stock to be less than t.quantity, clamp stock to 0
        if (!atomicResult) {
          await Event.updateOne(
            { _id: event._id, 'priceCategories._id': targetCatId },
            { $set: { 'priceCategories.$.stock': 0 } }
          );
        }
      }
    }
  }

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

  let qrCode = '';
  try {
    qrCode = await generateQRCode(
      qrData,
      `order-${orderId.toString()}.png`,
      'qrcodes'
    );
  } catch (err: any) {
    logger.error('[createEventOrder] Failed to generate ticket QR code:', err);
  }

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
    isScanned: false,
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

  const [orders, total] = await Promise.all([
    EventOrder.find(filter)
      .populate('eventId', 'title description placeName images startDate endDate priceCategories')
      .populate({
        path: 'hostId',
        select: 'name profileImage',
        populate: { path: 'businessProfile', select: 'businessName' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    EventOrder.countDocuments(filter),
  ]);

  const totalPage = Math.ceil(total / limit);

  // Synchronously assign ticketId if missing; backfill S3 QR codes asynchronously in background
  const ordersNeedingBackfill: typeof orders = [];
  for (const order of orders) {
    const eventDoc = order.eventId as any;
    const hostDoc = order.hostId as any;
    const organizerName =
      hostDoc?.businessProfile?.businessName || hostDoc?.name || 'Music of Tour';

    if (!order.ticketId) {
      order.ticketId = generateTicketId(organizerName || eventDoc?.title);
      ordersNeedingBackfill.push(order);
    } else if (!order.qrCode) {
      ordersNeedingBackfill.push(order);
    }
  }

  if (ordersNeedingBackfill.length > 0) {
    void Promise.all(
      ordersNeedingBackfill.map(async (order) => {
        try {
          const eventDoc = order.eventId as any;
          const hostDoc = order.hostId as any;
          const organizerName =
            hostDoc?.businessProfile?.businessName || hostDoc?.name || 'Music of Tour';

          let qrCodeUrl = order.qrCode;
          if (!qrCodeUrl) {
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

            qrCodeUrl = await generateQRCode(
              qrData,
              `order-${order._id.toString()}.png`,
              'qrcodes'
            );
          }

          await EventOrder.updateOne(
            { _id: order._id },
            { qrCode: qrCodeUrl, ticketId: order.ticketId }
          );
        } catch (err: any) {
          logger.error(`[getMyEventOrders] Failed to backfill QR code for order ${order._id}:`, err);
        }
      })
    );
  }

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

const getEventOrderById = async (
  identifier: string,
  userId: string,
  userRole?: string
): Promise<IEventOrder> => {
  const trimmedId = identifier.trim();
  const query = isValidObjectId(trimmedId)
    ? { $or: [{ _id: trimmedId }, { ticketId: trimmedId }] }
    : { ticketId: new RegExp(`^${escapeRegex(trimmedId)}$`, 'i') };

  const order = await EventOrder.findOne(query)
    .populate('eventId', 'title description placeName images startDate endDate priceCategories')
    .populate('user', 'name email phoneNumber profileImage')
    .populate({
      path: 'hostId',
      select: 'name profileImage',
      populate: { path: 'businessProfile', select: 'businessName' },
    });

  if (!order) {
    throw new AppError('Event order not found', 404);
  }

  const buyerUserId =
    (order.user as any)?._id?.toString() ||
    (order.user ? (order.user as any).toString() : '');
  const hostUserId =
    (order.hostId as any)?._id?.toString() ||
    (order.hostId ? (order.hostId as any).toString() : '');

  const isBuyer = buyerUserId === userId;
  const isHostAuthorized = await isActorAuthorizedForHost(userId, userRole, hostUserId);

  if (!isBuyer && !isHostAuthorized) {
    throw new AppError('Not authorized to view this event order', 403);
  }

  // Host Employee can ONLY view tickets that they personally scanned
  if (userRole === 'EMPLOYEE') {
    if (!order.isScanned || order.scannedBy?.toString() !== userId) {
      throw new AppError(
        'Forbidden: Host employees can only view tickets that they have scanned.',
        403
      );
    }
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
    try {
      const qrData = {
        event: eventDoc?.title || 'Event',
        eventLocation: eventDoc?.placeName || 'Event Location',
        dateTime: formatEventDateTime(eventDoc?.startDate || order.createdAt),
        eventOrganizer: organizerName,
        ticketId: order.ticketId,
        orderId: order._id.toString(),
        eventId: eventDoc?._id?.toString() || order.eventId.toString(),
        userId: buyerUserId,
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
    } catch (err: any) {
      logger.error(`[getEventOrderById] Failed to generate QR code for order ${order._id}:`, err);
    }
  }

  if (isUpdated) {
    await EventOrder.updateOne(
      { _id: order._id },
      { qrCode: order.qrCode, ticketId: order.ticketId }
    );
  }

  return order;
};

/**
 * Extracts orderId and/or ticketId from flexible scanner inputs (URL param, body fields, or raw QR JSON string/object).
 */
const extractTicketIdentifiers = (
  paramIdentifier?: string,
  payload?: ScanEventTicketInput
): { orderId?: string; ticketId?: string } => {
  let orderId: string | undefined;
  let ticketId: string | undefined;

  const tryExtractFromString = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.orderId === 'string' && parsed.orderId.trim()) {
            orderId = parsed.orderId.trim();
          }
          if (typeof parsed.ticketId === 'string' && parsed.ticketId.trim()) {
            ticketId = parsed.ticketId.trim();
          }
          return;
        }
      } catch {
        // Fallback to treating as plain string identifier
      }
    }

    if (isValidObjectId(trimmed)) {
      orderId = trimmed;
    } else {
      ticketId = trimmed;
    }
  };

  if (paramIdentifier) {
    tryExtractFromString(paramIdentifier);
  }

  if (payload) {
    if (typeof payload.orderId === 'string' && payload.orderId.trim()) {
      orderId = payload.orderId.trim();
    }
    if (typeof payload.ticketId === 'string' && payload.ticketId.trim()) {
      ticketId = payload.ticketId.trim();
    }
    if (typeof payload.code === 'string' && payload.code.trim()) {
      tryExtractFromString(payload.code);
    }
    if (payload.qrData) {
      if (typeof payload.qrData === 'string') {
        tryExtractFromString(payload.qrData);
      } else if (typeof payload.qrData === 'object') {
        if (typeof payload.qrData.orderId === 'string' && payload.qrData.orderId.trim()) {
          orderId = payload.qrData.orderId.trim();
        }
        if (typeof payload.qrData.ticketId === 'string' && payload.qrData.ticketId.trim()) {
          ticketId = payload.qrData.ticketId.trim();
        }
      }
    }
  }

  return {
    ...(orderId ? { orderId } : {}),
    ...(ticketId ? { ticketId } : {}),
  };
};

/**
 * Scans, verifies, and checks in an attendee's event ticket QR code at the venue entrance.
 * Enforces single-scan entry protection so the same ticket cannot be reused.
 */
const scanEventTicket = async (
  scannerId: string,
  scannerRole: string | undefined,
  payload?: ScanEventTicketInput,
  paramIdentifier?: string
): Promise<IScanEventTicketResponse> => {
  const { orderId, ticketId } = extractTicketIdentifiers(paramIdentifier, payload);

  if (!orderId && !ticketId) {
    throw new AppError(
      'Ticket identifier is required. Provide ticketId (e.g. MOT3203920212), orderId, or scanned qrData.',
      400
    );
  }

  const orConditions: Record<string, any>[] = [];
  if (orderId && isValidObjectId(orderId)) {
    orConditions.push({ _id: new Types.ObjectId(orderId) });
  }
  if (ticketId) {
    orConditions.push({ ticketId: new RegExp(`^${escapeRegex(ticketId)}$`, 'i') });
    if (isValidObjectId(ticketId)) {
      orConditions.push({ _id: new Types.ObjectId(ticketId) });
    }
  }

  if (orConditions.length === 0) {
    throw new AppError('Invalid ticket ID or order ID format', 400);
  }

  const order = await EventOrder.findOne(
    orConditions.length === 1 ? orConditions[0]! : { $or: orConditions }
  )
    .populate('eventId', 'title description placeName images startDate endDate priceCategories')
    .populate('user', 'name email phoneNumber profileImage')
    .populate({
      path: 'hostId',
      select: 'name profileImage',
      populate: { path: 'businessProfile', select: 'businessName' },
    });

  if (!order) {
    throw new AppError('Invalid Ticket: No matching ticket found.', 404);
  }

  const hostUserId =
    (order.hostId as any)?._id?.toString() ||
    (order.hostId ? (order.hostId as any).toString() : '');

  // Verify the scanner is the event host, an active employee of the event host, or an admin
  const isAuthorized = await isActorAuthorizedForHost(scannerId, scannerRole, hostUserId);
  if (!isAuthorized) {
    throw new AppError(
      'Forbidden: This ticket belongs to another organizer\'s event. You are not authorized to scan it.',
      403
    );
  }

  if (order.status === 'CANCELLED') {
    throw new AppError(
      'Invalid Ticket: This ticket order was cancelled and refunded.',
      400
    );
  }

  const eventDoc = order.eventId as any;
  if (eventDoc?.endDate && new Date(eventDoc.endDate) < new Date()) {
    throw new AppError(
      'Expired Ticket: This event has already ended.',
      400
    );
  }

  if (order.isScanned) {
    const scannedTimeStr = order.scannedAt
      ? new Date(order.scannedAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : 'earlier';
    throw new AppError(
      `Already Scanned: This ticket (${order.ticketId || order._id}) was already used for entry at ${scannedTimeStr}.`,
      400
    );
  }

  const scannedAt = new Date();
  const updatedOrder = await EventOrder.findOneAndUpdate(
    {
      _id: order._id,
      isScanned: { $ne: true },
      status: { $in: ['PAID', 'COMPLETED'] },
    },
    {
      $set: {
        isScanned: true,
        scannedAt,
        ...(isValidObjectId(scannerId) ? { scannedBy: new Types.ObjectId(scannerId) } : {}),
      },
    },
    { new: true }
  )
    .populate('eventId', 'title description placeName images startDate endDate priceCategories')
    .populate('user', 'name email phoneNumber profileImage')
    .populate({
      path: 'hostId',
      select: 'name profileImage',
      populate: { path: 'businessProfile', select: 'businessName' },
    });

  if (!updatedOrder) {
    throw new AppError(
      'Already Scanned: This ticket has already been used for entry.',
      400
    );
  }

  const hostDoc = updatedOrder.hostId as any;
  const buyerDoc = updatedOrder.user as any;
  const updatedEventDoc = updatedOrder.eventId as any;
  const organizerName =
    hostDoc?.businessProfile?.businessName || hostDoc?.name || 'Music of Tour';

  logger.info(
    `[EventOrderService] Ticket ${updatedOrder.ticketId || updatedOrder._id} scanned for entry by ${scannerId} (${scannerRole})`
  );

  return {
    isValid: true,
    statusText: 'This Ticket is Valid.',
    ticketId: updatedOrder.ticketId || '',
    orderId: updatedOrder._id.toString(),
    qrCode: updatedOrder.qrCode || '',
    event: updatedEventDoc?.title || 'Event',
    eventLocation: updatedEventDoc?.placeName || '',
    dateTime: formatEventDateTime(updatedEventDoc?.startDate || updatedOrder.createdAt),
    eventOrganizer: organizerName,
    isScanned: true,
    scannedAt: updatedOrder.scannedAt || scannedAt,
    totalTicketQuantity: updatedOrder.totalTicketQuantity,
    totalAmount: updatedOrder.totalAmount,
    tickets: updatedOrder.tickets || [],
    attendee:
      buyerDoc && typeof buyerDoc === 'object' && buyerDoc._id
        ? {
            _id: buyerDoc._id.toString(),
            name: buyerDoc.name || '',
            email: buyerDoc.email || '',
            ...(buyerDoc.phoneNumber ? { phoneNumber: buyerDoc.phoneNumber } : {}),
            ...(buyerDoc.profileImage ? { profileImage: buyerDoc.profileImage } : {}),
          }
        : null,
    order: updatedOrder,
  };
};

/**
 * Retrieves the dashboard list of scanned event tickets.
 * - For Host Employees (role === 'EMPLOYEE'): strictly returns ONLY tickets scanned by this specific employee (`scannedBy: actorId`).
 * - For Hosts (role === 'HOST'): returns scanned tickets for events owned by the host (`hostId: actorId`).
 */
const getScannedEventTickets = async (
  actorId: string,
  actorRole: string | undefined,
  query: IScannedTicketsQuery
): Promise<{
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data: IScannedTicketDashboardItem[];
}> => {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.max(1, parseInt(String(query.limit || '10'), 10) || 10);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {
    isScanned: true,
  };

  if (actorRole === 'EMPLOYEE') {
    const employee = await Employee.findById(actorId)
      .select('_id employerId employerType isActive')
      .lean();

    if (!employee || !employee.isActive) {
      throw new AppError('Employee account is inactive or not found.', 403);
    }

    if (employee.employerType !== 'HOST') {
      throw new AppError(
        'Forbidden: Only Host employees can access event scanned tickets.',
        403
      );
    }

    // Strict isolation: Host Employee can ONLY see tickets that they personally scanned
    filter.scannedBy = new Types.ObjectId(actorId);
  } else if (actorRole === 'HOST' || actorRole === 'BUSINESS') {
    filter.hostId = new Types.ObjectId(actorId);
  } else if (actorRole !== 'ADMIN') {
    throw new AppError('Not authorized to view scanned tickets', 403);
  }

  if (query.eventId && isValidObjectId(query.eventId)) {
    filter.eventId = new Types.ObjectId(query.eventId);
  }

  if (query.search && query.search.trim()) {
    const searchRegex = new RegExp(escapeRegex(query.search.trim()), 'i');
    const matchingEvents = await Event.find({ title: searchRegex })
      .select('_id')
      .lean();
    const matchingEventIds = matchingEvents.map((e) => e._id);

    filter.$or = [
      { ticketId: searchRegex },
      ...(matchingEventIds.length > 0 ? [{ eventId: { $in: matchingEventIds } }] : []),
    ];
  }

  const [orders, total] = await Promise.all([
    EventOrder.find(filter)
      .populate('eventId', 'title placeName startDate endDate images')
      .populate('user', 'name email phoneNumber profileImage')
      .sort({ scannedAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    EventOrder.countDocuments(filter),
  ]);

  const totalPage = Math.ceil(total / limit);

  const formattedItems: IScannedTicketDashboardItem[] = orders.map((order) => {
    const eventDoc = order.eventId as any;
    const buyerDoc = order.user as any;
    const displayDate = order.scannedAt || eventDoc?.startDate || order.createdAt;

    return {
      _id: order._id as Types.ObjectId,
      orderId: order._id.toString(),
      ticketId: order.ticketId || '',
      eventName: eventDoc?.title || 'Event',
      dateTime: formatEventDateTime(displayDate),
      scannedAt: order.scannedAt,
      eventStartDate: eventDoc?.startDate,
      eventLocation: eventDoc?.placeName || '',
      totalTicketQuantity: order.totalTicketQuantity,
      totalAmount: order.totalAmount,
      tickets: order.tickets || [],
      attendee:
        buyerDoc && typeof buyerDoc === 'object' && buyerDoc._id
          ? {
              _id: buyerDoc._id.toString(),
              name: buyerDoc.name || '',
              email: buyerDoc.email || '',
              ...(buyerDoc.phoneNumber ? { phoneNumber: buyerDoc.phoneNumber } : {}),
              ...(buyerDoc.profileImage ? { profileImage: buyerDoc.profileImage } : {}),
            }
          : null,
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: formattedItems,
  };
};

export const EventOrderService = {
  createEventOrder,
  getMyEventOrders,
  getEventOrderById,
  scanEventTicket,
  getScannedEventTickets,
};
