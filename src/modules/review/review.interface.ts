import type { Document, Types } from 'mongoose';

export type ExperienceType = 'POSITIVE' | 'NEGATIVE';

export interface IReview extends Document {
  user: Types.ObjectId;
  event: Types.ObjectId;
  host: Types.ObjectId;
  order: Types.ObjectId;
  rating: number;
  experience: ExperienceType;
  tags: string[];
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewInput {
  eventId: string;
  rating: number;
  experience: ExperienceType;
  tags?: string[];
  feedback?: string;
}

export interface ReviewQuery {
  page?: number | string;
  limit?: number | string;
  experience?: ExperienceType;
  rating?: number | string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  positiveCount: number;
  negativeCount: number;
  starBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  popularTags: { tag: string; count: number }[];
}

export interface ReviewEligibilityResult {
  canReview: boolean;
  message: string;
  isBooked: boolean;
  isCompleted: boolean;
  hasReviewed: boolean;
  existingReview?: IReview | null;
}
