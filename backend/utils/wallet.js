import WalletTransaction from '../models/WalletTransaction.js';
import Withdrawal from '../models/Withdrawl.js';

export const createBookingPayoutTransaction = async ({ booking, description }) => {
  if (!booking?.providerPayoutAmount) return null;
  try {
    return await WalletTransaction.create({
      userId: booking.userId,
      bookingId: booking._id,
      type: 'booking_payout',
      amount: booking.providerPayoutAmount,
      currency: booking.currency,
      status: 'available',
      description: description || 'Booking payout after platform fee.',
    });
  } catch (error) {
    if (error.code === 11000) {
      return WalletTransaction.findOne({ bookingId: booking._id, type: 'booking_payout' });
    }
    throw error;
  }
};

export const getWalletSummary = async (userId) => {
  const [transactionRows, withdrawalRows] = await Promise.all([
    WalletTransaction.aggregate([
      { $match: { userId } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Withdrawal.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', total: { $sum: '$amount' } } },
    ]),
  ]);

  const transactionTotals = Object.fromEntries(transactionRows.map(({ _id, total }) => [_id, total]));
  const withdrawalTotals = Object.fromEntries(withdrawalRows.map(({ _id, total }) => [_id, total]));
  const earned = transactionTotals.booking_payout || 0;
  const held = transactionTotals.withdrawal_hold || 0;
  const reversed = transactionTotals.withdrawal_reversal || 0;

  return {
    earned,
    held: Math.max(0, held - reversed),
    pendingWithdrawals: (withdrawalTotals.pending || 0) + (withdrawalTotals.processing || 0),
    paidWithdrawals: withdrawalTotals.paid || 0,
    available: Math.max(0, earned - held + reversed),
  };
};
