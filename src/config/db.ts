import mongoose from "mongoose";
import { env } from "./env";

export async function connectToDatabase() {
  mongoose.set("strictQuery", true);

  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== "production",
  });

  // eslint-disable-next-line no-console
  console.log("[db] connected");
}


