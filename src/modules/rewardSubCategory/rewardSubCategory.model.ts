import { Schema, model, type Document } from 'mongoose';

export interface IRewardSubCategory extends Document {
  name: string;
  description?: string;
  rewardCategory: Schema.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RewardSubCategorySchema = new Schema<IRewardSubCategory>(
  {
    name: {
      type: String,
      required: [true, 'Reward Subcategory name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    rewardCategory: {
      type: Schema.Types.ObjectId,
      ref: 'RewardCategory',
      required: [true, 'Reward Category ID is required'],
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

// Ensure unique subcategory name within the same reward category
RewardSubCategorySchema.index({ name: 1, rewardCategory: 1 }, { unique: true });

export const RewardSubCategory = model<IRewardSubCategory>('RewardSubCategory', RewardSubCategorySchema);
