import { Schema, model } from 'mongoose';
import type { ISupportTicket, ISupportMessage } from './customerSupport.interface.js';

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    senderName: {
      type: String,
      trim: true,
      default: '',
    },
    senderRole: {
      type: String,
      enum: ['USER', 'HOST', 'BUSINESS', 'ADMIN'],
      required: [true, 'Sender role is required'],
    },
    isSupportReply: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: {
      type: String,
      required: [true, 'Ticket ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    userRole: {
      type: String,
      enum: ['USER', 'HOST', 'BUSINESS', 'ADMIN'],
      required: [true, 'User role is required'],
    },
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Problem details are required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    status: {
      type: String,
      enum: ['UNDER_REVIEW', 'SOLVED', 'CLOSED', 'Under review', 'Solved', 'Closed'],
      default: 'UNDER_REVIEW',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    messages: {
      type: [SupportMessageSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user list and admin listing queries
SupportTicketSchema.index({ userId: 1, isDeleted: 1, status: 1 });
SupportTicketSchema.index({ isDeleted: 1, lastMessageAt: -1 });

export const SupportTicket = model<ISupportTicket>('SupportTicket', SupportTicketSchema);
