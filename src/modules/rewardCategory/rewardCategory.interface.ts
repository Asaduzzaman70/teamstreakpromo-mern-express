import type { z } from 'zod';
import {
  createRewardCategorySchema,
  updateRewardCategorySchema,
} from './rewardCategory.validation.js';

export type CreateRewardCategoryInput = z.infer<typeof createRewardCategorySchema>;
export type UpdateRewardCategoryInput = z.infer<typeof updateRewardCategorySchema>;

export interface RewardCategoryQuery {
  search?: string;
  isActive?: boolean | string;
  page?: number | string;
  limit?: number | string;
}

export interface RewardCategoryResponse {
  _id: unknown;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
