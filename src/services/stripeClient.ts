import Stripe from "stripe";
import { env } from "../config/env";

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-11-17.clover",
    typescript: true,
  });
}


