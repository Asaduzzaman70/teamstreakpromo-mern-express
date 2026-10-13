import mongoose from 'mongoose';
import { SupportTicket } from './customerSupport.model.js';
import { User } from '../auth/auth.model.js';
import { AppError } from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import {
  SupportTicketStatus,
  type CreateSupportTicketInput,
  type SendSupportMessageInput,
  type ISupportTicketQuery,
  type ISupportTicketListResult,
  type IFormattedSupportTicket,
  type IFormattedSupportMessage,
  type ISupportStatusBadge,
  type ITicketMessagesResult,
} from './customerSupport.interface.js';

/**
 * Format relative time (e.g. "Just now", "5m ago", "2h ago")
 */
export const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format a single message into a developer-friendly structure
 */
export const formatMessage = (
  msg: any,
  currentUserId?: string,
  userAvatar = ''
): IFormattedSupportMessage => {
  const isSupport = Boolean(msg.isSupportReply || msg.senderRole === 'ADMIN');
  const isMyMessage = Boolean(
    currentUserId && msg.senderId && msg.senderId.toString() === currentUserId.toString()
  );
  const msgDate = new Date(msg.createdAt || Date.now());

  return {
    _id: msg._id?.toString() || '',
    senderId: msg.senderId?.toString() || '',
    senderName: isSupport ? 'Customer Support' : msg.senderName || 'User',
    senderRole: msg.senderRole || 'USER',
    senderType: isSupport ? 'SUPPORT' : 'USER',
    isSupportReply: isSupport,
    isMyMessage,
    alignment: isMyMessage ? 'right' : 'left',
    avatar: isSupport ? '' : userAvatar,
    message: msg.message,
    createdAt: msgDate,
    formattedTime: msgDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    formattedDate: msgDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    timeAgo: formatTimeAgo(msgDate),
  };
};

/**
 * Normalize any status input to canonical SupportTicketStatus enum
 */
export const normalizeStatus = (status: string): SupportTicketStatus => {
  const s = status.toUpperCase().replace(/\s+/g, '_');
  if (s === 'SOLVED') return SupportTicketStatus.SOLVED;
  if (s === 'CLOSED') return SupportTicketStatus.CLOSED;
  return SupportTicketStatus.UNDER_REVIEW;
};

/**
 * Get display label for UI representation
 */
export const getStatusLabel = (status: string): string => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case SupportTicketStatus.SOLVED:
      return 'Solved';
    case SupportTicketStatus.CLOSED:
      return 'Closed';
    case SupportTicketStatus.UNDER_REVIEW:
    default:
      return 'Under review';
  }
};

/**
 * Get UI status badge metadata (color, dotColor, display text)
 */
export const getStatusBadge = (status: string): ISupportStatusBadge => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case SupportTicketStatus.SOLVED:
      return {
        text: 'Solved',
        color: '#10B981', // emerald-500
        dotColor: 'green',
      };
    case SupportTicketStatus.CLOSED:
      return {
        text: 'Closed',
        color: '#6B7280', // gray-500
        dotColor: 'gray',
      };
    case SupportTicketStatus.UNDER_REVIEW:
    default:
      return {
        text: 'Under review',
        color: '#F59E0B', // amber-500
        dotColor: 'amber',
      };
  }
};

/**
 * Format raw database ticket into a developer-friendly response structure
 */
export const formatTicketResponse = (
  ticket: any,
  includeMessages = false,
  currentUserId?: string
): IFormattedSupportTicket => {
  const ticketObj = ticket.toObject ? ticket.toObject() : { ...ticket };
  const rawStatus = ticketObj.status || SupportTicketStatus.UNDER_REVIEW;
  const canonicalStatus = normalizeStatus(String(rawStatus));
  const statusLabel = getStatusLabel(String(rawStatus));
  const statusBadge = getStatusBadge(String(rawStatus));

  const totalMessages = Array.isArray(ticketObj.messages) ? ticketObj.messages.length : 0;
  const lastMsg = totalMessages > 0 ? ticketObj.messages[totalMessages - 1] : null;

  const userAvatar =
    ticketObj.userId && typeof ticketObj.userId === 'object'
      ? ticketObj.userId.profileImage || ''
      : '';

  const formatted: IFormattedSupportTicket = {
    _id: ticketObj._id.toString(),
    ticketId: ticketObj.ticketId,
    title: ticketObj.title,
    description: ticketObj.description,
    status: canonicalStatus,
    statusLabel,
    statusBadge,
    priority: ticketObj.priority || 'MEDIUM',
    totalMessages,
    lastMessage: lastMsg ? formatMessage(lastMsg, currentUserId, userAvatar) : null,
    user:
      ticketObj.userId && typeof ticketObj.userId === 'object' && ticketObj.userId._id
        ? {
            _id: ticketObj.userId._id.toString(),
            name: ticketObj.userId.name || '',
            email: ticketObj.userId.email || '',
            profileImage: ticketObj.userId.profileImage || '',
            role: ticketObj.userId.role || ticketObj.userRole,
          }
        : null,
    createdAt: ticketObj.createdAt,
    updatedAt: ticketObj.updatedAt,
    lastMessageAt: ticketObj.lastMessageAt || ticketObj.updatedAt,
  };

  if (includeMessages) {
    formatted.messages = (ticketObj.messages || []).map((msg: any) =>
      formatMessage(msg, currentUserId, userAvatar)
    );
  }

  return formatted;
};

/**
 * Generate a unique Ticket ID in MOT format (e.g., MOT3203920212)
 */
const generateUniqueTicketId = async (): Promise<string> => {
  let isUnique = false;
  let candidateTicketId = '';

  while (!isUnique) {
    const timestampPart = Date.now().toString().slice(-6);
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    candidateTicketId = `MOT${timestampPart}${randomPart}`;

    const existing = await SupportTicket.findOne({ ticketId: candidateTicketId });
    if (!existing) {
      isUnique = true;
    }
  }

  return candidateTicketId;
};

/**
 * Create a new Customer Support Ticket
 */
export const createTicketService = async (
  userId: string,
  input: CreateSupportTicketInput
): Promise<IFormattedSupportTicket> => {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw new AppError('User not found or account is deactivated', 404);
  }

  const ticketId = await generateUniqueTicketId();

  const initialMessage = {
    senderId: user._id as any,
    senderName: user.name,
    senderRole: user.role,
    isSupportReply: false,
    message: input.description.trim(),
    createdAt: new Date(),
  };

  const newTicket = await SupportTicket.create({
    ticketId,
    userId: user._id,
    userRole: user.role,
    title: input.title.trim(),
    description: input.description.trim(),
    status: SupportTicketStatus.UNDER_REVIEW,
    priority: input.priority || 'MEDIUM',
    messages: [initialMessage],
    lastMessageAt: new Date(),
    isDeleted: false,
  });

  logger.info(`Customer support ticket created: ${ticketId} by user: ${userId} (${user.role})`);

  const populatedTicket = await SupportTicket.findById(newTicket._id).populate(
    'userId',
    'name email profileImage role'
  );

  return formatTicketResponse(populatedTicket, true, userId);
};

/**
 * Get logged-in user's support tickets ("My Support" screen)
 */
export const getMyTicketsService = async (
  userId: string,
  query: ISupportTicketQuery
): Promise<ISupportTicketListResult> => {
  const filter: Record<string, any> = {
    userId: new mongoose.Types.ObjectId(userId),
    isDeleted: false,
  };

  // Status filtering
  if (query.status && query.status !== 'all') {
    const normalized = normalizeStatus(query.status);
    const label = getStatusLabel(query.status);
    filter.status = { $in: [normalized, label] };
  }

  // Search keyword in title, description, or ticketId
  if (query.search && query.search.trim()) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { ticketId: searchRegex },
    ];
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const [total, tickets] = await Promise.all([
    SupportTicket.countDocuments(filter),
    SupportTicket.find(filter)
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email profileImage role'),
  ]);

  const totalPage = Math.ceil(total / limit) || 1;

  const formattedTickets = tickets.map((t) => formatTicketResponse(t, false, userId));

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    result: formattedTickets,
  };
};

/**
 * Get single support ticket details and conversation thread
 */
export const getTicketByIdService = async (
  identifier: string,
  currentUserId: string,
  currentUserRole: string
): Promise<IFormattedSupportTicket> => {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  const query = isObjectId
    ? { $or: [{ _id: identifier }, { ticketId: identifier }], isDeleted: false }
    : { ticketId: identifier, isDeleted: false };

  const ticket = await SupportTicket.findOne(query).populate(
    'userId',
    'name email profileImage role'
  );

  if (!ticket) {
    throw new AppError('Support ticket not found', 404);
  }

  // Regular users can only access their own support tickets
  if (currentUserRole !== 'ADMIN' && ticket.userId._id.toString() !== currentUserId) {
    throw new AppError('Forbidden: You do not have permission to view this support ticket', 403);
  }

  return formatTicketResponse(ticket, true, currentUserId);
};

/**
 * Get messages only for a specific support ticket
 */
export const getTicketMessagesService = async (
  identifier: string,
  currentUserId: string,
  currentUserRole: string
): Promise<ITicketMessagesResult> => {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  const query = isObjectId
    ? { $or: [{ _id: identifier }, { ticketId: identifier }], isDeleted: false }
    : { ticketId: identifier, isDeleted: false };

  const ticket = await SupportTicket.findOne(query).populate(
    'userId',
    'name email profileImage role'
  );

  if (!ticket) {
    throw new AppError('Support ticket not found', 404);
  }

  if (currentUserRole !== 'ADMIN' && ticket.userId._id.toString() !== currentUserId) {
    throw new AppError('Forbidden: You do not have permission to view this support ticket', 403);
  }

  const userAvatar = (ticket.userId as any)?.profileImage || '';
  const messages = (ticket.messages || []).map((msg: any) =>
    formatMessage(msg, currentUserId, userAvatar)
  );

  const rawStatus = ticket.status || SupportTicketStatus.UNDER_REVIEW;

  return {
    ticketId: ticket.ticketId,
    status: normalizeStatus(String(rawStatus)),
    statusLabel: getStatusLabel(String(rawStatus)),
    statusBadge: getStatusBadge(String(rawStatus)),
    totalMessages: messages.length,
    messages,
  };
};

/**
 * Send a message/reply in a support ticket thread
 */
export const sendTicketMessageService = async (
  identifier: string,
  senderId: string,
  input: SendSupportMessageInput
): Promise<IFormattedSupportTicket> => {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  const query = isObjectId
    ? { $or: [{ _id: identifier }, { ticketId: identifier }], isDeleted: false }
    : { ticketId: identifier, isDeleted: false };

  const ticket = await SupportTicket.findOne(query);
  if (!ticket) {
    throw new AppError('Support ticket not found', 404);
  }

  const sender = await User.findById(senderId);
  if (!sender || sender.isDeleted) {
    throw new AppError('Sender user not found or deactivated', 404);
  }

  const isSupportReply = sender.role === 'ADMIN';

  // Permission check: only ticket owner or admin/support agent can reply
  if (!isSupportReply && ticket.userId.toString() !== senderId) {
    throw new AppError('Forbidden: You do not have permission to reply to this ticket', 403);
  }

  const newMessage = {
    senderId: sender._id as any,
    senderName: isSupportReply ? 'Customer Support' : sender.name,
    senderRole: sender.role,
    isSupportReply,
    message: input.message.trim(),
    createdAt: new Date(),
  };

  ticket.messages.push(newMessage as any);
  ticket.lastMessageAt = new Date();

  // If user replies to an already solved or closed ticket, automatically reopen as UNDER_REVIEW
  if (
    !isSupportReply &&
    (ticket.status === SupportTicketStatus.SOLVED ||
      ticket.status === 'Solved' ||
      ticket.status === SupportTicketStatus.CLOSED ||
      ticket.status === 'Closed')
  ) {
    ticket.status = SupportTicketStatus.UNDER_REVIEW;
  }

  await ticket.save();

  logger.info(
    `Message added to support ticket ${ticket.ticketId} by ${sender.name} (${sender.role})`
  );

  const populatedTicket = await SupportTicket.findById(ticket._id).populate(
    'userId',
    'name email profileImage role'
  );

  const formattedTicket = formatTicketResponse(populatedTicket, true, senderId);
  const formattedNewMessage = formatMessage(
    ticket.messages[ticket.messages.length - 1],
    senderId,
    sender.profileImage || ''
  );

  return {
    ...formattedTicket,
    sentMessage: formattedNewMessage,
  };
};

/**
 * Admin: Get all support tickets across all users with filters and pagination
 */
export const adminGetAllTicketsService = async (
  query: ISupportTicketQuery
): Promise<ISupportTicketListResult> => {
  const filter: Record<string, any> = {
    isDeleted: false,
  };

  // Status filter
  if (query.status && query.status !== 'all') {
    const normalized = normalizeStatus(query.status);
    const label = getStatusLabel(query.status);
    filter.status = { $in: [normalized, label] };
  }

  // User role filter
  if (query.userRole && query.userRole !== 'all') {
    filter.userRole = query.userRole;
  }

  // Keyword search
  if (query.search && query.search.trim()) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { ticketId: searchRegex },
    ];
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || 'lastMessageAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sortOption: Record<string, 1 | -1> = { [sortBy]: sortOrder };

  const [total, tickets] = await Promise.all([
    SupportTicket.countDocuments(filter),
    SupportTicket.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email profileImage role'),
  ]);

  const totalPage = Math.ceil(total / limit) || 1;

  const formattedTickets = tickets.map((t) => formatTicketResponse(t, false));

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    result: formattedTickets,
  };
};

/**
 * Admin: Update support ticket status ('UNDER_REVIEW', 'SOLVED', 'CLOSED')
 */
export const adminUpdateTicketStatusService = async (
  identifier: string,
  status: string
): Promise<IFormattedSupportTicket> => {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  const query = isObjectId
    ? { $or: [{ _id: identifier }, { ticketId: identifier }], isDeleted: false }
    : { ticketId: identifier, isDeleted: false };

  const ticket = await SupportTicket.findOne(query);
  if (!ticket) {
    throw new AppError('Support ticket not found', 404);
  }

  const normalizedStatus = normalizeStatus(status);
  ticket.status = normalizedStatus;
  await ticket.save();

  logger.info(`Admin updated support ticket ${ticket.ticketId} status to '${normalizedStatus}'`);

  const updatedTicket = await SupportTicket.findById(ticket._id).populate(
    'userId',
    'name email profileImage role'
  );

  return formatTicketResponse(updatedTicket, true);
};
