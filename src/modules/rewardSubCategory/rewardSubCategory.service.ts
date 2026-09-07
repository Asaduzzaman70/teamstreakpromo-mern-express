import { RewardSubCategory, type IRewardSubCategory } from './rewardSubCategory.model.js';
import { RewardCategory } from '../rewardCategory/rewardCategory.model.js';
import { AppError } from '../../utils/AppError.js';
import type { IMeta } from '../../utils/sendResponse.js';
import type {
  CreateRewardSubCategoryInput,
  UpdateRewardSubCategoryInput,
  RewardSubCategoryQuery,
} from './rewardSubCategory.interface.js';

export const createRewardSubCategoryService = async (
  data: CreateRewardSubCategoryInput
): Promise<IRewardSubCategory> => {
  const { name, description, rewardCategory, isActive } = data;

  const parentExists = await RewardCategory.findById(rewardCategory);
  if (!parentExists) {
    throw new AppError('Reward Category not found', 404);
  }

  const existingSubCategory = await RewardSubCategory.findOne({ name, rewardCategory: rewardCategory as any });
  if (existingSubCategory) {
    throw new AppError('Reward Subcategory already exists in this category', 400);
  }

  const rewardSubCategory = new RewardSubCategory({
    name,
    description,
    rewardCategory,
    isActive: isActive !== undefined ? isActive : true,
  });

  await rewardSubCategory.save();
  return rewardSubCategory.populate('rewardCategory', 'name description');
};

export const getAllRewardSubCategoriesService = async (
  query: RewardSubCategoryQuery
): Promise<{ meta: IMeta; result: IRewardSubCategory[] }> => {
  const filter: Record<string, any> = {};

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  if (query.isActive !== undefined) {
    if (typeof query.isActive === 'string') {
      filter.isActive = query.isActive === 'true';
    } else {
      filter.isActive = query.isActive;
    }
  }

  if (query.rewardCategory) {
    filter.rewardCategory = query.rewardCategory;
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const total = await RewardSubCategory.countDocuments(filter);
  const totalPage = Math.ceil(total / limit);

  const rewardSubCategories = await RewardSubCategory.find(filter)
    .populate('rewardCategory', 'name description')
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
    result: rewardSubCategories,
  };
};

export const getRewardSubCategoryByIdService = async (
  id: string
): Promise<IRewardSubCategory> => {
  const rewardSubCategory = await RewardSubCategory.findById(id).populate('rewardCategory', 'name description');
  if (!rewardSubCategory) {
    throw new AppError('Reward Subcategory not found', 404);
  }
  return rewardSubCategory;
};

export const updateRewardSubCategoryService = async (
  id: string,
  data: UpdateRewardSubCategoryInput
): Promise<IRewardSubCategory> => {
  const rewardSubCategory = await RewardSubCategory.findById(id);
  if (!rewardSubCategory) {
    throw new AppError('Reward Subcategory not found', 404);
  }

  if (data.rewardCategory && data.rewardCategory !== rewardSubCategory.rewardCategory.toString()) {
    const parentExists = await RewardCategory.findById(data.rewardCategory);
    if (!parentExists) {
      throw new AppError('Reward Category not found', 404);
    }
  }

  const newName = data.name || rewardSubCategory.name;
  const newRewardCategory = data.rewardCategory || rewardSubCategory.rewardCategory.toString();

  if (data.name || data.rewardCategory) {
    const existing = await RewardSubCategory.findOne({ 
      name: newName, 
      rewardCategory: newRewardCategory as any, 
      _id: { $ne: id } 
    });
    if (existing) {
      throw new AppError('Reward Subcategory already exists in this category', 400);
    }
  }

  if (data.name) rewardSubCategory.name = data.name;
  if (data.description !== undefined) rewardSubCategory.description = data.description;
  if (data.rewardCategory) rewardSubCategory.rewardCategory = data.rewardCategory as any;
  if (data.isActive !== undefined) rewardSubCategory.isActive = data.isActive;

  await rewardSubCategory.save();
  return rewardSubCategory.populate('rewardCategory', 'name description');
};

export const deleteRewardSubCategoryService = async (
  id: string
): Promise<{ message: string }> => {
  const rewardSubCategory = await RewardSubCategory.findById(id);
  if (!rewardSubCategory) {
    throw new AppError('Reward Subcategory not found', 404);
  }

  await RewardSubCategory.findByIdAndDelete(id);
  return { message: 'Reward Subcategory deleted successfully' };
};
