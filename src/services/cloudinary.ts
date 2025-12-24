import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";

export function ensureCloudinaryConfigured() {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Cloudinary is not configured (CLOUDINARY_* env vars missing)"
    );
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadProductImage(options: {
  fileBuffer: Buffer;
  filename?: string;
}) {
  ensureCloudinaryConfigured();

  const folder = env.CLOUDINARY_FOLDER;

  return new Promise<{
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        filename_override: options.filename,
      },
      (error, result) => {
        if (error || !result)
          return reject(error || new Error("Upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    stream.end(options.fileBuffer);
  });
}

export async function uploadDocument(options: {
  fileBuffer: Buffer;
  filename?: string;
  folder?: string;
}) {
  ensureCloudinaryConfigured();

  const folder =
    options.folder || `${env.CLOUDINARY_FOLDER || "tassel-wicker"}/documents`;

  return new Promise<{
    url: string;
    publicId: string;
    format?: string;
    bytes?: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw", // For PDFs and other documents
        use_filename: true,
        unique_filename: true,
        filename_override: options.filename,
      },
      (error, result) => {
        if (error || !result)
          return reject(error || new Error("Upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    stream.end(options.fileBuffer);
  });
}
