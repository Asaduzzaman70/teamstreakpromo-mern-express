import type { Document, Types } from 'mongoose';

export type BusinessPartnerTimeRange =
  | 'week'
  | 'month'
  | 'year'
  | 'last6months'
  | 'last30days'
  | 'last7days';

export interface IBusinessPartnerChartDataPoint {
  label: string;
  date?: string;
  sells: number;
  claimsCount: number;
  storeVisits: number;
}

export interface IBusinessPartnerOverview {
  totalClaims: number;
  storeVisits: number;
  totalRewards: number;
  activeRewards: number;
  totalClaimOrders: number;
}

export interface IBusinessPartnerRewardSellChartResponse {
  range: BusinessPartnerTimeRange;
  year: number;
  month?: number;
  totalSells: number;
  totalStoreVisits: number;
  data: IBusinessPartnerChartDataPoint[];
}

export interface IBusinessPartnerAnalyticsFullResponse {
  overview: IBusinessPartnerOverview;
  rewardSellChart: IBusinessPartnerRewardSellChartResponse;
}

export interface BusinessPartnerAnalyticsQuery {
  range?: BusinessPartnerTimeRange | undefined;
  year?: number | undefined;
  month?: number | undefined;
  itemId?: string | undefined;
}

export interface IBusinessPartnerMetric extends Document {
  businessOwnerId: Types.ObjectId;
  metricType: string;
  date: Date;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}
