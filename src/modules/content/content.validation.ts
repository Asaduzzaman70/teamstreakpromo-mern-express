import { z } from 'zod';

export const createContentSchema = {
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').trim(),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens (e.g. privacy-policy)')
      .trim()
      .optional(),
    content: z.string().min(1, 'Content is required'),
    contentType: z.enum(['HTML', 'MARKDOWN', 'TEXT']).optional().default('HTML'),
    category: z.enum(['LEGAL', 'TERMS_AND_CONDITIONS', 'COMPANY', 'SUPPORT', 'GENERAL']).optional().default('GENERAL'),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional().default('PUBLISHED'),
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
    isSystemPage: z.boolean().optional().default(false),
  }),
};

export const updateContentSchema = {
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').trim().optional(),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens (e.g. privacy-policy)')
      .trim()
      .optional(),
    content: z.string().min(1, 'Content cannot be empty').optional(),
    contentType: z.enum(['HTML', 'MARKDOWN', 'TEXT']).optional(),
    category: z.enum(['LEGAL', 'TERMS_AND_CONDITIONS', 'COMPANY', 'SUPPORT', 'GENERAL']).optional(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
    isSystemPage: z.boolean().optional(),
  }),
  params: z.object({
    idOrSlug: z.string().min(1, 'Identifier is required').optional(),
  }).optional(),
};

export const upsertContentSchema = {
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').trim(),
    content: z.string().min(1, 'Content is required'),
    contentType: z.enum(['HTML', 'MARKDOWN', 'TEXT']).optional().default('HTML'),
    category: z.enum(['LEGAL', 'TERMS_AND_CONDITIONS', 'COMPANY', 'SUPPORT', 'GENERAL']).optional().default('GENERAL'),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional().default('PUBLISHED'),
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
    isSystemPage: z.boolean().optional(),
  }),
  params: z.object({
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens (e.g. terms-of-service)')
      .trim(),
  }),
};

export const updateContentStatusSchema = {
  body: z.object({
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']),
  }),
  params: z.object({
    idOrSlug: z.string().min(1, 'Identifier is required'),
  }),
};

export const getContentQuerySchema = {
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    sort: z.string().optional(),
  }),
};

export const contentIdentifierParamSchema = {
  params: z.object({
    idOrSlug: z.string().min(1, 'Identifier (ID or slug) is required'),
  }),
};
