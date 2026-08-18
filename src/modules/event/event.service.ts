import { Event } from './event.model.js';
import { Category } from '../category/category.model.js';
import { AppError } from '../../utils/AppError.js';
import { uploadToS3 } from '../../utils/s3.js';
import type { IMeta } from '../../utils/sendResponse.js';
import type { CreateEventInput, EventQuery, IEvent } from './event.interface.js';

export const createEventService = async (
  hostId: string,
  data: CreateEventInput,
  files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[]
): Promise<IEvent> => {
  const categoryExists = await Category.findById(data.categoryId);
  if (!categoryExists) {
    throw new AppError('Category not found with the provided categoryId', 404);
  }

  let eventImageFiles: Express.Multer.File[] = [];
  let artistImageFiles: Express.Multer.File[] = [];
  let rewardImageFiles: Express.Multer.File[] = [];

  if (files) {
    if (Array.isArray(files)) {
      eventImageFiles = files.filter((f) => f.fieldname === 'images');
      artistImageFiles = files.filter(
        (f) => f.fieldname === 'artistImages' || f.fieldname.startsWith('artistImage')
      );
      rewardImageFiles = files.filter(
        (f) => f.fieldname === 'rewardImages' || f.fieldname.startsWith('rewardImage')
      );
    } else {
      eventImageFiles = files['images'] || [];
      artistImageFiles = files['artistImages'] || [];
      rewardImageFiles = files['rewardImages'] || [];
    }
  }

  // 1. Process Event Images
  const eventImages: string[] = Array.isArray(data.images) ? [...data.images] : [];
  if (eventImageFiles.length > 0) {
    for (const file of eventImageFiles) {
      const s3Url = await uploadToS3(file, 'events');
      eventImages.push(s3Url);
    }
  }

  // 2. Process Artist Images (upload artist image file to S3 per artist index)
  const processedArtistInfo = await Promise.all(
    (data.artistInfo || []).map(async (artist, index) => {
      let imageUrl = artist.image || '';

      const artistFile = artistImageFiles[index];
      if (artistFile) {
        imageUrl = await uploadToS3(artistFile, 'artists');
      }

      return {
        name: artist.name,
        role: artist.role,
        image: imageUrl,
        socialMediaLinks: artist.socialMediaLinks || {},
      };
    })
  );

  // 3. Process Reward Images (upload reward image file to S3 per reward index)
  const processedRewards = await Promise.all(
    (data.rewards || []).map(async (reward, index) => {
      let imageUrl = reward.image || '';

      const rewardFile = rewardImageFiles[index];
      if (rewardFile) {
        imageUrl = await uploadToS3(rewardFile, 'rewards');
      }

      if (!imageUrl) {
        throw new AppError(`A picture is required for reward: "${reward.title}"`, 400);
      }

      return {
        title: reward.title,
        description: reward.description,
        pointsRequired: reward.pointsRequired,
        stock: reward.stock,
        image: imageUrl,
      };
    })
  );

  const event = await Event.create({
    ...data,
    hostId,
    images: eventImages,
    artistInfo: processedArtistInfo,
    rewards: processedRewards,
  } as any);

  return event;
};

export const getAllEventsAdminService = async (
  query: EventQuery
): Promise<{ meta: IMeta; result: IEvent[] }> => {
  const filter: Record<string, any> = {};

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { placeName: { $regex: query.search, $options: 'i' } },
    ];
  }

  if (query.categoryId) {
    filter.categoryId = query.categoryId;
  }

  if (query.hostId) {
    filter.hostId = query.hostId;
  }

  const page = Math.max(1, Number(query.page) || 1);
  const requestedLimit = Math.max(1, Number(query.limit) || 10);
  const limit = Math.min(requestedLimit, 20); // Cap per page at maximum 20
  const skip = (page - 1) * limit;

  const total = await Event.countDocuments(filter);
  const totalPage = Math.ceil(total / limit);

  const events = await Event.find(filter)
    .populate('hostId', 'name email role')
    .populate('categoryId', 'name description')
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
    result: events,
  };
};

export const getEventByIdService = async (
  id: string
): Promise<IEvent> => {
  const event = await Event.findById(id)
    .populate('hostId', 'name email role')
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

  return event;
};
