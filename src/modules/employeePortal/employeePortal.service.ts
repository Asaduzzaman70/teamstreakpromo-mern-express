import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import { formatEventDateTime } from '../../utils/qrCode.js';
import logger from '../../utils/logger.js';
import { Employee } from './employeePortal.model.js';
import { Event } from '../event/event.model.js';
import { EventOrder } from '../eventOrder/eventOrder.model.js';
import { Marketplace } from '../marketplace/marketplace.model.js';
import { Order } from '../order/order.model.js';
import type { EmployerType } from '../employee/employee.interface.js';
import type {
  IEmployeeScanTicketInput,
  IEmployeeScannedTicketsQuery,
  IEmployeeBusinessRewardsQuery,
  IEmployeeBusinessOrdersQuery,
} from './employeePortal.interface.js';

const isValidObjectId = (id: string): boolean =>
  Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id;

const verifyActiveEmployeeType = async (
  employeeId: string,
  expectedType: EmployerType
) => {
  const employee = await Employee.findById(employeeId)
    .select('_id name email employerId employerType isActive')
    .lean();

  if (!employee || !employee.isActive) {
    throw new AppError('Employee account is inactive or not found.', 403);
  }

  if (employee.employerType !== expectedType) {
    throw new AppError(
      `Forbidden: This endpoint is restricted to ${expectedType} employees only.`,
      403
    );
  }

  return employee;
};

// ============================================================================
// 1. HOST EMPLOYEE OPERATIONS (SELF-CONTAINED TICKET SCAN & SCANNED DASHBOARD)
// ============================================================================

const extractTicketIdentifiers = (
  paramIdentifier?: string,
  payload?: IEmployeeScanTicketInput
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
        // Fallback to plain identifier
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

export const scanHostEmployeeTicketService = async (
  employeeId: string,
  payload?: IEmployeeScanTicketInput,
  paramIdentifier?: string
) => {
  const employee = await verifyActiveEmployeeType(employeeId, 'HOST');
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

  const ticketHostId =
    (order.hostId as any)?._id?.toString() ||
    (order.hostId ? (order.hostId as any).toString() : '');

  if (ticketHostId !== employee.employerId.toString()) {
    throw new AppError(
      "Forbidden: This ticket belongs to another organizer's event. You are not authorized to scan it.",
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
    throw new AppError('Expired Ticket: This event has already ended.', 400);
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
        scannedBy: new Types.ObjectId(employeeId),
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
    throw new AppError('Already Scanned: This ticket has already been used for entry.', 400);
  }

  const hostDoc = updatedOrder.hostId as any;
  const buyerDoc = updatedOrder.user as any;
  const updatedEventDoc = updatedOrder.eventId as any;
  const organizerName =
    hostDoc?.businessProfile?.businessName || hostDoc?.name || 'Music of Tour';

  logger.info(
    `[EmployeePortal] Ticket ${updatedOrder.ticketId || updatedOrder._id} scanned by Host Employee ${employeeId}`
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

export const getHostEmployeeScannedTicketsService = async (
  employeeId: string,
  query: IEmployeeScannedTicketsQuery
) => {
  await verifyActiveEmployeeType(employeeId, 'HOST');

  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.max(1, parseInt(String(query.limit || '10'), 10) || 10);
  const skip = (page - 1) * limit;

  // Strict isolation: Host Employee ONLY sees tickets scanned by themselves
  const filter: Record<string, any> = {
    isScanned: true,
    scannedBy: new Types.ObjectId(employeeId),
  };

  if (query.eventId && isValidObjectId(String(query.eventId))) {
    filter.eventId = new Types.ObjectId(String(query.eventId));
  }

  if (query.search && String(query.search).trim()) {
    const searchRegex = new RegExp(escapeRegex(String(query.search).trim()), 'i');
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

  const data = orders.map((order) => {
    const eventDoc = order.eventId as any;
    const buyerDoc = order.user as any;
    const displayDate = order.scannedAt || eventDoc?.startDate || order.createdAt;

    return {
      _id: order._id,
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
    data,
  };
};

export const getHostEmployeeScannedTicketByIdService = async (
  employeeId: string,
  identifier: string
): Promise<any> => {
  await verifyActiveEmployeeType(employeeId, 'HOST');

  const trimmedId = identifier.trim();
  const idCondition = isValidObjectId(trimmedId)
    ? { $or: [{ _id: new Types.ObjectId(trimmedId) }, { ticketId: trimmedId }] }
    : { ticketId: new RegExp(`^${escapeRegex(trimmedId)}$`, 'i') };

  const order = await EventOrder.findOne({
    ...idCondition,
    isScanned: true,
    scannedBy: new Types.ObjectId(employeeId),
  })
    .populate('eventId', 'title description placeName images startDate endDate priceCategories')
    .populate('user', 'name email phoneNumber profileImage')
    .populate({
      path: 'hostId',
      select: 'name profileImage',
      populate: { path: 'businessProfile', select: 'businessName' },
    });

  if (!order) {
    throw new AppError(
      'Scanned ticket not found or was not scanned by your account.',
      404
    );
  }

  return order;
};

// ============================================================================
// 2. BUSINESS PARTNER EMPLOYEE OPERATIONS (SELF-CONTAINED READ-ONLY REWARDS & ORDERS)
// ============================================================================

const formatBusinessRewardItem = (item: any) => {
  const doc = item.toObject ? item.toObject() : item;
  const user = doc.businessOwnerId || {};
  const profile = user.businessProfile || {};

  const businessProfile = {
    rating: profile.rating ?? user.rating ?? 0,
    sold: profile.sold ?? user.sold ?? 0,
    businessName: profile.businessName || user.name || '',
    businessDescription: profile.businessDescription || '',
    location: profile.location || doc.location || '',
    profileImage: user.profileImage || '',
  };

  const { businessOwnerId, ...rest } = doc;

  return {
    ...rest,
    businessProfile,
  };
};

export const getBusinessEmployeeRewardsService = async (
  employeeId: string,
  query: IEmployeeBusinessRewardsQuery
) => {
  const employee = await verifyActiveEmployeeType(employeeId, 'BUSINESS');

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {
    businessOwnerId: employee.employerId.toString() as any,
  };

  if (query.search && String(query.search).trim()) {
    filter.title = {
      $regex: escapeRegex(String(query.search).trim()),
      $options: 'i',
    };
  }

  if (query.categoryId && isValidObjectId(String(query.categoryId))) {
    filter.category = query.categoryId;
  }

  if (query.subCategoryId && isValidObjectId(String(query.subCategoryId))) {
    filter.subCategory = query.subCategoryId;
  }

  if (query.isActive !== undefined) {
    filter.isActive =
      typeof query.isActive === 'string'
        ? query.isActive === 'true'
        : Boolean(query.isActive);
  }

  const [items, total] = await Promise.all([
    Marketplace.find(filter)
      .populate([
        {
          path: 'businessOwnerId',
          select: 'name email phoneNumber profileImage role rating sold',
          populate: {
            path: 'businessProfile',
            select: 'businessName businessDescription location verificationStatus rating sold',
          },
        },
        { path: 'category', select: 'name description' },
        { path: 'subCategory', select: 'name description' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Marketplace.countDocuments(filter),
  ]);

  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    result: items.map(formatBusinessRewardItem),
  };
};

export const getBusinessEmployeeRewardByIdService = async (
  employeeId: string,
  rewardId: string
) => {
  const employee = await verifyActiveEmployeeType(employeeId, 'BUSINESS');

  if (!isValidObjectId(rewardId)) {
    throw new AppError('Invalid reward ID format', 400);
  }

  const item = await Marketplace.findOne({
    _id: rewardId,
    businessOwnerId: employee.employerId.toString() as any,
  }).populate([
    {
      path: 'businessOwnerId',
      select: 'name email phoneNumber profileImage role rating sold',
      populate: {
        path: 'businessProfile',
        select: 'businessName businessDescription location verificationStatus rating sold',
      },
    },
    { path: 'category', select: 'name description' },
    { path: 'subCategory', select: 'name description' },
  ]);

  if (!item) {
    throw new AppError(
      'Reward item not found or does not belong to your Business Partner.',
      404
    );
  }

  return formatBusinessRewardItem(item);
};

export const getBusinessEmployeeOrdersService = async (
  employeeId: string,
  query: IEmployeeBusinessOrdersQuery
) => {
  const employee = await verifyActiveEmployeeType(employeeId, 'BUSINESS');

  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.max(1, parseInt(String(query.limit || '10'), 10) || 10);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {
    businessOwnerId: employee.employerId,
    itemType: 'MARKETPLACE',
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.itemId && isValidObjectId(String(query.itemId))) {
    filter.itemId = new Types.ObjectId(String(query.itemId));
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('itemId', 'title description location photos points quantity claimQuantity')
      .populate('user', 'name email phoneNumber profileImage')
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const totalPage = Math.ceil(total / limit);

  const data = orders.map((order) => {
    const marketplace = (order.itemId as any) || {};
    return {
      _id: order._id,
      orderId: order._id.toString(),
      itemType: order.itemType,
      itemId: marketplace._id || order.itemId,
      title: marketplace.title || '',
      photos: marketplace.photos || [],
      description: marketplace.description || '',
      location: marketplace.location || '',
      points: order.itemPoints || marketplace.points || 0,
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
    data,
  };
};

export const getBusinessEmployeeOrderByIdService = async (
  employeeId: string,
  orderId: string
): Promise<any> => {
  const employee = await verifyActiveEmployeeType(employeeId, 'BUSINESS');

  if (!isValidObjectId(orderId)) {
    throw new AppError('Invalid order ID format', 400);
  }

  const order = await Order.findOne({
    _id: new Types.ObjectId(orderId),
    businessOwnerId: employee.employerId,
    itemType: 'MARKETPLACE',
  })
    .populate('itemId')
    .populate('businessOwnerId', 'name email role profileImage phoneNumber')
    .populate('user', 'name email role profileImage phoneNumber');

  if (!order) {
    throw new AppError(
      'Order not found or does not belong to your Business Partner.',
      404
    );
  }

  const orderObj = order.toObject ? order.toObject() : order;
  return {
    ...orderObj,
    isRedeemed: order.status === 'REDEEMED',
  };
};

