import Availability from "../models/Availability.js";
import { isValidTimeRange } from "../utils/time.js";

export const listAvailability = async (req, res) => {
    try {
        const availability = await Availability.find({ userId: req.user.id }).sort({ dayOfWeek: 1 });
        res.json({ availability });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch availability", error: error.message });
    }
};

export const saveAvailability = async (req, res) => {
    try {
        const { dayOfWeek, slot } = req.body;

        if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
            return res.status(400).json({ message: "Invalid dayOfWeek." });
        }

        const cleanedSlots = (slot || []).filter((slot) =>(
            slot.startTime && slot.endTime && isValidTimeRange(slot.startTime, slot.endTime)
        ));

        const availability = await Availability.findOneAndUpdate(
            { userId: req.user.id, dayOfWeek },
            { slot: cleanedSlots },
            { new: true, upsert: true }
        );

        res.json({ message: "Availability saved successfully", availability });
    } catch (error) {
        res.status(500).json({ message: "Failed to save availability", error: error.message });
    }
}