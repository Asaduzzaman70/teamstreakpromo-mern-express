import { RewardCategory, type IRewardCategory } from './rewardCategory.model.js';
import { AppError } from '../../utils/AppError.js';
import type { IMeta } from '../../utils/sendResponse.js';
import type {
  CreateRewardCategoryInput,
  UpdateRewardCategoryInput,
  RewardCategoryQuery,
} from './rewardCategory.interface.js';

export const createRewardCategoryService = async (
  data: CreateRewardCategoryInput
): Promise<IRewardCategory> => {
  const { name, description, isActive } = data;

  const existingCategory = await RewardCategory.findOne({ name });
  if (existingCategory) {
    throw new AppError('Reward Category already exists with this name', 400);
  }

  const rewardCategory = new RewardCategory({
    name,
    description,
    isActive: isActive !== undefined ? isActive : true,
  });

  await rewardCategory.save();
  return rewardCategory;
};

export const getAllRewardCategoriesService = async (
  query: RewardCategoryQuery
): Promise<{ meta: IMeta; result: IRewardCategory[] }> => {
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

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const total = await RewardCategory.countDocuments(filter);
  const totalPage = Math.ceil(total / limit);

  const rewardCategories = await RewardCategory.find(filter)
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
    result: rewardCategories,
  };
};

export const getRewardCategoryByIdService = async (
  id: string
): Promise<IRewardCategory> => {
  const rewardCategory = await RewardCategory.findById(id);
  if (!rewardCategory) {
    throw new AppError('Reward Category not found', 404);
  }
  return rewardCategory;
};

export const updateRewardCategoryService = async (
  id: string,
  data: UpdateRewardCategoryInput
): Promise<IRewardCategory> => {
  const rewardCategory = await RewardCategory.findById(id);
  if (!rewardCategory) {
    throw new AppError('Reward Category not found', 404);
  }

  if (data.name && data.name !== rewardCategory.name) {
    const existing = await RewardCategory.findOne({ name: data.name });
    if (existing) {
      throw new AppError('Reward Category already exists with this name', 400);
    }
    rewardCategory.name = data.name;
  }

  if (data.description !== undefined) {
    rewardCategory.description = data.description;
  }

  if (data.isActive !== undefined) {
    rewardCategory.isActive = data.isActive;
  }

  await rewardCategory.save();
  return rewardCategory;
};

export const deleteRewardCategoryService = async (
  id: string
): Promise<{ message: string }> => {
  const rewardCategory = await RewardCategory.findById(id);
  if (!rewardCategory) {
    throw new AppError('Reward Category not found', 404);
  }

  await RewardCategory.findByIdAndDelete(id);
  return { message: 'Reward Category deleted successfully' };
};
