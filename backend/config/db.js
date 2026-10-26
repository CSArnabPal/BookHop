import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required to connect to MongoDB");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected successfully");
};
