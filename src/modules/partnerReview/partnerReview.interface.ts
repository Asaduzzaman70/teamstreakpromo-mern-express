import type { Document, Types } from 'mongoose';

export type PartnerExperienceType = 'POSITIVE' | 'NEGATIVE';

export interface IPartnerReview extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  businessPartner: Types.ObjectId;
  order: Types.ObjectId;
  rating: number;
  experience: PartnerExperienceType;
  tags: string[];
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePartnerReviewInput {
  productId: string;
  orderId?: string;
  rating: number;
  experience: PartnerExperienceType;
  tags?: string[];
  feedback?: string;
}

export interface PartnerReviewQuery {
  page?: number | string;
  limit?: number | string;
  experience?: PartnerExperienceType;
  rating?: number | string;
}

export interface PartnerReviewStats {
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

export interface PartnerReviewEligibilityResult {
  canReview: boolean;
  message: string;
  isClaimed: boolean;
  isRedeemed: boolean;
  hasReviewed: boolean;
  existingReview?: IPartnerReview | null;
}
