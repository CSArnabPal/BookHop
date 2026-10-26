import express from 'express';
import {
  getPaymentOverview,
  requestWithdrawal,
  updatePayoutDetails,
} from '../controllers/paymentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/',auth, getPaymentOverview);
router.patch('/payout-details', auth, updatePayoutDetails);
router.post('/withdrawals', auth, requestWithdrawal);

export default router;