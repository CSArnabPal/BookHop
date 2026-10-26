import bcrypt from "bcryptjs";
import crypto from "crypto";
import EmailOtp from "../models/EmailOtp.js";
import { sendOtpNotification } from "./bookingNotifications.js";

const OTP_TTL_MINUTES = 10; 
const MAX_ATTEMPTS = 5;

const normalizeEmail = (email) => email.trim().toLowerCase();

const createCode = () => crypto.randomInt(100000, 1000000).toString();

export const requestEmailOtp = async ({email, purpose}) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        throw new Error("Email is required");
    }
    const code = createCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    

    await EmailOtp.deleteMany({ email: normalizedEmail, purpose, consumeAt:null });
    const otpRecord = await EmailOtp.create({ 
        email: normalizedEmail,
         codeHash, purpose, expiresAt });
        
        try {
            await sendOtpNotification({email: normalizedEmail, code, purpose});
        } catch (error) {
            await EmailOtp.deleteOne({ _id: otpRecord._id });
            throw error;
        }

        return{
            sent: true,
            email: normalizedEmail,
            expiresInMinutes: OTP_TTL_MINUTES,
        };
    }

export const verifyEmailOtp = async ({email, code, purpose, consume = false}) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !code) {
        return { verified: false, reason: "Email and OTP are required" };

    }

    const record = await EmailOtp.findOne({ email: normalizedEmail, purpose, consumeAt:null, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });

    if (!record) {
        return { verified: false, reason: "OTP not found or expired" };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
        return { verified: false, reason: "Maximum verification attempts exceeded" };
    }
    
    const isMatch = await bcrypt.compare(String(code).trim(), record.codeHash);
    if (!isMatch) {
        record.attempts += 1;
        await record.save();
        return { verified: false, reason: "Invalid OTP" };
    }
    
    if (consume) {
        record.consumeAt = new Date();
        await record.save();
    }

    return { verified: true, reason: "OTP verified successfully" };
}