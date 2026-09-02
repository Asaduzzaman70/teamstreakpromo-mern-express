import type { z } from 'zod';
import type {
  createCategorySchema,
  updateCategorySchema,
} from './category.validation.js';

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export interface CategoryQuery {
  search?: string;
  isActive?: boolean | string;
  parentCategory?: string;
  getAllParentCategory?: boolean | string;
  getallParentCategory?: boolean | string;
  page?: number | string;
  limit?: number | string;
}

export interface CategoryResponse {
  _id: unknown;
  name: string;
  description?: string;
  parentCategory?: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
