import { Schema, model } from 'mongoose';
import type { IUserHostPoint, IEventReferral } from './referral.interface.js';

const UserHostPointSchema = new Schema<IUserHostPoint>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host ID is required'],
      index: true,
    },
    points: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Points balance cannot be negative'],
    },
    totalEarned: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total earned points cannot be negative'],
    },
    totalSpent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total spent points cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring one point ledger entry per user-host pair
UserHostPointSchema.index({ user: 1, hostId: 1 }, { unique: true });

export const UserHostPoint = model<IUserHostPoint>('UserHostPoint', UserHostPointSchema);

const EventReferralSchema = new Schema<IEventReferral>(
  {
    referrer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Referrer user ID is required'],
      index: true,
    },
    referee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Referee buyer user ID is required'],
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host ID is required'],
      index: true,
    },
    eventOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'EventOrder',
      index: true,
    },
    pointsAwarded: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
      default: 'COMPLETED',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying a buyer's referrals per event or checking prior orders
EventReferralSchema.index({ referee: 1, eventId: 1 });
EventReferralSchema.index({ referrer: 1, createdAt: -1 });

export const EventReferral = model<IEventReferral>('EventReferral', EventReferralSchema);

