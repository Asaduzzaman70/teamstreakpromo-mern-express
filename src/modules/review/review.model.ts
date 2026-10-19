import { Schema, model } from 'mongoose';
import type { IReview } from './review.interface.js';

const ReviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host ID is required'],
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'EventOrder',
      required: [true, 'Associated event order ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    experience: {
      type: String,
      enum: {
        values: ['POSITIVE', 'NEGATIVE'],
        message: 'Experience must be either POSITIVE or NEGATIVE',
      },
      required: [true, 'Experience sentiment is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [300, 'Feedback cannot exceed 300 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per event
ReviewSchema.index({ user: 1, event: 1 }, { unique: true });

// Fast querying by event or host
ReviewSchema.index({ event: 1, createdAt: -1 });
ReviewSchema.index({ host: 1, createdAt: -1 });

export const Review = model<IReview>('Review', ReviewSchema);
