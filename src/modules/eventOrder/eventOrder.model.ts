import { Schema, model } from 'mongoose';
import type { IEventOrder } from './eventOrder.interface.js';

const EventOrderTicketSchema = new Schema(
  {
    priceCategoryId: {
      type: Schema.Types.ObjectId,
    },
    categoryName: {
      type: String,
      trim: true,
      default: 'General',
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false }
);

const EventOrderSchema = new Schema<IEventOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host ID is required'],
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    tickets: {
      type: [EventOrderTicketSchema],
      default: [],
    },
    totalTicketQuantity: {
      type: Number,
      required: [true, 'Total ticket quantity is required'],
      min: [1, 'Total ticket quantity must be at least 1'],
      default: 1,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
      default: 0,
    },
    stripeSessionId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PAID', 'CANCELLED', 'COMPLETED'],
      default: 'PAID',
    },
    payoutStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'SKIPPED'],
      default: 'PENDING',
    },
    hostPayoutAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    platformFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    stripeTransferId: {
      type: String,
      trim: true,
    },
    stripeRefundId: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    pointsEarned: {
      type: Number,
      default: 0,
      min: [0, 'Points earned cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

export const EventOrder = model<IEventOrder>('EventOrder', EventOrderSchema);
