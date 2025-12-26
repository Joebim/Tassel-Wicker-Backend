export type ContentPage =
  | "about"
  | "cookie-policy"
  | "privacy-policy"
  | "terms-of-service"
  | "returns"
  | "shipping";

export interface ContentData {
  id: string; // Content ID (same as page identifier)
  page: ContentPage; // Page identifier
  title: string; // Page title
  content: string; // HTML content (for rich text pages) or JSON (for structured pages like About)
  documentUrl?: string; // Optional PDF document URL
  updatedAt: string; // ISO 8601 timestamp
  updatedBy: string; // User ID of last editor
  createdAt: string; // ISO 8601 timestamp
}

export interface AboutPageContent {
  heroImage: string;
  myWhyTitle: string;
  myWhyText1: string;
  myWhyText2: string;
  myWhyImage: string;
  ourStoryTitle: string;
  ourStoryText1: string;
  ourStoryText2: string;
  ourStoryImage: string;
  signature: string; // Signature name (e.g., "Dee")
  signatureTitle: string; // Signature title (e.g., "Founder, Tassel & Wicker")
  builtForTitle: string;
  builtForVideos: string[]; // Array of video URLs
}

export interface UpdateContentRequest {
  content: string; // HTML or JSON string
  documentUrl?: string | null; // Optional PDF document URL
}

export interface UploadResponse {
  url: string; // Public URL of uploaded document
  filename: string; // Original filename
  size: number; // File size in bytes
  mimeType: string; // MIME type (e.g., "application/pdf")
}




