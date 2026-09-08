import type { z } from 'zod';
import type { createMarketplaceSchema, updateMarketplaceSchema } from './marketplace.validation.js';

export type CreateMarketplaceInput = z.infer<typeof createMarketplaceSchema>;
export type UpdateMarketplaceInput = z.infer<typeof updateMarketplaceSchema>;

export interface MarketplaceQuery {
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  latitude?: number | string;
  longitude?: number | string;
  isActive?: boolean | string;
  page?: number | string;
  limit?: number | string;
}

export interface IMarketplaceResponse {
  _id: unknown;
  title: string;
  description: string;
  category: unknown;
  subCategory: unknown;
  location: string;
  latitude: number;
  longitude: number;
  startDateTime: Date;
  endDateTime: Date;
  points: number;
  quantity: number;
  photos: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
