import { Category, type ICategory } from './category.model.js';
import { AppError } from '../../utils/AppError.js';
import type { IMeta } from '../../utils/sendResponse.js';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQuery,
} from './category.interface.js';

export const createCategoryService = async (
  data: CreateCategoryInput
): Promise<ICategory> => {
  const { name, description, parentCategory, isActive } = data;

  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw new AppError('Category already exists with this name', 400);
  }

  if (parentCategory) {
    const parentExists = await Category.findById(parentCategory);
    if (!parentExists) {
      throw new AppError('Parent category not found', 404);
    }
  }

  const category = new Category({
    name,
    description,
    parentCategory: parentCategory || null,
    isActive: isActive !== undefined ? isActive : true,
  });

  await category.save();
  return category;
};

export const getAllCategoriesService = async (
  query: CategoryQuery
): Promise<{ meta: IMeta; result: ICategory[] }> => {
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

  if (query.parentCategory) {
    if (query.parentCategory === 'null' || query.parentCategory === 'none') {
      filter.parentCategory = null;
    } else {
      filter.parentCategory = query.parentCategory;
    }
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const total = await Category.countDocuments(filter);
  const totalPage = Math.ceil(total / limit);

  const categories = await Category.find(filter)
    .populate('parentCategory', 'name description')
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
    result: categories,
  };
};

export const getCategoryByIdService = async (
  id: string
): Promise<ICategory> => {
  const category = await Category.findById(id).populate('parentCategory', 'name description');
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return category;
};

export const updateCategoryService = async (
  id: string,
  data: UpdateCategoryInput
): Promise<ICategory> => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (data.name && data.name !== category.name) {
    const existing = await Category.findOne({ name: data.name });
    if (existing) {
      throw new AppError('Category already exists with this name', 400);
    }
    category.name = data.name;
  }

  if (data.description !== undefined) {
    category.description = data.description;
  }

  if (data.parentCategory !== undefined) {
    if (data.parentCategory === id) {
      throw new AppError('A category cannot be its own parent', 400);
    }
    if (data.parentCategory) {
      const parentExists = await Category.findById(data.parentCategory);
      if (!parentExists) {
        throw new AppError('Parent category not found', 404);
      }
      category.parentCategory = data.parentCategory as any;
    } else {
      category.parentCategory = null;
    }
  }

  if (data.isActive !== undefined) {
    category.isActive = data.isActive;
  }

  await category.save();
  return category;
};

export const deleteCategoryService = async (
  id: string
): Promise<{ message: string }> => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  const childCategoryCount = await Category.countDocuments({ parentCategory: id as any });
  if (childCategoryCount > 0) {
    throw new AppError(
      `Cannot delete category. It is a parent to ${childCategoryCount} subcategory(ies)`,
      400
    );
  }

  await Category.findByIdAndDelete(id);
  return { message: 'Category deleted successfully' };
};
