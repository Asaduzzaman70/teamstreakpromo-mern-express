import { Schema, model, type Document } from 'mongoose';

export interface IMarketplace extends Document {
  businessOwnerId: Schema.Types.ObjectId;
  title: string;
  description: string;
  category: Schema.Types.ObjectId;
  subCategory?: Schema.Types.ObjectId;
  location: string;
  latitude: number;
  longitude: number;
  startDateTime: Date;
  endDateTime: Date;
  points: number;
  quantity: number;
  claimQuantity: number;
  rating: number;
  sold: number;
  photos: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceSchema = new Schema<IMarketplace>(
  {
    businessOwnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Business Owner ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Reward Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Reward Description is required'],
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'RewardCategory',
      required: [true, 'Reward Category is required'],
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: 'RewardSubCategory',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
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
    startDateTime: {
      type: Date,
      required: [true, 'Start Date & Time is required'],
    },
    endDateTime: {
      type: Date,
      required: [true, 'End Date & Time is required'],
    },
    points: {
      type: Number,
      required: [true, 'Reward Points are required'],
      min: [0, 'Points cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Reward Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    claimQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Claim quantity cannot be negative'],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    sold: {
      type: Number,
      default: 0,
      min: [0, 'Sold count cannot be negative'],
    },
    photos: {
      type: [String],
      required: [true, 'At least one photo is required'],
      validate: [
        (val: string[]) => val.length > 0,
        'At least one photo is required'
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Marketplace = model<IMarketplace>('Marketplace', MarketplaceSchema);
