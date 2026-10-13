import type { Document, Types } from 'mongoose';
import type { z } from 'zod';
import type {
  createContentSchema,
  updateContentSchema,
  upsertContentSchema,
} from './content.validation.js';

export type ContentStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
export type ContentType = 'HTML' | 'MARKDOWN' | 'TEXT';
export type ContentCategory = 'LEGAL' | 'TERMS_AND_CONDITIONS' | 'COMPANY' | 'SUPPORT' | 'GENERAL';

export interface IContent extends Document {
  title: string;
  slug: string;
  content: string;
  contentType: ContentType;
  category: ContentCategory;
  status: ContentStatus;
  metaTitle?: string | undefined;
  metaDescription?: string | undefined;
  isSystemPage: boolean;
  createdBy?: Types.ObjectId | null | undefined;
  updatedBy?: Types.ObjectId | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateContentInput = z.infer<typeof createContentSchema.body>;
export type UpdateContentInput = z.infer<typeof updateContentSchema.body>;
export type UpsertContentInput = z.infer<typeof upsertContentSchema.body>;

export interface ContentQuery {
  page?: number | string | undefined;
  limit?: number | string | undefined;
  search?: string | undefined;
  category?: string | undefined;
  status?: string | undefined;
  sort?: string | undefined;
}

export interface ContentResponse {
  _id: unknown;
  title: string;
  slug: string;
  content: string;
  contentType: ContentType;
  category: ContentCategory;
  status: ContentStatus;
  metaTitle?: string | undefined;
  metaDescription?: string | undefined;
  isSystemPage: boolean;
  createdBy?: unknown;
  updatedBy?: unknown;
  createdAt: Date;
  updatedAt: Date;
}
