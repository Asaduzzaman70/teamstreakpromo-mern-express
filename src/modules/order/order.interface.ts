import { Document, Types } from 'mongoose';

export interface IOrder extends Document {
  user: Types.ObjectId;
  itemType: 'MARKETPLACE' | 'EVENT';
  
  // Marketplace fields
  businessOwnerId?: Types.ObjectId;
  itemId?: Types.ObjectId;

  // Event fields
  hostId?: Types.ObjectId;
  rewardItemId?: Types.ObjectId;
  eventId?: Types.ObjectId;

  itemPoints: number;
  quantity: number;
  status: 'CLAIMED' | 'REDEEMED' | 'CANCELLED';
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

