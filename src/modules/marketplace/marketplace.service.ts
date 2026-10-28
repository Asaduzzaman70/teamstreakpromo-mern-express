import { Marketplace, type IMarketplace } from './marketplace.model.js';
import { RewardCategory } from '../rewardCategory/rewardCategory.model.js';
import { RewardSubCategory } from '../rewardSubCategory/rewardSubCategory.model.js';
import { Employee } from '../employee/employee.model.js';
import { AppError } from '../../utils/AppError.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import { uploadToS3, deleteFromS3 } from '../../utils/s3.js';
import type { IMeta } from '../../utils/sendResponse.js';
import type { CreateMarketplaceInput, UpdateMarketplaceInput, MarketplaceQuery } from './marketplace.interface.js';

const formatMarketplaceResponse = (item: any) => {
  const doc = item.toObject ? item.toObject() : item;
  const user = doc.businessOwnerId || {};
  const profile = user.businessProfile || {};

  const businessProfile = {
    rating: profile.rating ?? user.rating ?? 0,
    sold: profile.sold ?? user.sold ?? 0,
    businessName: profile.businessName || user.name || '',
    businessDescription: profile.businessDescription || '',
    location: profile.location || doc.location || '',
    profileImage: user.profileImage || '',
  };

  const { businessOwnerId, ...rest } = doc;

  return {
    ...rest,
    businessProfile,
  };
};

export const createMarketplaceService = async (
  businessOwnerId: string,
  data: CreateMarketplaceInput,
  files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[]
): Promise<IMarketplace> => {
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

  const marketplaceImageFiles: Express.Multer.File[] = [];
  if (files) {
    let allFiles: Express.Multer.File[] = [];
    if (Array.isArray(files)) {
      allFiles = files;
    } else {
      allFiles = Object.values(files).flat();
    }
    marketplaceImageFiles.push(
      ...allFiles.filter((f) => f.fieldname === 'photos' || f.fieldname === 'marketplaceImages' || f.fieldname.startsWith('photo'))
    );
  }

  const finalPhotos: string[] = Array.isArray(data.photos) ? [...data.photos] : [];
  if (marketplaceImageFiles.length > 0) {
    for (const file of marketplaceImageFiles) {
      const s3Url = await uploadToS3(file, 'marketplaces');
      finalPhotos.push(s3Url);
    }
  }

  if (finalPhotos.length === 0) {
    throw new AppError('At least one photo is required for the marketplace item', 400);
  }

  const marketplaceItem = new Marketplace({
    businessOwnerId: businessOwnerId as any,
    title: data.title,
    description: data.description,
    category: data.categoryId as any,
    subCategory: data.subCategoryId ? data.subCategoryId as any : undefined,
    location: data.location,
    latitude: data.latitude,
    longitude: data.longitude,
    startDateTime: new Date(data.startDateTime),
    endDateTime: new Date(data.endDateTime),
    points: data.points,
    quantity: data.quantity,
    photos: finalPhotos,
    isActive: data.isActive !== undefined ? data.isActive : true,
  });

  await marketplaceItem.save();
  return marketplaceItem.populate([
    { path: 'category', select: 'name description' },
    { path: 'subCategory', select: 'name description' },
  ]);
};

export const getMarketplaceStatsService = async (): Promise<{
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  expiredProducts: number;
  totalQuantity: number;
  totalClaimed: number;
}> => {
  const now = new Date();
  const totalProducts = await Marketplace.countDocuments();
  const activeProducts = await Marketplace.countDocuments({ isActive: { $ne: false } });
  const inactiveProducts = await Marketplace.countDocuments({ isActive: false });
  const expiredProducts = await Marketplace.countDocuments({ endDateTime: { $lt: now } });

  const agg = await Marketplace.aggregate([
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$quantity' },
        totalClaimed: { $sum: '$claimQuantity' },
      },
    },
  ]);

  const totalQuantity = agg[0]?.totalQuantity ?? 0;
  const totalClaimed = agg[0]?.totalClaimed ?? 0;

  return {
    totalProducts,
    activeProducts,
    inactiveProducts,
    expiredProducts,
    totalQuantity,
    totalClaimed,
  };
};

export const getAllMarketplacesService = async (
  query: MarketplaceQuery
): Promise<{ meta: IMeta; result: any[] }> => {
  const filter: Record<string, any> = {};

  if (query.search) {
    filter.title = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
  }

  if (query.businessOwnerId) {
    filter.businessOwnerId = query.businessOwnerId as any;
  }

  if (query.categoryId) {
    filter.category = query.categoryId as any;
  }

  if (query.subCategoryId) {
    filter.subCategory = query.subCategoryId as any;
  }

  if (query.startDate) {
    filter.startDateTime = { $gte: new Date(query.startDate) };
  }

  if (query.endDate) {
    filter.endDateTime = { ...filter.endDateTime, $lte: new Date(query.endDate) };
  }

  if (query.isExpired !== undefined) {
    const isExpired = query.isExpired === 'true' || query.isExpired === true;
    if (isExpired) {
      filter.endDateTime = { ...filter.endDateTime, $lt: new Date() };
    } else {
      filter.endDateTime = { ...filter.endDateTime, $gte: new Date() };
    }
  }

  if (query.points !== undefined) {
    filter.points = Number(query.points);
  } else if (query.minPoints !== undefined || query.maxPoints !== undefined) {
    filter.points = {};
    if (query.minPoints !== undefined) filter.points.$gte = Number(query.minPoints);
    if (query.maxPoints !== undefined) filter.points.$lte = Number(query.maxPoints);
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

  const sortBy = (query as any).sortBy || 'createdAt';
  const sortOrder = (query as any).sortOrder === 'asc' ? 1 : -1;
  const sortFieldMap: Record<string, string> = {
    createdAt: 'createdAt',
    title: 'title',
    points: 'points',
    quantity: 'quantity',
    claimQuantity: 'claimQuantity',
    startDateTime: 'startDateTime',
    endDateTime: 'endDateTime',
  };
  const sortOption: Record<string, any> = {};
  sortOption[sortFieldMap[sortBy] || 'createdAt'] = sortOrder;
  const marketplaces = await Marketplace.find(filter)
    .populate([
      {
        path: 'businessOwnerId',
        select: 'name email phoneNumber profileImage role rating sold',
        populate: {
          path: 'businessProfile',
          select: 'businessName businessDescription location verificationStatus rating sold',
        },
      },
      { path: 'category', select: 'name description' },
      { path: 'subCategory', select: 'name description' },
    ])
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    result: marketplaces.map(formatMarketplaceResponse),
  };
};

export const getMyMarketplacesService = async (
  actorId: string,
  actorRole: string | undefined,
  query: MarketplaceQuery
): Promise<{ meta: IMeta; result: any[] }> => {
  let targetBusinessOwnerId = actorId;

  if (actorRole === 'EMPLOYEE') {
    const employee = await Employee.findById(actorId)
      .select('employerId employerType isActive')
      .lean();

    if (!employee || !employee.isActive) {
      throw new AppError('Employee account is inactive or not found.', 403);
    }

    if (employee.employerType !== 'BUSINESS') {
      throw new AppError(
        'Forbidden: Only Business Partner employees can view business marketplace rewards.',
        403
      );
    }

    targetBusinessOwnerId = employee.employerId.toString();
  }

  return getAllMarketplacesService({
    ...query,
    businessOwnerId: targetBusinessOwnerId,
  });
};

export const getMarketplaceByIdService = async (id: string): Promise<any> => {
  const marketplaceItem = await Marketplace.findById(id).populate([
    {
      path: 'businessOwnerId',
      select: 'name email phoneNumber profileImage role rating sold',
      populate: {
        path: 'businessProfile',
        select: 'businessName businessDescription location verificationStatus rating sold',
      },
    },
    { path: 'category', select: 'name description' },
    { path: 'subCategory', select: 'name description' },
  ]);
  
  if (!marketplaceItem) {
    throw new AppError('Marketplace item not found', 404);
  }
  return formatMarketplaceResponse(marketplaceItem);
};

export const updateMarketplaceService = async (
  id: string,
  data: UpdateMarketplaceInput,
  files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[]
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

  const oldPhotos = marketplaceItem.photos || [];
  const marketplaceImageFiles: Express.Multer.File[] = [];

  if (files) {
    let allFiles: Express.Multer.File[] = [];
    if (Array.isArray(files)) {
      allFiles = files;
    } else {
      allFiles = Object.values(files).flat();
    }
    marketplaceImageFiles.push(
      ...allFiles.filter((f) => f.fieldname === 'photos' || f.fieldname === 'marketplaceImages' || f.fieldname.startsWith('photo'))
    );
  }

  let finalPhotos: string[] = data.photos !== undefined ? [...data.photos] : [...oldPhotos];
  if (marketplaceImageFiles.length > 0) {
    for (const file of marketplaceImageFiles) {
      const s3Url = await uploadToS3(file, 'marketplaces');
      finalPhotos.push(s3Url);
    }
  }

  if (data.title) marketplaceItem.title = data.title;
  if (data.description !== undefined) marketplaceItem.description = data.description;
  if (data.categoryId) marketplaceItem.category = data.categoryId as any;
  if (data.subCategoryId) marketplaceItem.subCategory = data.subCategoryId as any;
  if (data.location !== undefined) marketplaceItem.location = data.location;
  if (data.latitude !== undefined) marketplaceItem.latitude = data.latitude as number;
  if (data.longitude !== undefined) marketplaceItem.longitude = data.longitude as number;
  if (data.startDateTime) marketplaceItem.startDateTime = new Date(data.startDateTime);
  if (data.endDateTime) marketplaceItem.endDateTime = new Date(data.endDateTime);
  if (data.points !== undefined) marketplaceItem.points = data.points;
  if (data.quantity !== undefined) marketplaceItem.quantity = data.quantity;
  if (finalPhotos.length > 0) marketplaceItem.photos = finalPhotos;
  if (data.isActive !== undefined) marketplaceItem.isActive = data.isActive;

  await marketplaceItem.save();

  // Delete removed images from S3
  const newPhotosSet = new Set(marketplaceItem.photos || []);
  for (const oldUrl of oldPhotos) {
    if (!newPhotosSet.has(oldUrl)) {
      await deleteFromS3(oldUrl);
    }
  }

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

  const oldPhotos = marketplaceItem.photos || [];
  await Marketplace.findByIdAndDelete(id);

  for (const imgUrl of oldPhotos) {
    await deleteFromS3(imgUrl);
  }

  return { message: 'Marketplace item deleted successfully' };
};
