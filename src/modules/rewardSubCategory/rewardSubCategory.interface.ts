import type { z } from 'zod';
import type {
  createRewardSubCategorySchema,
  updateRewardSubCategorySchema,
} from './rewardSubCategory.validation.js';

export type CreateRewardSubCategoryInput = z.infer<typeof createRewardSubCategorySchema>;
export type UpdateRewardSubCategoryInput = z.infer<typeof updateRewardSubCategorySchema>;

export interface RewardSubCategoryQuery {
  search?: string;
  isActive?: boolean | string;
  rewardCategory?: string;
  page?: number | string;
  limit?: number | string;
}

export interface RewardSubCategoryResponse {
  _id: unknown;
  name: string;
  description?: string;
  rewardCategory: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
