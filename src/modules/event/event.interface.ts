import type { Document, Types } from 'mongoose';
import type { z } from 'zod';
import type { createEventSchema } from './event.validation.js';

export interface IArtistInfo {
  name: string;
  role?: string;
  image?: string;
  socialMediaLinks?: Record<string, string>;
}

export interface IReward {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  pointsRequired: number;
  stock: number;
  image: string;
}

export interface IEvent extends Document {
  hostId: Types.ObjectId;
  categoryId: Types.ObjectId;
  title: string;
  latitude: number;
  longitude: number;
  ageRestriction: number;
  placeName: string;
  description: string;
  startDate: Date;
  endDate: Date;
  ticketPrice: number;
  images: string[];
  artistInfo: IArtistInfo[];
  rewards: IReward[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateEventInput = z.infer<typeof createEventSchema>;

export interface EventQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  categoryId?: string;
  hostId?: string;
}
