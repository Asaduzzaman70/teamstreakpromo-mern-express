import type { Document, Types } from 'mongoose';

export type HostAnalyticsTimeRange =
  | 'week'
  | 'month'
  | 'year'
  | 'last6months'
  | 'last30days'
  | 'last7days';

export interface IHostChartDataPoint {
  label: string;
  date?: string;
  revenue?: number;
  ticketsSold?: number;
  ordersCount: number;
}

export interface IHostAnalyticsOverview {
  totalRevenue: number;
  totalTicketsSold: number;
  totalEvents: number;
  totalOrders: number;
}

export interface IHostRevenueChartResponse {
  range: HostAnalyticsTimeRange;
  year: number;
  month?: number;
  totalRevenue: number;
  data: IHostChartDataPoint[];
}

export interface IHostTicketSalesChartResponse {
  range: HostAnalyticsTimeRange;
  year: number;
  month?: number;
  totalTicketsSold: number;
  data: IHostChartDataPoint[];
}

export interface IHostAnalyticsFullResponse {
  overview: IHostAnalyticsOverview;
  revenueChart: IHostRevenueChartResponse;
  ticketSalesChart: IHostTicketSalesChartResponse;
}

export interface HostAnalyticsQuery {
  range?: HostAnalyticsTimeRange | undefined;
  revenueRange?: HostAnalyticsTimeRange | undefined;
  ticketRange?: HostAnalyticsTimeRange | undefined;
  year?: number | undefined;
  month?: number | undefined;
  eventId?: string | undefined;
}

export interface HostChartQuery {
  range?: HostAnalyticsTimeRange | undefined;
  year?: number | undefined;
  month?: number | undefined;
  eventId?: string | undefined;
}

export interface IHostAnalyticsMetric extends Document {
  hostId: Types.ObjectId;
  metricType: string;
  date: Date;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}
