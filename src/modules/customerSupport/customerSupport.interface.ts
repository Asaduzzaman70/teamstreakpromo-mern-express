import type { Document, Types } from 'mongoose';

export enum SupportTicketStatus {
  UNDER_REVIEW = 'UNDER_REVIEW',
  SOLVED = 'SOLVED',
  CLOSED = 'CLOSED',
}

export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type SupportSenderRole = 'USER' | 'HOST' | 'BUSINESS' | 'ADMIN';
export type SupportSenderType = 'USER' | 'SUPPORT';
export type MessageBubbleAlignment = 'left' | 'right';

export interface ISupportStatusBadge {
  text: string;
  color: string;
  dotColor: 'amber' | 'green' | 'gray';
}

export interface ISupportMessage {
  _id?: Types.ObjectId;
  senderId: Types.ObjectId;
  senderName: string;
  senderRole: SupportSenderRole;
  isSupportReply: boolean;
  message: string;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  ticketId: string;
  userId: Types.ObjectId;
  userRole: SupportSenderRole;
  title: string;
  description: string;
  status: SupportTicketStatus | string;
  priority: SupportTicketPriority;
  messages: ISupportMessage[];
  lastMessageAt: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFormattedSupportMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole: SupportSenderRole;
  senderType: SupportSenderType;
  isSupportReply: boolean;
  isMyMessage: boolean;
  alignment: MessageBubbleAlignment;
  avatar?: string;
  message: string;
  createdAt: Date;
  formattedTime: string;
  formattedDate: string;
  timeAgo: string;
}

export interface IFormattedSupportTicket {
  _id: string;
  ticketId: string;
  title: string;
  description: string;
  status: SupportTicketStatus;
  statusLabel: string;
  statusBadge: ISupportStatusBadge;
  priority: SupportTicketPriority;
  totalMessages: number;
  lastMessage?: (IFormattedSupportMessage & { preview?: string }) | null;
  user?: {
    _id: string;
    name: string;
    email: string;
    profileImage: string;
    role: SupportSenderRole;
  } | null;
  messages?: IFormattedSupportMessage[];
  sentMessage?: IFormattedSupportMessage;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

export interface CreateSupportTicketInput {
  title: string;
  description: string;
  priority?: SupportTicketPriority;
}

export interface SendSupportMessageInput {
  message: string;
}

export interface UpdateSupportTicketStatusInput {
  status: SupportTicketStatus | string;
}

export interface ISupportTicketQuery {
  page?: string | number;
  limit?: string | number;
  status?: string;
  search?: string;
  userRole?: SupportSenderRole | 'all';
  sortBy?: 'createdAt' | 'lastMessageAt' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ISupportTicketListResult {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  result: IFormattedSupportTicket[];
}

export interface ITicketMessagesResult {
  ticketId: string;
  status: SupportTicketStatus;
  statusLabel: string;
  statusBadge: ISupportStatusBadge;
  totalMessages: number;
  messages: IFormattedSupportMessage[];
}
