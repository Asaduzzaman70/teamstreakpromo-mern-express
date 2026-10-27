import { Types } from 'mongoose';
import { Order } from '../order/order.model.js';
import { Marketplace } from '../marketplace/marketplace.model.js';
import { AppError } from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import type {
  BusinessPartnerAnalyticsQuery,
  BusinessPartnerTimeRange,
  IBusinessPartnerAnalyticsFullResponse,
  IBusinessPartnerChartDataPoint,
  IBusinessPartnerOverview,
  IBusinessPartnerRewardSellChartResponse,
} from './businessPartnerAnalytics.interface.js';

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
 * Builds the base match query for orders belonging to a business partner's marketplace items.
 */
const buildBusinessMatchQuery = (
  businessOwnerId: string,
  itemId?: string
): Record<string, any> => {
  if (!Types.ObjectId.isValid(businessOwnerId)) {
    throw new AppError('Invalid business owner ID', 400);
  }

  const match: Record<string, any> = {
    businessOwnerId: new Types.ObjectId(businessOwnerId),
    itemType: 'MARKETPLACE',
    status: { $in: ['CLAIMED', 'REDEEMED'] },
  };

  if (itemId) {
    if (!Types.ObjectId.isValid(itemId)) {
      throw new AppError('Invalid reward item ID', 400);
    }
    match.itemId = new Types.ObjectId(itemId);
  }

  return match;
};

/**
 * Retrieves high-level lifetime/aggregate metrics for a business partner.
 */
const getBusinessPartnerOverview = async (
  businessOwnerId: string,
  itemId?: string
): Promise<IBusinessPartnerOverview> => {
  const matchQuery = buildBusinessMatchQuery(businessOwnerId, itemId);

  const [orderSummary] = await Order.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalClaims: { $sum: '$quantity' },
        totalClaimOrders: { $sum: 1 },
        storeVisits: {
          $sum: {
            $cond: [{ $eq: ['$status', 'REDEEMED'] }, '$quantity', 0],
          },
        },
      },
    },
  ]);

  const marketplaceFilter: Record<string, any> = {
    businessOwnerId: new Types.ObjectId(businessOwnerId),
  };
  if (itemId) {
    marketplaceFilter._id = new Types.ObjectId(itemId);
  }

  const [totalRewards, activeRewards] = await Promise.all([
    Marketplace.countDocuments(marketplaceFilter),
    Marketplace.countDocuments({ ...marketplaceFilter, isActive: true }),
  ]);

  const totalClaims = orderSummary?.totalClaims || 0;
  const storeVisits = orderSummary?.storeVisits || 0;
  const totalClaimOrders = orderSummary?.totalClaimOrders || 0;

  return {
    totalClaims,
    storeVisits,
    totalRewards,
    activeRewards,
    totalClaimOrders,
  };
};

/**
 * Helper to compute date range and bucket template for aggregation.
 */
const prepareTimeBuckets = (
  range: BusinessPartnerTimeRange = 'year',
  yearParam?: number,
  monthParam?: number
) => {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth(); // 0-indexed

  if (range === 'week') {
    // Current Monday to Sunday
    const dayOfWeek = now.getUTCDay();
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
 * Aggregates reward sell chart data for a business partner.
 */
const getRewardSellChart = async (
  businessOwnerId: string,
  query: BusinessPartnerAnalyticsQuery = {}
): Promise<IBusinessPartnerRewardSellChartResponse> => {
  const range = query.range || 'year';
  const matchQuery = buildBusinessMatchQuery(businessOwnerId, query.itemId);
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

  const aggregated = await Order.aggregate([
    {
      $match: {
        ...matchQuery,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: groupKeyExpr,
        sells: { $sum: '$quantity' },
        claimsCount: { $sum: 1 },
        storeVisits: {
          $sum: {
            $cond: [{ $eq: ['$status', 'REDEEMED'] }, '$quantity', 0],
          },
        },
      },
    },
  ]);

  const aggMap = new Map<
    string | number,
    { sells: number; claimsCount: number; storeVisits: number }
  >();
  for (const item of aggregated) {
    aggMap.set(item._id, {
      sells: item.sells,
      claimsCount: item.claimsCount,
      storeVisits: item.storeVisits,
    });
  }

  let totalPeriodSells = 0;
  let totalPeriodVisits = 0;

  const data: IBusinessPartnerChartDataPoint[] = buckets.map((b) => {
    const found = aggMap.get(b.key);
    const sells = found ? found.sells : 0;
    const claimsCount = found ? found.claimsCount : 0;
    const storeVisits = found ? found.storeVisits : 0;

    totalPeriodSells += sells;
    totalPeriodVisits += storeVisits;

    return {
      label: b.label,
      date: b.date,
      sells,
      claimsCount,
      storeVisits,
    };
  });

  return {
    range,
    year,
    ...(month ? { month } : {}),
    totalSells: totalPeriodSells,
    totalStoreVisits: totalPeriodVisits,
    data,
  };
};

/**
 * Aggregates complete Business Partner dashboard analytics (Overview cards + Reward Sell chart).
 */
const getBusinessPartnerAnalytics = async (
  businessOwnerId: string,
  query: BusinessPartnerAnalyticsQuery = {}
): Promise<IBusinessPartnerAnalyticsFullResponse> => {
  logger.info('Calculating business partner analytics', {
    businessOwnerId,
    itemId: query.itemId,
    range: query.range,
  });

  const [overview, rewardSellChart] = await Promise.all([
    getBusinessPartnerOverview(businessOwnerId, query.itemId),
    getRewardSellChart(businessOwnerId, query),
  ]);

  return {
    overview,
    rewardSellChart,
  };
};

export const BusinessPartnerAnalyticsService = {
  getBusinessPartnerOverview,
  getRewardSellChart,
  getBusinessPartnerAnalytics,
};
