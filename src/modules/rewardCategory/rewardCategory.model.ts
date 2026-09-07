import { Schema, model, type Document } from 'mongoose';

export interface IRewardCategory extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RewardCategorySchema = new Schema<IRewardCategory>(
  {
    name: {
      type: String,
      required: [true, 'Reward Category name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
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

export const RewardCategory = model<IRewardCategory>('RewardCategory', RewardCategorySchema);
