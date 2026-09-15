import { Schema, model } from 'mongoose';
import type { IEvent } from './event.interface.js';

const ArtistInfoSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true },
    image: { type: String, trim: true },
    socialMediaLinks: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const PriceCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'], default: 0 },
    stock: { type: Number, required: true, min: [0, 'Stock cannot be negative'], default: 0 },
  },
  { timestamps: true }
);

const RewardSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    pointsRequired: { type: Number, required: true, min: 0, default: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const EventSchema = new Schema<IEvent>(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host ID is required'],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    ageRestriction: {
      type: Number,
      default: 0,
    },
    placeName: {
      type: String,
      required: [true, 'Place name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    priceCategories: {

      type: [PriceCategorySchema],
      default: [],
      validate: [
        (val: any[]) => !val || val.length <= 10,
        'Cannot have more than 10 price categories',
      ],
    },

    images: {
      type: [String],
      default: [],
    },
    artistInfo: {
      type: [ArtistInfoSchema],
      default: [],
    },
    rewards: {
      type: [RewardSchema],
      default: [],
    },
    payoutStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED'],
      default: 'PENDING',
    },
    payoutAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    platformFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    stripeTransferId: {
      type: String,
      trim: true,
    },
    payoutError: {
      type: String,
      trim: true,
    },
    paidOutAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Event = model<IEvent>('Event', EventSchema);
