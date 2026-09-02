import type { Document, Types } from 'mongoose';
import type { z } from 'zod';
import type { createEventSchema, updateEventSchema } from './event.validation.js';

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
  images: string[];
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
  stock: number;
  images: string[];
  artistInfo: IArtistInfo[];
  rewards: IReward[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export interface EventQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  title?: string;
  categoryId?: string;
  subCategoryId?: string;
  hostId?: string;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  lan?: number | string;
  lon?: number | string;
  seed?: string;
  userId?: string;
  date?: string | Date | (string | Date)[];
  minPrice?: number | string;
  maxPrice?: number | string;
  ticketAvailability?: 'AVAILABLE' | 'SOLD_OUT' | 'FEW_LEFT' | string;
  rewardsAvailable?: boolean | string;
}


