// src/lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in .env.local");
}

// Simple connection function without global caching complexity
export async function connectDB() {
  try {
    // If already connected, return
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // If connecting, wait for it
    if (mongoose.connection.readyState === 2) {
      return mongoose.connection;
    }

    // Create new connection
    const conn = await mongoose.connect(MONGODB_URI, {
      dbName: "finance-tracker",
    });

    console.log("✅ MongoDB Connected");
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}
