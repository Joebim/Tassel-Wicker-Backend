import "dotenv/config";
import { connectToDatabase } from "../src/config/db";
import { ContentModel } from "../src/models/Content";
import { env } from "../src/config/env";
import { UserModel } from "../src/models/User";

/**
 * Seed script for About page content
 *
 * This script seeds the About page with structured content including:
 * - Hero image
 * - My Why section (title, text, image)
 * - Our Story section (title, text, image)
 * - Signature section
 * - Built For section (title, videos)
 *
 * Run with: npm run seed:about
 */

// About page content extracted from tassel-wicker-next/app/(site)/about/page.tsx
const aboutPageContent = {
  // Hero section - Header image
  heroImage: "/images/headers/about-header-alt.jpg",

  // My Why section
  myWhyTitle: "MY WHY",
  myWhyText1:
    "Tassel & Wicker was created from a love for the little things that make life feel elevated and intentional. Think soft woven throw blankets, polished crystals, marble coasters, tin cookies, incense cones, tassel key chains, linen notepads, duck feather cushions…little tokens of comfort that slow us down, center us and help transform an ordinary space into a sanctuary of calm and creativity.",
  myWhyText2:
    "My vision is for Tassel & Wicker to stand as a symbol of thoughtfulness; a reminder to celebrate everyday moments and surround ourselves with quality pieces that bring joy and meaning. Through every product and experience, I hope to inspire a way of living that feels elevated, joyful and deeply considered.",
  myWhyImage: "/images/about/my-why.jpg",

  // Our Story section
  ourStoryTitle: "OUR STORY",
  ourStoryText1:
    "Our story starts with a collection of signature celebration baskets, the first step toward our envisioned line of home and lifestyle pieces. Through our celebration baskets, I invite you to reimagine how you express appreciation; not as a routine gesture, but as a chance to connect, honor individuality and create beautiful memories.",
  ourStoryText2:
    "Here's to celebrating the little things and moments that make life feel special.",
  ourStoryImage: "/images/about/stacked-baskets.jpg",

  // Signature section
  signature: "Dee",
  signatureTitle: "Founder, Tassel & Wicker",

  // Built For section (videos carousel)
  builtForTitle: "IT'S THE THOUGHT GIFT THAT COUNTS",
  builtForVideos: [
    "/videos/VIDEO 1.mp4",
    "/videos/VIDEO 2.mp4",
    "/videos/VIDEO 3.mp4",
    "/videos/VIDEO 4.mp4",
  ],
};

async function main() {
  // Ensure env is loaded/validated
  void env;
  await connectToDatabase();

  // Get admin user for updatedBy field
  const adminUser = await UserModel.findOne({ role: "admin" });
  const adminUserId = adminUser?.id || "system";

  if (!adminUser) {
    console.warn(
      "[seed-about] Warning: No admin user found. Using 'system' as updatedBy."
    );
    console.warn(
      "[seed-about] Consider running 'npm run seed:admin' first to create an admin user."
    );
  }

  // Check if about page already exists
  const existing = await ContentModel.findOne({ page: "about" });

  if (existing) {
    console.log("[seed-about] About page content already exists.");
    console.log("[seed-about] Updating with latest content...");

    // Update existing content
    existing.content = JSON.stringify(aboutPageContent);
    existing.updatedBy = adminUserId;
    await existing.save();

    console.log("[seed-about] About page content updated successfully!");
  } else {
    // Create new about page content
    await ContentModel.create({
      id: "about",
      page: "about",
      title: "About Page",
      content: JSON.stringify(aboutPageContent),
      documentUrl: null,
      updatedBy: adminUserId,
    });

    console.log("[seed-about] About page content created successfully!");
  }

  // Verify the content
  const aboutContent = await ContentModel.findOne({ page: "about" });
  if (aboutContent) {
    const parsed = JSON.parse(aboutContent.content);
    console.log("\n[seed-about] About page structure:");
    console.log(`  - Hero Image: ${parsed.heroImage}`);
    console.log(`  - My Why Title: ${parsed.myWhyTitle}`);
    console.log(`  - My Why Image: ${parsed.myWhyImage}`);
    console.log(`  - Our Story Title: ${parsed.ourStoryTitle}`);
    console.log(`  - Our Story Image: ${parsed.ourStoryImage}`);
    console.log(`  - Signature: ${parsed.signature}`);
    console.log(`  - Built For Title: ${parsed.builtForTitle}`);
    console.log(`  - Videos: ${parsed.builtForVideos.length} videos`);
    console.log(`  - Updated By: ${aboutContent.updatedBy}`);
    console.log(`  - Updated At: ${aboutContent.updatedAt}`);
  }

  const total = await ContentModel.countDocuments();
  console.log(`\n[seed-about] Done. Total content pages in db: ${total}`);
}

main().catch((e) => {
  console.error("[seed-about] Failed:", e);
  process.exit(1);
});

