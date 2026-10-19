import { Schema, model } from 'mongoose';
import type { IPartnerReview } from './partnerReview.interface.js';

const PartnerReviewSchema = new Schema<IPartnerReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Marketplace',
      required: [true, 'Product / Marketplace item ID is required'],
      index: true,
    },
    businessPartner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Business Partner ID is required'],
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Associated order ID is required'],
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

// One review per user per product
PartnerReviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Query indexes for fast retrieval
PartnerReviewSchema.index({ product: 1, createdAt: -1 });
PartnerReviewSchema.index({ businessPartner: 1, createdAt: -1 });

export const PartnerReview = model<IPartnerReview>(
  'PartnerReview',
  PartnerReviewSchema
);
