import { Schema, model } from 'mongoose';
import type { IOrder } from './order.interface.js';

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    itemType: {
      type: String,
      enum: ['MARKETPLACE', 'EVENT'],
      required: [true, 'Item type is required'],
    },
    // Marketplace specific fields
    businessOwnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Marketplace',
    },
    // Event specific fields
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rewardItemId: {
      type: Schema.Types.ObjectId,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
    itemPoints: {
      type: Number,
      required: [true, 'Item points are required'],
      min: [0, 'Item points cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    status: {
      type: String,
      enum: ['CLAIMED', 'REDEEMED', 'CANCELLED'],
      default: 'CLAIMED',
    },
    qrCode: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ businessOwnerId: 1, status: 1 });
OrderSchema.index({ hostId: 1, status: 1 });

// Virtual field to get item summary
OrderSchema.virtual('item').get(function (this: IOrder) {
  if (this.itemType === 'MARKETPLACE') {
    return this.itemId;
  }
  if (this.itemType === 'EVENT' && this.eventId) {
    const event = this.eventId as any;
    if (event && event.rewards && Array.isArray(event.rewards)) {
      const reward = event.rewards.find((r: any) => r._id?.toString() === this.rewardItemId?.toString());
      if (reward) {
        return {
          _id: reward._id,
          title: reward.title,
          description: reward.description,
          placeName: event.placeName,
          images: reward.images?.length > 0 ? reward.images : event.images,
          points: reward.pointsRequired,
          eventId: event._id,
          eventTitle: event.title,
        };
      }
    }
    return this.eventId;
  }
  return null;
});

// Ensure virtuals are included when converting to JSON or Object
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

export const Order = model<IOrder>('Order', OrderSchema);
