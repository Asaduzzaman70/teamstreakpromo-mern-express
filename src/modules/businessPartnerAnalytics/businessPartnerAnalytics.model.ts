import { Schema, model } from 'mongoose';
import type { IBusinessPartnerMetric } from './businessPartnerAnalytics.interface.js';

const BusinessPartnerMetricSchema = new Schema<IBusinessPartnerMetric>(
  {
    businessOwnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    metricType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    value: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

BusinessPartnerMetricSchema.index({ businessOwnerId: 1, metricType: 1, date: -1 });

export const BusinessPartnerMetric = model<IBusinessPartnerMetric>(
  'BusinessPartnerMetric',
  BusinessPartnerMetricSchema
);
