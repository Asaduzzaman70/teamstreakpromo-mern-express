import { Document, Types } from 'mongoose';

export interface IOrder extends Document {
  user: Types.ObjectId;
  itemType: 'MARKETPLACE' | 'EVENT';
  item: Types.ObjectId;
  quantity: number;
  totalPoints: number;
  status: 'CLAIMED' | 'REDEEMED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}
