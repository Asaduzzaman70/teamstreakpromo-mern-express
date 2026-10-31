import type { Document, Types } from 'mongoose';

export type EventReferralStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface IUserHostPoint extends Document {
  user: Types.ObjectId;
  hostId: Types.ObjectId;
  points: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventReferral extends Document {
  referrer: Types.ObjectId;
  referee: Types.ObjectId;
  eventId: Types.ObjectId;
  hostId: Types.ObjectId;
  eventOrderId?: Types.ObjectId;
  pointsAwarded: number;
  status: EventReferralStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreditReferralInput {
  referrerCode: string;
  buyerId: string | Types.ObjectId;
  eventId: string | Types.ObjectId;
  hostId: string | Types.ObjectId;
  eventOrderId?: string | Types.ObjectId;
  points?: number;
}

export interface IUserHostPointResponse {
  hostId: string;
  hostName: string;
  businessName?: string;
  points: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: Date;
}

export interface IEventReferralLinkResponse {
  eventId: string;
  referralCode: string;
  referralLink: string;
  hostId: string;
  currentHostPoints: number;
}

