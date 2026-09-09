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
    item: {
      type: Schema.Types.ObjectId,
      required: [true, 'Item ID is required'],
      refPath: 'itemModel',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    totalPoints: {
      type: Number,
      required: [true, 'Total points are required'],
      min: [0, 'Total points cannot be negative'],
    },
    status: {
      type: String,
      enum: ['CLAIMED', 'REDEEMED', 'CANCELLED'],
      default: 'CLAIMED',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field to resolve the dynamic reference
OrderSchema.virtual('itemModel').get(function (this: IOrder) {
  if (this.itemType === 'MARKETPLACE') {
    return 'Marketplace';
  } else if (this.itemType === 'EVENT') {
    return 'Event';
  }
  return null;
});

// Ensure virtuals are included when converting to JSON or Object
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

export const Order = model<IOrder>('Order', OrderSchema);
