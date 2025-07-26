// lib/mongoose.ts

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) throw new Error("Please define MONGODB_URI in .env.local");

let cached = global.mongoose as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectMongoose() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "super-envoy",
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
