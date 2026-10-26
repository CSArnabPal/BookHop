import express from "express";
import {
  getMe,
  loginUser,
  registerUser,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  updateProfile,
} from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/register/request-otp", requestRegistrationOtp);
router.post("/register/verify-otp", verifyRegistrationOtp);
router.post("/login", loginUser);
router.post("/me", auth, getMe);
router.post("/profile", auth, updateProfile);

export default router;
