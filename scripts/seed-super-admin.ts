import "dotenv/config";
import { connectToDatabase } from "../src/config/db";
import { env } from "../src/config/env";
import { UserModel } from "../src/models/User";
import { hashPassword } from "../src/utils/password";

async function main() {
  await connectToDatabase();

  const email = (env.ADMIN_SEED_EMAIL || "admin@tasselandwicker.com").trim().toLowerCase();
  const password = env.ADMIN_SEED_PASSWORD || "ChangeMe123!";

  if (password.length < 8) {
    throw new Error("ADMIN_SEED_PASSWORD must be at least 8 characters");
  }

  const passwordHash = await hashPassword(password);

  const user = await UserModel.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        passwordHash,
        role: "admin",
        isEmailVerified: true,
        firstName: "Super",
        lastName: "Admin",
      },
      $setOnInsert: {
        addresses: [],
        preferences: { newsletter: false, marketing: false, currency: "USD", language: "en" },
      },
    },
    { new: true, upsert: true }
  ).select("+passwordHash");

  // eslint-disable-next-line no-console
  console.log("[seed-admin] ready:");
  // eslint-disable-next-line no-console
  console.log(`  email: ${email}`);
  // eslint-disable-next-line no-console
  console.log(`  password: ${password}`);
  // eslint-disable-next-line no-console
  console.log(`  userId: ${(user as any).id}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[seed-admin] failed", e);
  process.exit(1);
});










