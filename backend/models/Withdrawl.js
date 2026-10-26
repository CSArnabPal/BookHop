import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'rejected'],
      default: 'pending',
      index: true,
    },
    payoutSnapshot: {
      accountHolderName: String,
      bankName: String,
      accountLast4: String,
      ifsc: String,
      upiId: String,
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
);

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema, 'withdrawls');

export default Withdrawal;
