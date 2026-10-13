import { Types } from 'mongoose';
import { Content } from './content.model.js';
import type {
  IContent,
  CreateContentInput,
  UpdateContentInput,
  UpsertContentInput,
  ContentQuery,
  ContentStatus,
} from './content.interface.js';
import { AppError } from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import type { IMeta } from '../../utils/sendResponse.js';

/**
 * Transforms human-readable strings into clean, URL-friendly kebab-case slugs.
 * E.g., "Terms & Conditions (2026)" -> "terms-and-conditions-2026"
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Checks whether a given string is a valid MongoDB 24-character hex ObjectId.
 */
const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id;
};

/**
 * Creates a new static content / legal page.
 */
export const createContentService = async (
  userId: string | undefined,
  data: CreateContentInput
): Promise<IContent> => {
  const generatedSlug = data.slug ? slugify(data.slug) : slugify(data.title);

  if (!generatedSlug) {
    throw new AppError('A valid slug or title is required to generate the page URL', 400);
  }

  const existing = await Content.findOne({ slug: generatedSlug });
  if (existing) {
    throw new AppError(`A content page with the slug '${generatedSlug}' already exists`, 400);
  }

  const newContent = await Content.create({
    title: data.title,
    slug: generatedSlug,
    content: data.content,
    contentType: data.contentType || 'HTML',
    category: data.category || 'GENERAL',
    status: data.status || 'PUBLISHED',
    metaTitle: data.metaTitle || '',
    metaDescription: data.metaDescription || '',
    isSystemPage: data.isSystemPage ?? false,
    createdBy: userId ? new Types.ObjectId(userId) : null,
    updatedBy: userId ? new Types.ObjectId(userId) : null,
  });

  logger.info(`[CMS] Created new static page: '${newContent.slug}' (ID: ${newContent._id})`);
  return newContent;
};

/**
 * Upserts a static content page by slug.
 * If the page already exists, updates it. If not, creates it.
 */
export const upsertContentBySlugService = async (
  targetSlug: string,
  userId: string | undefined,
  data: UpsertContentInput
): Promise<{ content: IContent; isCreated: boolean }> => {
  const cleanSlug = slugify(targetSlug);
  if (!cleanSlug) {
    throw new AppError('Invalid slug provided for content upsert', 400);
  }

  const existing = await Content.findOne({ slug: cleanSlug });

  if (existing) {
    existing.title = data.title;
    existing.content = data.content;
    if (data.contentType) existing.contentType = data.contentType;
    if (data.category) existing.category = data.category;
    if (data.status) existing.status = data.status;
    if (data.metaTitle !== undefined) existing.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) existing.metaDescription = data.metaDescription;
    if (data.isSystemPage !== undefined) existing.isSystemPage = data.isSystemPage;
    if (userId) existing.updatedBy = new Types.ObjectId(userId);

    await existing.save();
    logger.info(`[CMS] Updated static page via upsert: '${cleanSlug}' (ID: ${existing._id})`);
    return { content: existing, isCreated: false };
  }

  const created = await Content.create({
    title: data.title,
    slug: cleanSlug,
    content: data.content,
    contentType: data.contentType || 'HTML',
    category: data.category || 'GENERAL',
    status: data.status || 'PUBLISHED',
    metaTitle: data.metaTitle || '',
    metaDescription: data.metaDescription || '',
    isSystemPage: data.isSystemPage ?? false,
    createdBy: userId ? new Types.ObjectId(userId) : null,
    updatedBy: userId ? new Types.ObjectId(userId) : null,
  });

  logger.info(`[CMS] Created static page via upsert: '${cleanSlug}' (ID: ${created._id})`);
  return { content: created, isCreated: true };
};

/**
 * Retrieves all static content pages with filtering, pagination, and role-based visibility.
 */
export const getAllContentsService = async (
  query: ContentQuery,
  isAdmin: boolean = false
): Promise<{ meta: IMeta; result: IContent[] }> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  // For non-admin visitors, only show PUBLISHED content
  if (!isAdmin) {
    filter.status = 'PUBLISHED';
  } else if (query.status) {
    filter.status = query.status.toUpperCase();
  }

  if (query.category) {
    filter.category = query.category.toUpperCase();
  }

  if (query.search) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    filter.$or = [
      { title: searchRegex },
      { slug: searchRegex },
      { content: searchRegex },
    ];
  }

  const [total, result] = await Promise.all([
    Content.countDocuments(filter),
    Content.find(filter)
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    result,
  };
};

/**
 * Retrieves a single static page by either slug or MongoDB ObjectId.
 */
export const getContentByIdentifierService = async (
  identifier: string,
  isAdmin: boolean = false
): Promise<IContent> => {
  const trimmed = identifier.trim();
  let content: IContent | null = null;

  if (isValidObjectId(trimmed)) {
    content = await Content.findById(trimmed)
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');
  }

  if (!content) {
    content = await Content.findOne({ slug: trimmed.toLowerCase() })
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');
  }

  if (!content) {
    throw new AppError(`Static content page '${identifier}' not found`, 404);
  }

  if (!isAdmin && content.status !== 'PUBLISHED') {
    throw new AppError(`Static content page '${identifier}' is not published`, 404);
  }

  return content;
};

/**
 * Updates an existing static content page by ID or slug.
 */
export const updateContentService = async (
  identifier: string,
  userId: string | undefined,
  data: UpdateContentInput
): Promise<IContent> => {
  const content = await getContentByIdentifierService(identifier, true);

  if (data.slug) {
    const newSlug = slugify(data.slug);
    if (newSlug !== content.slug) {
      const existingSlug = await Content.findOne({
        slug: newSlug,
        _id: { $ne: content._id },
      });
      if (existingSlug) {
        throw new AppError(`A content page with the slug '${newSlug}' already exists`, 400);
      }
      content.slug = newSlug;
    }
  }

  if (data.title !== undefined) content.title = data.title;
  if (data.content !== undefined) content.content = data.content;
  if (data.contentType !== undefined) content.contentType = data.contentType;
  if (data.category !== undefined) content.category = data.category;
  if (data.status !== undefined) content.status = data.status;
  if (data.metaTitle !== undefined) content.metaTitle = data.metaTitle;
  if (data.metaDescription !== undefined) content.metaDescription = data.metaDescription;
  if (data.isSystemPage !== undefined) content.isSystemPage = data.isSystemPage;
  if (userId) content.updatedBy = new Types.ObjectId(userId);

  await content.save();
  logger.info(`[CMS] Updated content page: '${content.slug}' (ID: ${content._id})`);
  return content;
};

/**
 * Quickly updates the publication status of a static content page.
 */
export const updateContentStatusService = async (
  identifier: string,
  userId: string | undefined,
  status: ContentStatus
): Promise<IContent> => {
  const content = await getContentByIdentifierService(identifier, true);

  content.status = status;
  if (userId) content.updatedBy = new Types.ObjectId(userId);

  await content.save();
  logger.info(`[CMS] Updated status of '${content.slug}' to '${status}'`);
  return content;
};

/**
 * Deletes a static content page. Prevents deletion of critical system pages.
 */
export const deleteContentService = async (
  identifier: string
): Promise<{ deletedId: string; slug: string }> => {
  const content = await getContentByIdentifierService(identifier, true);

  if (content.isSystemPage) {
    throw new AppError(
      `Cannot delete system-critical page '${content.slug}'. You may unpublish it by changing its status to 'DRAFT'.`,
      400
    );
  }

  const deletedId = content._id.toString();
  const slug = content.slug;

  await Content.findByIdAndDelete(content._id);
  logger.info(`[CMS] Deleted content page: '${slug}' (ID: ${deletedId})`);

  return { deletedId, slug };
};
