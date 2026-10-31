import { Types } from 'mongoose';
import crypto from 'node:crypto';
import { UserHostPoint, EventReferral } from './referral.model.js';
import { User } from '../auth/auth.model.js';
import { Event } from '../event/event.model.js';
import type {
  ICreditReferralInput,
  IUserHostPointResponse,
  IEventReferralLinkResponse,
} from './referral.interface.js';
import { AppError } from '../../utils/AppError.js';
import logger from '../../utils/logger.js';

/**
 * Retrieves the available points balance a user has with a specific event host.
 */
export const getUserHostPoints = async (
  userId: string | Types.ObjectId,
  hostId: string | Types.ObjectId
): Promise<number> => {
  const record = await UserHostPoint.findOne({
    user: new Types.ObjectId(userId.toString()),
    hostId: new Types.ObjectId(hostId.toString()),
  });

  return record ? record.points : 0;
};

/**
 * Retrieves all host-specific point ledgers for a user.
 */
export const getAllUserHostPoints = async (
  userId: string | Types.ObjectId
): Promise<IUserHostPointResponse[]> => {
  const records = await UserHostPoint.find({
    user: new Types.ObjectId(userId.toString()),
  })
    .populate({
      path: 'hostId',
      select: 'name email profileImage',
      populate: {
        path: 'businessProfile',
        select: 'businessName location',
      },
    })
    .sort({ points: -1 });

  return records.map((record) => {
    const hostDoc = record.hostId as any;
    const businessProfile = hostDoc?.businessProfile;
    const hostDisplayName = businessProfile?.businessName || hostDoc?.name || 'Event Host';

    return {
      hostId: hostDoc?._id ? hostDoc._id.toString() : record.hostId.toString(),
      hostName: hostDisplayName,
      businessName: businessProfile?.businessName || undefined,
      points: record.points,
      totalEarned: record.totalEarned,
      totalSpent: record.totalSpent,
      updatedAt: record.updatedAt,
    };
  });
};

/**
 * Generates or retrieves an event referral link and host point balance for the current user.
 */
export const getEventReferralDetails = async (
  userId: string,
  eventId: string
): Promise<IEventReferralLinkResponse> => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Ensure user has a referral code
  if (!user.referralCode) {
    user.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await user.save();
  }

  const hostId = event.hostId.toString();
  const currentHostPoints = await getUserHostPoints(userId, hostId);

  // Construct standard event referral URL path
  const referralLink = `/events/${eventId}?ref=${user.referralCode}`;

  return {
    eventId,
    referralCode: user.referralCode,
    referralLink,
    hostId,
    currentHostPoints,
  };
};

/**
 * Processes a referral on ticket purchase:
 * Awards 1 point to Referrer (User 1) for this event's host.
 * Awards 1 point to Buyer (User 2) for this event's host.
 * Idempotent: Skips duplicate execution if eventOrderId was already processed.
 */
export const processReferralPoints = async (
  input: ICreditReferralInput
): Promise<{ success: boolean; reason?: string }> => {
  const { referrerCode, buyerId, eventId, hostId, eventOrderId, points = 1 } = input;

  if (!referrerCode || !referrerCode.trim()) {
    return { success: false, reason: 'NO_REFERRAL_CODE' };
  }

  const cleanCode = referrerCode.trim();

  // Find the referrer by referralCode, or fallback to user _id if a 24-hex string was passed
  let referrer = await User.findOne({ referralCode: cleanCode.toUpperCase() });
  if (!referrer && Types.ObjectId.isValid(cleanCode)) {
    referrer = await User.findById(cleanCode);
  }

  if (!referrer) {
    logger.warn(`[processReferralPoints] Referrer not found for code: ${cleanCode}`);
    return { success: false, reason: 'REFERRER_NOT_FOUND' };
  }

  // Prevent self-referral
  if (referrer._id.toString() === buyerId.toString()) {
    logger.info(`[processReferralPoints] Self-referral ignored for user: ${buyerId}`);
    return { success: false, reason: 'SELF_REFERRAL' };
  }

  // Idempotency check: if eventOrderId already has a referral record, do not re-credit
  if (eventOrderId) {
    const existingReferral = await EventReferral.findOne({
      eventOrderId: new Types.ObjectId(eventOrderId.toString()),
      status: 'COMPLETED',
    });
    if (existingReferral) {
      logger.info(
        `[processReferralPoints] Referral points already awarded for order ${eventOrderId}`
      );
      return { success: true, reason: 'ALREADY_PROCESSED' };
    }
  }

  const referrerObjId = new Types.ObjectId(referrer._id.toString());
  const buyerObjId = new Types.ObjectId(buyerId.toString());
  const hostObjId = new Types.ObjectId(hostId.toString());
  const eventObjId = new Types.ObjectId(eventId.toString());
  const orderObjId = eventOrderId ? new Types.ObjectId(eventOrderId.toString()) : undefined;

  // 1. Credit 1 point to User 1 (Referrer) under this specific Host
  await UserHostPoint.findOneAndUpdate(
    { user: referrerObjId, hostId: hostObjId },
    {
      $inc: { points, totalEarned: points },
    },
    { upsert: true, new: true }
  );

  // Sync global points for display
  await User.findByIdAndUpdate(referrerObjId, {
    $inc: { totalPoints: points },
  });

  // 2. Credit 1 point to User 2 (Buyer / Referee) under this specific Host
  await UserHostPoint.findOneAndUpdate(
    { user: buyerObjId, hostId: hostObjId },
    {
      $inc: { points, totalEarned: points },
    },
    { upsert: true, new: true }
  );

  // Sync global points for display
  await User.findByIdAndUpdate(buyerObjId, {
    $inc: { totalPoints: points },
  });

  // 3. Create EventReferral record
  const referralPayload: any = {
    referrer: referrerObjId,
    referee: buyerObjId,
    eventId: eventObjId,
    hostId: hostObjId,
    pointsAwarded: points,
    status: 'COMPLETED',
  };
  if (orderObjId) {
    referralPayload.eventOrderId = orderObjId;
  }
  await EventReferral.create(referralPayload);

  logger.info(
    `[processReferralPoints] Successfully credited ${points} host point(s) to referrer (${referrer._id}) and buyer (${buyerId}) for host ${hostId}`
  );

  return { success: true };
};

/**
 * Atomically deducts host-scoped points when a user claims an event reward.
 * Guarantees that points earned from Host A cannot be used for Host B's rewards.
 */
export const deductHostPoints = async (
  userId: string | Types.ObjectId,
  hostId: string | Types.ObjectId,
  pointsToDeduct: number
): Promise<void> => {
  if (pointsToDeduct <= 0) return;

  const userObjId = new Types.ObjectId(userId.toString());
  const hostObjId = new Types.ObjectId(hostId.toString());

  const updatedLedger = await UserHostPoint.findOneAndUpdate(
    {
      user: userObjId,
      hostId: hostObjId,
      points: { $gte: pointsToDeduct },
    },
    {
      $inc: { points: -pointsToDeduct, totalSpent: pointsToDeduct },
    },
    { new: true }
  );

  if (!updatedLedger) {
    const currentPoints = await getUserHostPoints(userObjId, hostObjId);
    throw new AppError(
      `Insufficient points for this host's rewards. You have ${currentPoints} points for this host, but need ${pointsToDeduct} points.`,
      400
    );
  }

  // Deduct from aggregate totalPoints as well
  await User.findOneAndUpdate(
    { _id: userObjId, totalPoints: { $gte: pointsToDeduct } },
    { $inc: { totalPoints: -pointsToDeduct } }
  );

  logger.info(
    `[deductHostPoints] Deducted ${pointsToDeduct} host points from user ${userId} for host ${hostId}`
  );
};

/**
 * Refunds or restores host points if an order is cancelled or refunded.
 */
export const refundHostPoints = async (
  userId: string | Types.ObjectId,
  hostId: string | Types.ObjectId,
  pointsToRefund: number
): Promise<void> => {
  if (pointsToRefund <= 0) return;

  const userObjId = new Types.ObjectId(userId.toString());
  const hostObjId = new Types.ObjectId(hostId.toString());

  await UserHostPoint.findOneAndUpdate(
    { user: userObjId, hostId: hostObjId },
    {
      $inc: { points: pointsToRefund, totalSpent: -pointsToRefund },
    },
    { upsert: true, new: true }
  );

  await User.findByIdAndUpdate(userObjId, {
    $inc: { totalPoints: pointsToRefund },
  });

  logger.info(
    `[refundHostPoints] Refunded ${pointsToRefund} host points to user ${userId} for host ${hostId}`
  );
};

/**
 * Retrieves the referral history for the authenticated user.
 */
export const getMyReferrals = async (
  userId: string | Types.ObjectId
): Promise<any[]> => {
  const userObjId = new Types.ObjectId(userId.toString());

  const referrals = await EventReferral.find({
    referrer: userObjId,
  })
    .populate('referee', 'name email profileImage')
    .populate('eventId', 'title date location placeName')
    .populate({
      path: 'hostId',
      select: 'name businessProfile',
      populate: { path: 'businessProfile', select: 'businessName' },
    })
    .sort({ createdAt: -1 });

  return referrals;
};
