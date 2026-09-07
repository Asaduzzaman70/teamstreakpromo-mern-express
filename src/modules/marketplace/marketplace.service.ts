import { Marketplace, type IMarketplace } from './marketplace.model.js';
import { RewardCategory } from '../rewardCategory/rewardCategory.model.js';
import { RewardSubCategory } from '../rewardSubCategory/rewardSubCategory.model.js';
import { AppError } from '../../utils/AppError.js';
import type { IMeta } from '../../utils/sendResponse.js';
import type { CreateMarketplaceInput, UpdateMarketplaceInput, MarketplaceQuery } from './marketplace.interface.js';

export const createMarketplaceService = async (data: CreateMarketplaceInput): Promise<IMarketplace> => {
  const categoryExists = await RewardCategory.findById(data.categoryId);
  if (!categoryExists) {
    throw new AppError('Reward Category not found', 404);
  }

  if (data.subCategoryId) {
    const subCategoryExists = await RewardSubCategory.findById(data.subCategoryId);
    if (!subCategoryExists) {
      throw new AppError('Reward Subcategory not found', 404);
    }

    // Ensure the subcategory belongs to the provided category
    if (subCategoryExists.rewardCategory.toString() !== data.categoryId) {
      throw new AppError('The selected subcategory does not belong to the selected category', 400);
    }
  }

  const marketplaceItem = new Marketplace({
    title: data.title,
    description: data.description,
    category: data.categoryId as any,
    subCategory: data.subCategoryId as any,
    location: data.location,
    startDateTime: new Date(data.startDateTime),
    endDateTime: new Date(data.endDateTime),
    points: data.points,
    quantity: data.quantity,
    photos: data.photos,
    isActive: data.isActive !== undefined ? data.isActive : true,
  });

  await marketplaceItem.save();
  return marketplaceItem.populate([
    { path: 'category', select: 'name description' },
    { path: 'subCategory', select: 'name description' },
  ]);
};

export const getAllMarketplacesService = async (
  query: MarketplaceQuery
): Promise<{ meta: IMeta; result: IMarketplace[] }> => {
  const filter: Record<string, any> = {};

  if (query.search) {
    filter.title = { $regex: query.search, $options: 'i' };
  }

  if (query.categoryId) {
    filter.category = query.categoryId as any;
  }

  if (query.subCategoryId) {
    filter.subCategory = query.subCategoryId as any;
  }

  if (query.isActive !== undefined) {
    if (typeof query.isActive === 'string') {
      filter.isActive = query.isActive === 'true';
    } else {
      filter.isActive = query.isActive;
    }
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const total = await Marketplace.countDocuments(filter);
  const totalPage = Math.ceil(total / limit);

  const marketplaces = await Marketplace.find(filter)
    .populate([
      { path: 'category', select: 'name description' },
      { path: 'subCategory', select: 'name description' },
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    result: marketplaces,
  };
};

export const getMarketplaceByIdService = async (id: string): Promise<IMarketplace> => {
  const marketplaceItem = await Marketplace.findById(id).populate([
    { path: 'category', select: 'name description' },
    { path: 'subCategory', select: 'name description' },
  ]);
  
  if (!marketplaceItem) {
    throw new AppError('Marketplace item not found', 404);
  }
  return marketplaceItem;
};

export const updateMarketplaceService = async (
  id: string,
  data: UpdateMarketplaceInput
): Promise<IMarketplace> => {
  const marketplaceItem = await Marketplace.findById(id);
  if (!marketplaceItem) {
    throw new AppError('Marketplace item not found', 404);
  }

  // If category or subcategory is being updated, validate them
  const newCategory = data.categoryId || marketplaceItem.category.toString();
  const newSubCategory = data.subCategoryId || marketplaceItem.subCategory?.toString();

  if (data.categoryId || data.subCategoryId !== undefined) {
    const categoryExists = await RewardCategory.findById(newCategory);
    if (!categoryExists) {
      throw new AppError('Reward Category not found', 404);
    }

    if (newSubCategory) {
      const subCategoryExists = await RewardSubCategory.findById(newSubCategory);
      if (!subCategoryExists) {
        throw new AppError('Reward Subcategory not found', 404);
      }

      if (subCategoryExists.rewardCategory.toString() !== newCategory.toString()) {
        throw new AppError('The selected subcategory does not belong to the selected category', 400);
      }
    }
  }

  if (data.title) marketplaceItem.title = data.title;
  if (data.description !== undefined) marketplaceItem.description = data.description;
  if (data.categoryId) marketplaceItem.category = data.categoryId as any;
  if (data.subCategoryId) marketplaceItem.subCategory = data.subCategoryId as any;
  if (data.location !== undefined) marketplaceItem.location = data.location;
  if (data.startDateTime) marketplaceItem.startDateTime = new Date(data.startDateTime);
  if (data.endDateTime) marketplaceItem.endDateTime = new Date(data.endDateTime);
  if (data.points !== undefined) marketplaceItem.points = data.points;
  if (data.quantity !== undefined) marketplaceItem.quantity = data.quantity;
  if (data.photos && data.photos.length > 0) marketplaceItem.photos = data.photos;
  if (data.isActive !== undefined) marketplaceItem.isActive = data.isActive;

  await marketplaceItem.save();
  return marketplaceItem.populate([
    { path: 'category', select: 'name description' },
    { path: 'subCategory', select: 'name description' },
  ]);
};

export const deleteMarketplaceService = async (id: string): Promise<{ message: string }> => {
  const marketplaceItem = await Marketplace.findById(id);
  if (!marketplaceItem) {
    throw new AppError('Marketplace item not found', 404);
  }

  await Marketplace.findByIdAndDelete(id);
  return { message: 'Marketplace item deleted successfully' };
};
