// src/models/Transaction.ts
import mongoose, { Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  type: 'income' | 'expense';
  description: string;
  amount: number;
  createdAt: Date;
  userId?: mongoose.Types.ObjectId | string;
}

const TransactionSchema = new mongoose.Schema<ITransaction>(
  {
    type: { type: String, enum: ['income', 'expense'], required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    createdAt: { type: Date, default: () => new Date() },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> =
  (mongoose.models?.Transaction as Model<ITransaction>) || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
