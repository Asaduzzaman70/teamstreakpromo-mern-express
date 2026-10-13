import { Schema, model } from 'mongoose';
import type { IContent } from './content.interface.js';

const ContentSchema = new Schema<IContent>(
  {
    title: {
      type: String,
      required: [true, 'Page title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Page slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Page content is required'],
    },
    contentType: {
      type: String,
      enum: ['HTML', 'MARKDOWN', 'TEXT'],
      default: 'HTML',
    },
    category: {
      type: String,
      enum: ['LEGAL', 'TERMS_AND_CONDITIONS', 'COMPANY', 'SUPPORT', 'GENERAL'],
      default: 'GENERAL',
      index: true,
    },
    status: {
      type: String,
      enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
      default: 'PUBLISHED',
      index: true,
    },
    metaTitle: {
      type: String,
      trim: true,
      default: '',
    },
    metaDescription: {
      type: String,
      trim: true,
      default: '',
    },
    isSystemPage: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high performance query filtering
ContentSchema.index({ category: 1, status: 1 });
ContentSchema.index({ slug: 1, status: 1 });

export const Content = model<IContent>('Content', ContentSchema);
