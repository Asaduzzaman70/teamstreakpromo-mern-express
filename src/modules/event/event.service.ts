import { Event } from './event.model.js';
import { Category } from '../category/category.model.js';
import { User } from '../auth/auth.model.js';
import { EventOrder } from '../eventOrder/eventOrder.model.js';
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
  // Check monthly event creation limit (Max 30 events per host per calendar month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthlyEventCount = await Event.countDocuments({
    hostId,
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

  if (monthlyEventCount >= 30) {
    throw new AppError('Monthly limit reached. You cannot create more than 30 events in a single month.', 400);
  }

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
        ...(reward._id || reward.id ? { _id: reward._id || reward.id } : {}),
        title: reward.title,
        ...(reward.description ? { description: reward.description } : {}),
        pointsRequired: reward.pointsRequired,
        stock: reward.stock,
        images: rewardImagesList,
      };
    })
  );

  // 4. Process Price Categories
  const processedPriceCategories = (data.priceCategories || []).map((cat) => ({
    ...(cat._id || cat.id ? { _id: cat._id || cat.id } : {}),
    name: cat.name,
    price: cat.price,
    stock: cat.stock,
  }));

  const { subCategoryId, categoryId, ...eventPayload } = data;

  const event = await Event.create({
    ...eventPayload,
    categoryId: subCategory._id,
    hostId,
    priceCategories: processedPriceCategories,
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

        const rewardId = reward._id || reward.id || oldEvent.rewards?.[index]?._id;

        return {
          ...(rewardId ? { _id: rewardId } : {}),
          title: reward.title,
          ...(reward.description ? { description: reward.description } : {}),
          pointsRequired: reward.pointsRequired,
          stock: reward.stock,
          images: rewardImagesList,
        };
      })
    );
  }

  // 4. Process Price Categories
  let finalPriceCategories: any = oldEvent.priceCategories || [];
  if (data.priceCategories !== undefined) {
    finalPriceCategories = (data.priceCategories || []).map((cat) => ({
      ...(cat._id || cat.id ? { _id: cat._id || cat.id } : {}),
      name: cat.name,
      price: cat.price,
      stock: cat.stock,
    }));
  }

  const { subCategoryId, categoryId, ...eventPayload } = data;

  const updateFields: Record<string, any> = {
    ...eventPayload,
    ...(validCategoryId ? { categoryId: validCategoryId } : {}),
    priceCategories: finalPriceCategories,
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

interface IDateInterval {
  startOfDay: Date;
  endOfDay: Date;
}

const parseDateIntervals = (dateInput: string | Date | (string | Date)[]): IDateInterval[] => {
  const intervals: IDateInterval[] = [];
  const rawItems: (string | Date)[] = Array.isArray(dateInput) ? dateInput : [dateInput];

  for (const item of rawItems) {
    if (item instanceof Date) {
      if (!isNaN(item.getTime())) {
        const start = new Date(item);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(item);
        end.setUTCHours(23, 59, 59, 999);
        intervals.push({ startOfDay: start, endOfDay: end });
      }
      continue;
    }

    if (typeof item !== 'string') continue;

    // Split by comma to support discrete dates like "2026-08-12,2026-08-14,2026-08-20"
    const commaSegments = item.split(',').map((s) => s.trim()).filter(Boolean);

    for (const segment of commaSegments) {
      // Check if this segment represents a range (e.g., 'to', ' - ', '_', ':')
      const rangeDelimiters = [' to ', ' - ', '_', ':'];
      let rangeParts: string[] = [];
      for (const delimiter of rangeDelimiters) {
        if (segment.includes(delimiter)) {
          rangeParts = segment.split(delimiter).map((p) => p.trim()).filter(Boolean);
          break;
        }
      }

      if (rangeParts.length === 2 && rangeParts[0] && rangeParts[1]) {
        const d1 = new Date(rangeParts[0]);
        const d2 = new Date(rangeParts[1]);
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
          let start = new Date(d1);
          start.setUTCHours(0, 0, 0, 0);
          let end = new Date(d2);
          end.setUTCHours(23, 59, 59, 999);

          if (start > end) {
            const temp = start;
            start = end;
            end = temp;
          }
          intervals.push({ startOfDay: start, endOfDay: end });
        }
      } else {
        const parsed = new Date(segment);
        if (!isNaN(parsed.getTime())) {
          const start = new Date(parsed);
          start.setUTCHours(0, 0, 0, 0);
          const end = new Date(parsed);
          end.setUTCHours(23, 59, 59, 999);
          intervals.push({ startOfDay: start, endOfDay: end });
        }
      }
    }
  }

  return intervals;
};

const applyDateFilter = (filter: Record<string, any>, query: EventQuery): void => {
  if (!query.date) return;

  const intervals = parseDateIntervals(query.date);
  if (intervals.length === 0) return;

  if (intervals.length === 1 && intervals[0]) {
    filter.startDate = { ...(filter.startDate || {}), $lte: intervals[0].endOfDay };
    filter.endDate = { ...(filter.endDate || {}), $gte: intervals[0].startOfDay };
    return;
  }

  // Multiple discrete dates or date ranges (e.g. 12th OR 14th OR 20th)
  const dateOrConditions = intervals.map((interval) => ({
    startDate: { $lte: interval.endOfDay },
    endDate: { $gte: interval.startOfDay },
  }));

  if (filter.$or) {
    if (filter.$and) {
      filter.$and.push({ $or: dateOrConditions });
    } else {
      filter.$and = [{ $or: filter.$or }, { $or: dateOrConditions }];
      delete filter.$or;
    }
  } else if (filter.$and) {
    filter.$and.push({ $or: dateOrConditions });
  } else {
    filter.$or = dateOrConditions;
  }
};

export const getAllEventsService = async (
  query: EventQuery
): Promise<{ meta: IMeta; result: IEvent[] }> => {

  const filter: Record<string, any> = {};

  const statusUpper = (query.status || '').toString().trim().toUpperCase();
  const isIncludePast =
    query.includePast === true ||
    query.includePast === 'true' ||
    statusUpper === 'ALL' ||
    statusUpper === 'COMPLETED';

  const isPast = query.past === true || query.past === 'true';

  const isOnlyEnded =
    isPast ||
    query.isEnded === true ||
    query.isEnded === 'true' ||
    statusUpper === 'ENDED' ||
    statusUpper === 'EXPIRED';

  if (isOnlyEnded) {
    filter.endDate = { $lte: new Date() };
  } else if (!isIncludePast) {
    // By default, only send active events whose end date time is greater than current time
    filter.endDate = { $gt: new Date() };
  }

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

  // Filter by event date range / date
  applyDateFilter(filter, query);

  // Filter by price range (ticket price)
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const priceFilter: Record<string, any> = {};
    if (query.minPrice !== undefined && query.minPrice !== '') {
      const parsedMin = Number(query.minPrice);
      if (!isNaN(parsedMin)) {
        priceFilter.$gte = parsedMin;
      }
    }
    if (query.maxPrice !== undefined && query.maxPrice !== '') {
      const parsedMax = Number(query.maxPrice);
      if (!isNaN(parsedMax)) {
        priceFilter.$lte = parsedMax;
      }
    }
    if (Object.keys(priceFilter).length > 0) {
      if (filter.$or) {
        filter.$and = filter.$and || [];
        filter.$and.push({ 'priceCategories.price': priceFilter });
      } else {
        filter['priceCategories.price'] = priceFilter;
      }
    }

  }

  // Filter by ticket availability (Available, Sold Out, Few Left)
  if (query.ticketAvailability) {
    const availability = query.ticketAvailability
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[\s\-_]+/g, '_');

    if (availability === 'AVAILABLE' || availability === 'IN_STOCK') {
      filter['priceCategories.stock'] = { $gt: 0 };
    } else if (availability === 'SOLD_OUT' || availability === 'SOLDOUT' || availability === 'OUT_OF_STOCK') {
      filter['priceCategories.stock'] = { $lte: 0 };
    } else if (availability === 'FEW_LEFT' || availability === 'FEWLEFT') {
      filter['priceCategories.stock'] = { $gt: 0, $lte: 10 };
    }
  }


  // Filter by rewards availability (true / false)
  if (query.rewardsAvailable !== undefined && query.rewardsAvailable !== '') {
    const isRewardsAvailable =
      query.rewardsAvailable === true || query.rewardsAvailable === 'true';
    const isRewardsUnavailable =
      query.rewardsAvailable === false || query.rewardsAvailable === 'false';

    if (isRewardsAvailable) {
      filter['rewards.0'] = { $exists: true };
    } else if (isRewardsUnavailable) {
      filter['rewards.0'] = { $exists: false };
    }
  }

  // Filter by active status (isActive: true / false)
  if (query.isActive !== undefined && query.isActive !== '') {
    const isActive = query.isActive === true || query.isActive === 'true';
    if (isActive) {
      filter.isActive = { $ne: false };
    } else {
      filter.isActive = false;
    }
  }

  // Filter by timeline status (ONGOING, UPCOMING, COMPLETED/ENDED)
  if (query.status && query.status !== 'ALL' && query.status !== 'all') {
    const s = query.status.toUpperCase();
    const now = new Date();
    if (s === 'UPCOMING') {
      filter.startDate = { ...(filter.startDate || {}), $gt: now };
    } else if (s === 'ONGOING' || s === 'ACTIVE') {
      filter.startDate = { ...(filter.startDate || {}), $lte: now };
      filter.endDate = { ...(filter.endDate || {}), $gte: now };
    } else if (s === 'COMPLETED' || s === 'ENDED') {
      filter.endDate = { ...(filter.endDate || {}), $lt: now };
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

  const eventIds = paginatedEvents.map((e) => e._id);
  const ticketSales =
    eventIds.length > 0
      ? await EventOrder.aggregate([
          {
            $match: {
              eventId: { $in: eventIds },
              status: { $ne: 'CANCELLED' },
            },
          },
          {
            $group: {
              _id: '$eventId',
              totalSold: { $sum: '$totalTicketQuantity' },
            },
          },
        ])
      : [];

  const salesMap = new Map<string, number>();
  ticketSales.forEach((item) => {
    salesMap.set(item._id.toString(), item.totalSold || 0);
  });

  const resultWithTicketsSold = paginatedEvents.map((event) => {
    const eventObj = event.toObject();
    return {
      ...eventObj,
      ticketsSold: salesMap.get(event._id.toString()) || 0,
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    result: resultWithTicketsSold as any,
  };
};


export const getEventByIdService = async (
  id: string
): Promise<IEvent | Record<string, any>> => {
  const event = await Event.findById(id)
    .populate('hostId', 'name email role profileImage')
    .populate('categoryId', 'name description');

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const ticketSales = await EventOrder.aggregate([
    {
      $match: {
        eventId: event._id,
        status: { $ne: 'CANCELLED' },
      },
    },
    {
      $group: {
        _id: '$eventId',
        totalSold: { $sum: '$totalTicketQuantity' },
      },
    },
  ]);

  const ticketsSold = ticketSales[0]?.totalSold || 0;
  const eventObj = event.toObject();

  return {
    ...eventObj,
    ticketsSold,
  };
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

  // Cancel associated paid ticket orders & deduct points earned by users for this event
  const paidOrders = await EventOrder.find({
    eventId: event._id,
    status: { $in: ['PAID', 'COMPLETED'] },
  });

  for (const order of paidOrders) {
    const pointsToDeduct =
      order.pointsEarned !== undefined && order.pointsEarned !== null && order.pointsEarned > 0
        ? order.pointsEarned
        : order.totalTicketQuantity || 0;

    if (pointsToDeduct > 0) {
      const buyer = await User.findById(order.user);
      if (buyer) {
        buyer.totalPoints = Math.max(0, (buyer.totalPoints || 0) - pointsToDeduct);
        await buyer.save();
      }
    }

    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    await order.save();
  }

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

  // Filter by event date range / date
  applyDateFilter(filter, query);

  // Filter by active status (isActive: true / false)
  if (query.isActive !== undefined && query.isActive !== '') {
    const isActive = query.isActive === true || query.isActive === 'true';
    if (isActive) {
      filter.isActive = { $ne: false };
    } else {
      filter.isActive = false;
    }
  }

  // Filter by timeline status (ONGOING, UPCOMING, COMPLETED/ENDED, ACTIVE, INACTIVE)
  if (query.status && query.status !== 'ALL' && query.status !== 'all') {
    const s = query.status.toString().trim().toUpperCase();
    const now = new Date();
    if (s === 'UPCOMING') {
      filter.startDate = { ...(filter.startDate || {}), $gt: now };
    } else if (s === 'ONGOING' || s === 'LIVE') {
      filter.startDate = { ...(filter.startDate || {}), $lte: now };
      filter.endDate = { ...(filter.endDate || {}), $gte: now };
    } else if (s === 'COMPLETED' || s === 'ENDED') {
      filter.endDate = { ...(filter.endDate || {}), $lt: now };
    } else if (s === 'ACTIVE') {
      filter.isActive = { $ne: false };
    } else if (s === 'INACTIVE') {
      filter.isActive = false;
    }
  }

  // Filter by price range (ticket price)
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const priceFilter: Record<string, any> = {};
    if (query.minPrice !== undefined && query.minPrice !== '') {
      const parsedMin = Number(query.minPrice);
      if (!isNaN(parsedMin)) {
        priceFilter.$gte = parsedMin;
      }
    }
    if (query.maxPrice !== undefined && query.maxPrice !== '') {
      const parsedMax = Number(query.maxPrice);
      if (!isNaN(parsedMax)) {
        priceFilter.$lte = parsedMax;
      }
    }
    if (Object.keys(priceFilter).length > 0) {
      const priceOr = [
        { ticketPrice: priceFilter },
        { 'priceCategories.price': priceFilter },
      ];
      if (filter.$or) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: priceOr });
      } else {
        filter.$or = priceOr;
      }
    }
  }

  // Filter by ticket availability (Available, Sold Out, Few Left)
  if (query.ticketAvailability) {
    const availability = query.ticketAvailability
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[\s\-_]+/g, '_');

    if (availability === 'AVAILABLE' || availability === 'IN_STOCK') {
      filter.stock = { $gt: 0 };
    } else if (availability === 'SOLD_OUT' || availability === 'SOLDOUT' || availability === 'OUT_OF_STOCK') {
      filter.stock = { $lte: 0 };
    } else if (availability === 'FEW_LEFT' || availability === 'FEWLEFT') {
      filter.stock = { $gt: 0, $lte: 10 };
    }
  }

  // Filter by rewards availability (true / false)
  if (query.rewardsAvailable !== undefined && query.rewardsAvailable !== '') {
    const isRewardsAvailable =
      query.rewardsAvailable === true || query.rewardsAvailable === 'true';
    const isRewardsUnavailable =
      query.rewardsAvailable === false || query.rewardsAvailable === 'false';

    if (isRewardsAvailable) {
      filter['rewards.0'] = { $exists: true };
    } else if (isRewardsUnavailable) {
      filter['rewards.0'] = { $exists: false };
    }
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const total = await Event.countDocuments(filter);
  const totalPage = Math.ceil(total / limit);

  const sortBy = (query as any).sortBy || 'createdAt';
  const sortOrder = (query as any).sortOrder === 'asc' ? 1 : -1;
  const sortFieldMap: Record<string, string> = {
    startDate: 'startDate',
    title: 'title',
    createdAt: 'createdAt',
    rewardPoints: 'rewards.pointsRequired',
  };
  const sortOption: Record<string, any> = {};
  sortOption[sortFieldMap[sortBy] || 'createdAt'] = sortOrder;

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
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const eventIds = paginatedEvents.map((e) => e._id);
  const ticketSales =
    eventIds.length > 0
      ? await EventOrder.aggregate([
          {
            $match: {
              eventId: { $in: eventIds },
              status: { $ne: 'CANCELLED' },
            },
          },
          {
            $group: {
              _id: '$eventId',
              totalSold: { $sum: '$totalTicketQuantity' },
            },
          },
        ])
      : [];

  const salesMap = new Map<string, number>();
  ticketSales.forEach((item) => {
    salesMap.set(item._id.toString(), item.totalSold || 0);
  });

  const resultWithTicketsSold = paginatedEvents.map((event) => {
    const eventObj = event.toObject();
    return {
      ...eventObj,
      ticketsSold: salesMap.get(event._id.toString()) || 0,
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    result: resultWithTicketsSold as any,
  };
};



// @desc    Get summary statistics for events
export const getEventStatsService = async () => {
  const now = new Date();
  const totalEvents = await Event.countDocuments();
  const activeEvents = await Event.countDocuments({ isActive: { $ne: false } });
  const inactiveEvents = await Event.countDocuments({ isActive: false });
  const ongoingEvents = await Event.countDocuments({
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
  const upcomingEvents = await Event.countDocuments({
    startDate: { $gt: now },
  });
  const completedEvents = await Event.countDocuments({
    endDate: { $lt: now },
  });

  const ticketSales = await EventOrder.aggregate([
    {
      $match: {
        status: { $ne: 'CANCELLED' },
      },
    },
    {
      $group: {
        _id: null,
        totalSold: { $sum: '$totalTicketQuantity' },
      },
    },
  ]);

  const totalParticipants = ticketSales[0]?.totalSold || 0;

  const rewardPointsAgg = await Event.aggregate([
    { $unwind: { path: '$rewards', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$rewards.pointsRequired' },
      },
    },
  ]);
  const totalRewardPoints = rewardPointsAgg[0]?.totalPoints || 0;

  return {
    totalEvents,
    activeEvents,
    inactiveEvents,
    ongoingEvents,
    upcomingEvents,
    completedEvents,
    cancelledEvents: 0,
    totalParticipants,
    totalRewardPoints,
    statusCounts: {
      all: totalEvents,
      active: activeEvents,
      inactive: inactiveEvents,
      ongoing: ongoingEvents,
      upcoming: upcomingEvents,
      completed: completedEvents,
      cancelled: 0,
    },
  };
};
