import { Types } from 'mongoose';
import { EventOrder } from '../eventOrder/eventOrder.model.js';
import { Event } from '../event/event.model.js';
import { AppError } from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import type {
  HostAnalyticsQuery,
  HostAnalyticsTimeRange,
  HostChartQuery,
  IHostAnalyticsFullResponse,
  IHostAnalyticsOverview,
  IHostChartDataPoint,
  IHostRevenueChartResponse,
  IHostTicketSalesChartResponse,
} from './hostAnalytics.interface.js';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Builds the base match query for completed/paid event orders for a host.
 */
const buildHostMatchQuery = (hostId: string, eventId?: string): Record<string, any> => {
  if (!Types.ObjectId.isValid(hostId)) {
    throw new AppError('Invalid host ID', 400);
  }

  const match: Record<string, any> = {
    hostId: new Types.ObjectId(hostId),
    status: { $in: ['PAID', 'COMPLETED'] },
  };

  if (eventId) {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new AppError('Invalid event ID', 400);
    }
    match.eventId = new Types.ObjectId(eventId);
  }

  return match;
};

/**
 * Retrieves high-level lifetime/aggregate metrics for a host.
 */
const getHostOverview = async (
  hostId: string,
  eventId?: string
): Promise<IHostAnalyticsOverview> => {
  const matchQuery = buildHostMatchQuery(hostId, eventId);

  const [orderSummary] = await EventOrder.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalTicketsSold: { $sum: '$totalTicketQuantity' },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  const eventFilter: Record<string, any> = { hostId: new Types.ObjectId(hostId) };
  if (eventId) {
    eventFilter._id = new Types.ObjectId(eventId);
  }
  const totalEvents = await Event.countDocuments(eventFilter);

  const totalRevenue = Math.round((orderSummary?.totalRevenue || 0) * 100) / 100;
  const totalTicketsSold = orderSummary?.totalTicketsSold || 0;
  const totalOrders = orderSummary?.totalOrders || 0;

  return {
    totalRevenue,
    totalTicketsSold,
    totalEvents,
    totalOrders,
  };
};

/**
 * Helper to compute date range and bucket template for aggregation.
 */
const prepareTimeBuckets = (
  range: HostAnalyticsTimeRange = 'year',
  yearParam?: number,
  monthParam?: number
) => {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth(); // 0-indexed

  if (range === 'week') {
    // Current Monday to Sunday
    const dayOfWeek = now.getUTCDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday, 0, 0, 0, 0)
    );
    const endDate = new Date(
      Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() + 6, 23, 59, 59, 999)
    );

    const buckets: { key: string; label: string; date: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() + i)
      );
      const dateStr = d.toISOString().split('T')[0]!;
      buckets.push({
        key: dateStr,
        label: DAY_NAMES[i]!,
        date: dateStr,
      });
    }

    return {
      type: 'DATE_STRING' as const,
      startDate,
      endDate,
      buckets,
      year: startDate.getUTCFullYear(),
      month: startDate.getUTCMonth() + 1,
    };
  }

  if (range === 'last7days') {
    const startDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 0, 0, 0, 0)
    );
    const endDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
    );

    const buckets: { key: string; label: string; date: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() + i)
      );
      const dateStr = d.toISOString().split('T')[0]!;
      const dayIdx = (d.getUTCDay() + 6) % 7;
      buckets.push({
        key: dateStr,
        label: DAY_NAMES[dayIdx]!,
        date: dateStr,
      });
    }

    return {
      type: 'DATE_STRING' as const,
      startDate,
      endDate,
      buckets,
      year: currentYear,
      month: currentMonth + 1,
    };
  }

  if (range === 'month') {
    const targetYear = yearParam || currentYear;
    const targetMonth = monthParam !== undefined ? monthParam - 1 : currentMonth;
    const daysInMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();

    const startDate = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(targetYear, targetMonth, daysInMonth, 23, 59, 59, 999));

    const buckets: { key: number; label: string; date: string }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      buckets.push({
        key: d,
        label: String(d).padStart(2, '0'),
        date: dateStr,
      });
    }

    return {
      type: 'DAY_OF_MONTH' as const,
      startDate,
      endDate,
      buckets,
      year: targetYear,
      month: targetMonth + 1,
    };
  }

  if (range === 'last30days') {
    const startDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29, 0, 0, 0, 0)
    );
    const endDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
    );

    const buckets: { key: string; label: string; date: string }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() + i)
      );
      const dateStr = d.toISOString().split('T')[0]!;
      const label = `${MONTH_NAMES[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')}`;
      buckets.push({
        key: dateStr,
        label,
        date: dateStr,
      });
    }

    return {
      type: 'DATE_STRING' as const,
      startDate,
      endDate,
      buckets,
      year: currentYear,
      month: currentMonth + 1,
    };
  }

  if (range === 'last6months') {
    const buckets: { key: string; label: string; date: string }[] = [];
    const startMonthDate = new Date(Date.UTC(currentYear, currentMonth - 5, 1, 0, 0, 0, 0));
    const daysInCurrentMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
    const endMonthDate = new Date(Date.UTC(currentYear, currentMonth, daysInCurrentMonth, 23, 59, 59, 999));

    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(currentYear, currentMonth - i, 1));
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      buckets.push({
        key,
        label: MONTH_NAMES[m]!,
        date: `${key}-01`,
      });
    }

    return {
      type: 'YEAR_MONTH_STRING' as const,
      startDate: startMonthDate,
      endDate: endMonthDate,
      buckets,
      year: currentYear,
      month: currentMonth + 1,
    };
  }

  // Default: 'year' - 12 calendar months
  const targetYear = yearParam || currentYear;
  const startDate = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));

  const buckets: { key: number; label: string; date: string }[] = [];
  for (let m = 1; m <= 12; m++) {
    const dateStr = `${targetYear}-${String(m).padStart(2, '0')}-01`;
    buckets.push({
      key: m,
      label: MONTH_NAMES[m - 1]!,
      date: dateStr,
    });
  }

  return {
    type: 'MONTH_OF_YEAR' as const,
    startDate,
    endDate,
    buckets,
    year: targetYear,
  };
};

/**
 * Aggregates revenue chart data for host.
 */
const getHostRevenueChart = async (
  hostId: string,
  query: HostChartQuery = {}
): Promise<IHostRevenueChartResponse> => {
  const range = query.range || 'year';
  const matchQuery = buildHostMatchQuery(hostId, query.eventId);
  const { type, startDate, endDate, buckets, year, month } = prepareTimeBuckets(
    range,
    query.year,
    query.month
  );

  let groupKeyExpr: any;
  if (type === 'MONTH_OF_YEAR') {
    groupKeyExpr = { $month: '$createdAt' };
  } else if (type === 'DAY_OF_MONTH') {
    groupKeyExpr = { $dayOfMonth: '$createdAt' };
  } else if (type === 'YEAR_MONTH_STRING') {
    groupKeyExpr = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  } else {
    groupKeyExpr = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  }

  const aggregated = await EventOrder.aggregate([
    {
      $match: {
        ...matchQuery,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: groupKeyExpr,
        revenue: { $sum: '$totalAmount' },
        ordersCount: { $sum: 1 },
      },
    },
  ]);

  const aggMap = new Map<string | number, { revenue: number; ordersCount: number }>();
  for (const item of aggregated) {
    aggMap.set(item._id, {
      revenue: Math.round(item.revenue * 100) / 100,
      ordersCount: item.ordersCount,
    });
  }

  let totalPeriodRevenue = 0;
  const data: IHostChartDataPoint[] = buckets.map((b) => {
    const found = aggMap.get(b.key);
    const revenue = found ? found.revenue : 0;
    const ordersCount = found ? found.ordersCount : 0;
    totalPeriodRevenue += revenue;

    return {
      label: b.label,
      date: b.date,
      revenue,
      ordersCount,
    };
  });

  return {
    range,
    year,
    ...(month ? { month } : {}),
    totalRevenue: Math.round(totalPeriodRevenue * 100) / 100,
    data,
  };
};

/**
 * Aggregates ticket sales chart data for host.
 */
const getHostTicketSalesChart = async (
  hostId: string,
  query: HostChartQuery = {}
): Promise<IHostTicketSalesChartResponse> => {
  const range = query.range || 'month';
  const matchQuery = buildHostMatchQuery(hostId, query.eventId);
  const { type, startDate, endDate, buckets, year, month } = prepareTimeBuckets(
    range,
    query.year,
    query.month
  );

  let groupKeyExpr: any;
  if (type === 'MONTH_OF_YEAR') {
    groupKeyExpr = { $month: '$createdAt' };
  } else if (type === 'DAY_OF_MONTH') {
    groupKeyExpr = { $dayOfMonth: '$createdAt' };
  } else if (type === 'YEAR_MONTH_STRING') {
    groupKeyExpr = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  } else {
    groupKeyExpr = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  }

  const aggregated = await EventOrder.aggregate([
    {
      $match: {
        ...matchQuery,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: groupKeyExpr,
        ticketsSold: { $sum: '$totalTicketQuantity' },
        ordersCount: { $sum: 1 },
      },
    },
  ]);

  const aggMap = new Map<string | number, { ticketsSold: number; ordersCount: number }>();
  for (const item of aggregated) {
    aggMap.set(item._id, {
      ticketsSold: item.ticketsSold,
      ordersCount: item.ordersCount,
    });
  }

  let totalPeriodTickets = 0;
  const data: IHostChartDataPoint[] = buckets.map((b) => {
    const found = aggMap.get(b.key);
    const ticketsSold = found ? found.ticketsSold : 0;
    const ordersCount = found ? found.ordersCount : 0;
    totalPeriodTickets += ticketsSold;

    return {
      label: b.label,
      date: b.date,
      ticketsSold,
      ordersCount,
    };
  });

  return {
    range,
    year,
    ...(month ? { month } : {}),
    totalTicketsSold: totalPeriodTickets,
    data,
  };
};

/**
 * Aggregates full host analytics section (Overview cards, Revenue chart, and Ticket Sales chart).
 */
const getHostAnalytics = async (
  hostId: string,
  query: HostAnalyticsQuery = {}
): Promise<IHostAnalyticsFullResponse> => {
  const revenueRange = query.revenueRange || query.range || 'year';
  const ticketRange = query.ticketRange || query.range || 'month';

  logger.info('Calculating host analytics', {
    hostId,
    eventId: query.eventId,
    revenueRange,
    ticketRange,
  });

  const [overview, revenueChart, ticketSalesChart] = await Promise.all([
    getHostOverview(hostId, query.eventId),
    getHostRevenueChart(hostId, {
      range: revenueRange,
      year: query.year,
      month: query.month,
      eventId: query.eventId,
    }),
    getHostTicketSalesChart(hostId, {
      range: ticketRange,
      year: query.year,
      month: query.month,
      eventId: query.eventId,
    }),
  ]);

  return {
    overview,
    revenueChart,
    ticketSalesChart,
  };
};

export const HostAnalyticsService = {
  getHostOverview,
  getHostRevenueChart,
  getHostTicketSalesChart,
  getHostAnalytics,
};
