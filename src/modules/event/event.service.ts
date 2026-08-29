import { Event } from './event.model.js';
import { Category } from '../category/category.model.js';
import { User } from '../auth/auth.model.js';
import { AppError } from '../../utils/AppError.js';
import { uploadToS3, deleteFromS3 } from '../../utils/s3.js';
import type { IMeta } from '../../utils/sendResponse.js';
import type { CreateEventInput, UpdateEventInput, EventQuery, IEvent } from './event.interface.js';

const getRewardFilesForIndex = (
  rewardFiles: Express.Multer.File[],
  index: number,
  totalRewards: number
): Express.Multer.File[] => {
  if (!rewardFiles || rewardFiles.length === 0) return [];

  const matchedIndexFiles = rewardFiles.filter((f) => {
    const field = f.fieldname.toLowerCase();
    const patterns = [
      `rewardimages_${index}`,
      `rewardimage_${index}`,
      `rewardimages[${index}]`,
      `rewardimage[${index}]`,
      `reward_${index}_images`,
      `reward_${index}_image`,
      `rewardimages${index}`,
      `rewardimage${index}`,
      `rewardimages[${index}][]`,
      `rewardimage[${index}][]`,
      `reward_${index}`,
      `reward${index}`,
    ];
    return patterns.includes(field);
  });

  if (matchedIndexFiles.length > 0) {
    return matchedIndexFiles;
  }

  const genericFiles = rewardFiles.filter(
    (f) =>
      f.fieldname === 'rewardImages' ||
      f.fieldname === 'rewardImage' ||
      f.fieldname === 'rewardImages[]' ||
      f.fieldname === 'rewardImage[]' ||
      f.fieldname.startsWith('rewardImages') ||
      f.fieldname.startsWith('rewardImage')
  );

  if (genericFiles.length === 0) return [];

  if (totalRewards <= 1) {
    return genericFiles;
  }

  const chunkSize = Math.max(1, Math.floor(genericFiles.length / totalRewards));
  const start = index * chunkSize;
  const isLast = index === totalRewards - 1;
  const end = isLast ? genericFiles.length : start + chunkSize;

  const sliced = genericFiles.slice(start, end);
  if (sliced.length > 0) {
    return sliced;
  }

  const fallbackFile = genericFiles[index % genericFiles.length];
  return fallbackFile ? [fallbackFile] : [];
};



export const createEventService = async (
  hostId: string,
  data: CreateEventInput,
  files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[]
): Promise<IEvent> => {
  const targetSubCategoryId = data.subCategoryId || data.categoryId;
  if (!targetSubCategoryId) {
    throw new AppError('Subcategory ID is required', 400);
  }

  const subCategory = await Category.findById(targetSubCategoryId);
  if (!subCategory) {
    throw new AppError('Subcategory not found with the provided subCategoryId', 404);
  }

  if (!subCategory.parentCategory) {
    throw new AppError(
      'The provided category ID belongs to a main category. Events must belong to a subcategory.',
      400
    );
  }

  let eventImageFiles: Express.Multer.File[] = [];
  let artistImageFiles: Express.Multer.File[] = [];
  let rewardImageFiles: Express.Multer.File[] = [];

  if (files) {
    let allFiles: Express.Multer.File[] = [];
    if (Array.isArray(files)) {
      allFiles = files;
    } else {
      allFiles = Object.values(files).flat();
    }

    eventImageFiles = allFiles.filter(
      (f) => f.fieldname === 'images' || f.fieldname.startsWith('eventImage')
    );
    artistImageFiles = allFiles.filter(
      (f) => f.fieldname === 'artistImages' || f.fieldname === 'artistImage'
    );
    rewardImageFiles = allFiles.filter(
      (f) =>
        f.fieldname === 'rewardImages' ||
        f.fieldname.startsWith('rewardImage') ||
        f.fieldname.includes('reward')
    );
  }

  // 1. Process Event Images
  const eventImages: string[] = Array.isArray(data.images) ? [...data.images] : [];
  if (eventImageFiles.length > 0) {
    for (const file of eventImageFiles) {
      const s3Url = await uploadToS3(file, 'events');
      eventImages.push(s3Url);
    }
  }

  // 2. Process Artist Images (upload 1 profile image file to S3 per artist index)
  const processedArtistInfo = await Promise.all(
    (data.artistInfo || []).map(async (artist, index) => {
      let imageUrl = artist.image || '';

      const artistFile = artistImageFiles[index];
      if (artistFile) {
        imageUrl = await uploadToS3(artistFile, 'artists');
      }

      return {
        name: artist.name,
        ...(artist.role ? { role: artist.role } : {}),
        image: imageUrl,
        socialMediaLinks:
          typeof artist.socialMediaLinks === 'object' && artist.socialMediaLinks !== null
            ? artist.socialMediaLinks
            : {},
      };
    })
  );

  // 3. Process Reward Images (upload multiple reward image files to S3 per reward)
  const totalRewards = (data.rewards || []).length;
  const processedRewards = await Promise.all(
    (data.rewards || []).map(async (reward, index) => {
      const rewardImagesList: string[] = [];

      if (Array.isArray(reward.images)) {
        rewardImagesList.push(...reward.images.filter(Boolean));
      }

      const filesForReward = getRewardFilesForIndex(rewardImageFiles, index, totalRewards);
      for (const file of filesForReward) {
        const s3Url = await uploadToS3(file, 'rewards');
        rewardImagesList.push(s3Url);
      }

      if (rewardImagesList.length === 0) {
        throw new AppError(`A picture is required for reward: "${reward.title}"`, 400);
      }

      return {
        title: reward.title,
        ...(reward.description ? { description: reward.description } : {}),
        pointsRequired: reward.pointsRequired,
        stock: reward.stock,
        images: rewardImagesList,
      };
    })
  );

  const { subCategoryId, categoryId, ...eventPayload } = data;

  const event = await Event.create({
    ...eventPayload,
    categoryId: subCategory._id,
    hostId,
    images: eventImages,
    artistInfo: processedArtistInfo,
    rewards: processedRewards,
  } as any);

  return event;
};

export const updateEventService = async (
  id: string,
  userId: string,
  userRole: string,
  data: UpdateEventInput,
  files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[]
): Promise<IEvent> => {
  const oldEvent = await Event.findById(id);

  if (!oldEvent) {
    throw new AppError('Event not found', 404);
  }

  if (oldEvent.hostId.toString() !== userId && userRole !== 'ADMIN') {
    throw new AppError('Forbidden: You are not authorized to edit this event', 403);
  }

  const targetSubCategoryId = data.subCategoryId || data.categoryId;
  let validCategoryId: any = undefined;

  if (targetSubCategoryId) {
    const subCategory = await Category.findById(targetSubCategoryId);
    if (!subCategory) {
      throw new AppError('Subcategory not found with the provided subCategoryId', 404);
    }

    if (!subCategory.parentCategory) {
      throw new AppError(
        'The provided category ID belongs to a main category. Events must belong to a subcategory.',
        400
      );
    }

    validCategoryId = subCategory._id;
  }


  let eventImageFiles: Express.Multer.File[] = [];
  let artistImageFiles: Express.Multer.File[] = [];
  let rewardImageFiles: Express.Multer.File[] = [];

  if (files) {
    let allFiles: Express.Multer.File[] = [];
    if (Array.isArray(files)) {
      allFiles = files;
    } else {
      allFiles = Object.values(files).flat();
    }

    eventImageFiles = allFiles.filter(
      (f) => f.fieldname === 'images' || f.fieldname.startsWith('eventImage')
    );
    artistImageFiles = allFiles.filter(
      (f) => f.fieldname === 'artistImages' || f.fieldname === 'artistImage'
    );
    rewardImageFiles = allFiles.filter(
      (f) =>
        f.fieldname === 'rewardImages' ||
        f.fieldname.startsWith('rewardImage') ||
        f.fieldname.includes('reward')
    );
  }

  // Collect all old image URLs from oldEvent
  const oldEventImages = oldEvent.images || [];
  const oldArtistImages = (oldEvent.artistInfo || [])
    .map((a) => a.image)
    .filter((img): img is string => Boolean(img));
  const oldRewardImages = (oldEvent.rewards || [])
    .flatMap((r) => r.images || [])
    .filter((img): img is string => Boolean(img));
  const oldAllImages = [...oldEventImages, ...oldArtistImages, ...oldRewardImages];

  // 1. Process Event Images
  let finalEventImages: string[] =
    data.images !== undefined ? [...data.images] : [...oldEventImages];
  if (eventImageFiles.length > 0) {
    for (const file of eventImageFiles) {
      const s3Url = await uploadToS3(file, 'events');
      finalEventImages.push(s3Url);
    }
  }

  // 2. Process Artist Info
  let finalArtistInfo: any = oldEvent.artistInfo;
  if (data.artistInfo !== undefined) {
    finalArtistInfo = await Promise.all(
      (data.artistInfo || []).map(async (artist, index) => {
        const artistFile = artistImageFiles[index];
        let imageUrl = artist.image || oldEvent.artistInfo?.[index]?.image || '';

        if (artistFile) {
          imageUrl = await uploadToS3(artistFile, 'artists');
        }

        return {
          name: artist.name,
          ...(artist.role ? { role: artist.role } : {}),
          image: imageUrl,
          socialMediaLinks:
            typeof artist.socialMediaLinks === 'object' && artist.socialMediaLinks !== null
              ? artist.socialMediaLinks
              : oldEvent.artistInfo?.[index]?.socialMediaLinks || {},
        };
      })
    );
  }

  // 3. Process Rewards
  let finalRewards: any = oldEvent.rewards;
  if (data.rewards !== undefined) {
    const totalRewards = (data.rewards || []).length;
    finalRewards = await Promise.all(
      (data.rewards || []).map(async (reward, index) => {
        const rewardImagesList: string[] = [];

        if (Array.isArray(reward.images)) {
          rewardImagesList.push(...reward.images.filter(Boolean));
        }

        if (rewardImagesList.length === 0 && oldEvent.rewards?.[index]) {
          const oldReward = oldEvent.rewards[index];
          if (Array.isArray(oldReward.images) && oldReward.images.length > 0) {
            rewardImagesList.push(...oldReward.images.filter(Boolean));
          }
        }

        const filesForReward = getRewardFilesForIndex(rewardImageFiles, index, totalRewards);
        for (const file of filesForReward) {
          const s3Url = await uploadToS3(file, 'rewards');
          rewardImagesList.push(s3Url);
        }

        if (rewardImagesList.length === 0) {
          throw new AppError(`A picture is required for reward: "${reward.title}"`, 400);
        }

        return {
          title: reward.title,
          ...(reward.description ? { description: reward.description } : {}),
          pointsRequired: reward.pointsRequired,
          stock: reward.stock,
          images: rewardImagesList,
        };
      })
    );
  }


  const { subCategoryId, categoryId, ...eventPayload } = data;

  const updateFields: Record<string, any> = {
    ...eventPayload,
    ...(validCategoryId ? { categoryId: validCategoryId } : {}),
    images: finalEventImages,
    artistInfo: finalArtistInfo,
    rewards: finalRewards,
  };


  const updatedEvent = await Event.findByIdAndUpdate(id, updateFields, {
    new: true,
    runValidators: true,
  })
    .populate('hostId', 'name email role profileImage')
    .populate('categoryId', 'name description');

  if (!updatedEvent) {
    throw new AppError('Event not found after update', 404);
  }

  // Identify any replaced/removed old images and delete them from S3
  const newEventImages = updatedEvent.images || [];
  const newArtistImages = (updatedEvent.artistInfo || [])
    .map((a) => a.image)
    .filter((img): img is string => Boolean(img));
  const newRewardImages = (updatedEvent.rewards || [])
    .flatMap((r) => r.images || [])
    .filter((img): img is string => Boolean(img));
  const newAllImagesSet = new Set([...newEventImages, ...newArtistImages, ...newRewardImages]);

  for (const oldUrl of oldAllImages) {
    if (!newAllImagesSet.has(oldUrl)) {
      await deleteFromS3(oldUrl);
    }
  }

  return updatedEvent;
};

const getHaversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getSeedHash = (id: string, seed: string): number => {
  const combined = `${id}:${seed}`;
  let hash = 2166136261;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0) / 4294967296;
};

export const getAllEventsService = async (
  query: EventQuery
): Promise<{ meta: IMeta; result: IEvent[] }> => {

  const filter: Record<string, any> = {
    // Only send events whose end date time is greater than current time
    endDate: { $gt: new Date() },
  };

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { placeName: { $regex: query.search, $options: 'i' } },
    ];
  }

  const categoryId = query.subCategoryId || query.categoryId;
  if (categoryId) {
    filter.categoryId = categoryId;
  }

  if (query.hostId) {
    filter.hostId = query.hostId;
  }

  // Filter by event date
  if (query.date) {
    const parsedDate = new Date(query.date as string | Date);
    if (!isNaN(parsedDate.getTime())) {
      const startOfDay = new Date(parsedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(parsedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      filter.startDate = { $lte: endOfDay };
      filter.endDate = { ...(filter.endDate || {}), $gte: startOfDay };
    }
  }

  const rawLat = query.latitude ?? query.lat;
  const rawLng = query.longitude ?? query.lng ?? query.lan ?? query.lon;

  let isGeoFiltering = false;
  let userLat = 0;
  let userLng = 0;

  if (rawLat !== undefined && rawLng !== undefined) {
    const parsedLat = Number(rawLat);
    const parsedLng = Number(rawLng);

    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      isGeoFiltering = true;
      userLat = parsedLat;
      userLng = parsedLng;

      // Approximate bounding box for 50km to pre-filter in MongoDB
      const deltaLat = 50 / 111; // ~0.45045 degrees
      const radLat = (userLat * Math.PI) / 180;
      const kmPerLonDegree = 111 * Math.cos(radLat);
      const deltaLon = kmPerLonDegree > 0 ? 50 / kmPerLonDegree : 0.45045;

      filter.latitude = { $gte: userLat - deltaLat, $lte: userLat + deltaLat };
      filter.longitude = { $gte: userLng - deltaLon, $lte: userLng + deltaLon };
    }
  }

  const page = Math.max(1, Number(query.page) || 1);
  const requestedLimit = Math.max(1, Number(query.limit) || 10);
  const limit = Math.min(requestedLimit, 20); // Cap per page at maximum 20
  const skip = (page - 1) * limit;

  // Retrieve candidate events matching base filters
  let candidateEvents = await Event.find(filter)
    .populate('hostId', 'name email role profileImage')
    .populate('categoryId', 'name description');

  // Filter events within exact 50km radius if lat/lng were provided
  if (isGeoFiltering) {
    candidateEvents = candidateEvents.filter((event) => {
      const dist = getHaversineDistanceKm(userLat, userLng, event.latitude, event.longitude);
      return dist <= 50;
    });
  }

  // Randomize event ordering per user session using seeded hash
  const userSeed = (query.seed || query.userId || 'default_event_seed').toString();
  candidateEvents.sort((a, b) => {
    const hashA = getSeedHash(a._id.toString(), userSeed);
    const hashB = getSeedHash(b._id.toString(), userSeed);
    return hashA - hashB;
  });

  const total = candidateEvents.length;
  const totalPage = Math.ceil(total / limit);
  const paginatedEvents = candidateEvents.slice(skip, skip + limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    result: paginatedEvents,
  };
};


export const getEventByIdService = async (
  id: string
): Promise<IEvent> => {
  const event = await Event.findById(id)
    .populate('hostId', 'name email role profileImage')
    .populate('categoryId', 'name description');

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  return event;
};

export const deleteEventService = async (
  id: string,
  userId: string,
  userRole: string
): Promise<IEvent> => {
  const event = await Event.findById(id);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  if (event.hostId.toString() !== userId && userRole !== 'ADMIN') {
    throw new AppError('Forbidden: You are not authorized to delete this event', 403);
  }

  await Event.findByIdAndDelete(id);

  // Delete all event images from S3
  const imagesToDelete = [
    ...(event.images || []),
    ...(event.artistInfo || []).map((a) => a.image),
    ...(event.rewards || []).flatMap((r) => r.images || []),
  ].filter((img): img is string => Boolean(img));

  for (const imgUrl of imagesToDelete) {
    await deleteFromS3(imgUrl);
  }

  return event;
};

export const getAdminEventsService = async (
  query: EventQuery
): Promise<{ meta: IMeta; result: IEvent[] }> => {
  const filter: Record<string, any> = {};

  if (query.hostId) {
    filter.hostId = query.hostId;
  }

  const categoryId = query.subCategoryId || query.categoryId;
  if (categoryId) {
    const categoryDoc = await Category.findById(categoryId);
    if (categoryDoc && !categoryDoc.parentCategory) {
      const subCategories = await Category.find({ parentCategory: categoryId }).select('_id');
      const subCategoryIds = subCategories.map((sub) => sub._id);
      filter.categoryId = { $in: [categoryId, ...subCategoryIds] };
    } else {
      filter.categoryId = categoryId;
    }
  }

  const searchQuery = query.search || query.title;
  if (searchQuery) {
    const searchRegex = new RegExp(searchQuery.trim(), 'i');

    const matchingHosts = await User.find({
      $or: [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ],
    }).select('_id');
    const hostIds = matchingHosts.map((h) => h._id);

    filter.$or = [
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
      { placeName: { $regex: searchRegex } },
      ...(hostIds.length > 0 ? [{ hostId: { $in: hostIds } }] : []),
    ];
  }

  // Filter by event date
  if (query.date) {
    const parsedDate = new Date(query.date as string | Date);
    if (!isNaN(parsedDate.getTime())) {
      const startOfDay = new Date(parsedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(parsedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      filter.startDate = { $lte: endOfDay };
      filter.endDate = { ...(filter.endDate || {}), $gte: startOfDay };
    }
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const total = await Event.countDocuments(filter);
  const totalPage = Math.ceil(total / limit);

  const paginatedEvents = await Event.find(filter)
    .populate('hostId', 'name email role profileImage')
    .populate({
      path: 'categoryId',
      select: 'name description parentCategory',
      populate: {
        path: 'parentCategory',
        select: 'name description',
      },
    })
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
    result: paginatedEvents,
  };
};


