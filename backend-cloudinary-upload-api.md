# Cloudinary Upload API Documentation

## Overview

The Cloudinary Upload API provides endpoints for uploading media files (images, videos, and documents) to Cloudinary and retrieving their URLs. This API is used by the admin interface for content management, product images, and other media uploads.

## Base URL

```
/api/uploads
```

## Authentication

All endpoints require admin or moderator authentication via JWT token:

```
Authorization: Bearer <token>
```

## Supported File Types

### Images
- **Formats**: JPG, JPEG, PNG, GIF, WebP, SVG
- **Max Size**: 8MB
- **Cloudinary Resource Type**: `image`

### Videos
- **Formats**: MP4, WebM, MOV, AVI, MKV
- **Max Size**: 100MB
- **Cloudinary Resource Type**: `video`

### Documents
- **Formats**: PDF, DOC, DOCX, TXT, and other document formats
- **Max Size**: 100MB
- **Cloudinary Resource Type**: `raw`

## Endpoints

### 1. Upload Media (General Purpose)

Upload images, videos, or documents to Cloudinary. The resource type is auto-detected from the file's MIME type if not specified.

**Endpoint:** `POST /api/uploads/media`

**Authentication:** Required (Admin or Moderator)

**Content-Type:** `multipart/form-data`

**Request Body:**

```
file: <file> (required)
type: "image" | "video" | "document" (optional, auto-detected if not provided)
folder: <string> (optional, custom Cloudinary folder path)
```

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Query Parameters (Alternative to Form Data):**

- `type` (optional) - Resource type: "image", "video", or "document"
- `folder` (optional) - Custom folder path in Cloudinary

**Response:**

```json
{
  "success": true,
  "url": "https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.jpg",
  "publicId": "folder/filename",
  "width": 1920,
  "height": 1080,
  "duration": null,
  "format": "jpg",
  "bytes": 245678,
  "resourceType": "image"
}
```

**Response Fields:**

- `success` (boolean) - Always `true` on success
- `url` (string) - The secure URL to access the uploaded file
- `publicId` (string) - Cloudinary public ID (used for transformations and deletion)
- `width` (number, optional) - Image/video width in pixels (images and videos only)
- `height` (number, optional) - Image/video height in pixels (images and videos only)
- `duration` (number, optional) - Video duration in seconds (videos only)
- `format` (string) - File format (jpg, png, mp4, pdf, etc.)
- `bytes` (number) - File size in bytes
- `resourceType` (string) - Resource type: "image", "video", or "raw"

**Status Codes:**

- `200 OK` - File uploaded successfully
- `400 Bad Request` - Missing file, invalid type, or file too large
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have admin/moderator permission
- `500 Internal Server Error` - Upload failed or Cloudinary error

**Example Requests:**

```bash
# Upload an image (auto-detected)
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg" \
  https://api.example.com/api/uploads/media

# Upload a video with explicit type
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/video.mp4" \
  -F "type=video" \
  https://api.example.com/api/uploads/media

# Upload a document to a custom folder
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/document.pdf" \
  -F "type=document" \
  -F "folder=tassel-wicker/content/documents" \
  https://api.example.com/api/uploads/media

# Using query parameters
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.png" \
  "https://api.example.com/api/uploads/media?type=image&folder=content/hero"
```

**JavaScript/TypeScript Example:**

```typescript
async function uploadMedia(
  file: File,
  type?: "image" | "video" | "document",
  folder?: string
) {
  const formData = new FormData();
  formData.append("file", file);
  if (type) formData.append("type", type);
  if (folder) formData.append("folder", folder);

  const response = await fetch("/api/uploads/media", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Upload failed");
  }

  return response.json();
}

// Usage examples
const imageFile = document.querySelector('input[type="file"]').files[0];
const result = await uploadMedia(imageFile, "image");
console.log(result.url); // Cloudinary URL

const videoFile = document.querySelector('input[type="file"]').files[0];
const videoResult = await uploadMedia(videoFile, "video", "tassel-wicker/videos");
console.log(videoResult.url); // Cloudinary video URL
```

---

### 2. Upload Product Image (Legacy)

Upload a product image specifically for products. This is a legacy endpoint that uses a fixed folder structure.

**Endpoint:** `POST /api/uploads/product-image`

**Authentication:** Required (Admin or Moderator)

**Content-Type:** `multipart/form-data`

**Request Body:**

```
file: <image file> (required)
```

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Response:**

```json
{
  "success": true,
  "url": "https://res.cloudinary.com/cloud-name/image/upload/v1234567890/products/filename.jpg",
  "publicId": "products/filename",
  "width": 1920,
  "height": 1080,
  "format": "jpg",
  "bytes": 245678
}
```

**Status Codes:**

- `200 OK` - Image uploaded successfully
- `400 Bad Request` - Missing file or file too large (>8MB)
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have admin/moderator permission
- `500 Internal Server Error` - Upload failed

**Example Request:**

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/product-image.jpg" \
  https://api.example.com/api/uploads/product-image
```

---

## Folder Structure

Files are organized in Cloudinary using the following folder structure:

### Default Folders (based on resource type):

- **Images**: `{CLOUDINARY_FOLDER}/images`
  - Example: `tassel-wicker/products/images` or `tassel-wicker/images`
  
- **Videos**: `{CLOUDINARY_FOLDER}/videos`
  - Example: `tassel-wicker/products/videos` or `tassel-wicker/videos`
  
- **Documents**: `{CLOUDINARY_FOLDER}/documents`
  - Example: `tassel-wicker/products/documents` or `tassel-wicker/documents`

### Custom Folders:

You can specify a custom folder path using the `folder` parameter. Examples:

- `tassel-wicker/content/hero` - For hero images
- `tassel-wicker/content/gallery` - For gallery images
- `tassel-wicker/content/videos` - For content videos
- `tassel-wicker/content/documents` - For content documents

**Note:** The `CLOUDINARY_FOLDER` environment variable defaults to `tassel-wicker/products` if not set.

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": "BadRequest",
  "message": "Missing file",
  "requestId": "abc-123-def",
  "details": {}
}
```

### Common Error Codes:

- `BadRequest` - Missing file, invalid file type, or file too large
- `Unauthorized` - Missing or invalid authentication token
- `Forbidden` - User doesn't have admin/moderator permission
- `UploadError` - Cloudinary upload failed (check message for details)

---

## File Size Limits

- **Images**: 8MB maximum
- **Videos**: 100MB maximum
- **Documents**: 100MB maximum

If a file exceeds the limit, the request will fail with a 400 Bad Request error.

---

## Cloudinary Configuration

The API requires the following environment variables to be set:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=tassel-wicker/products  # Optional, defaults to tassel-wicker/products
```

If Cloudinary is not configured, uploads will fail with a 500 Internal Server Error.

---

## Cloudinary Transformations

Once a file is uploaded, you can use Cloudinary's URL transformations. The `publicId` is returned in the response and can be used for transformations.

### Examples:

```javascript
// Original URL
const originalUrl = result.url;
// https://res.cloudinary.com/cloud/image/upload/v123/products/image.jpg

// Transform to width 800px, auto height, quality auto
const transformedUrl = originalUrl.replace('/upload/', '/upload/w_800,q_auto/');

// Transform to 400x400 thumbnail, crop to fill
const thumbnailUrl = originalUrl.replace('/upload/', '/upload/w_400,h_400,c_fill,g_auto/');

// For videos - get thumbnail at 5 seconds
const videoThumbnail = originalUrl.replace('/upload/', '/upload/so_5,w_800,h_450,c_fill/');
```

### Common Transformations:

- **Resize**: `w_800` (width), `h_600` (height)
- **Crop**: `c_fill`, `c_fit`, `c_limit`
- **Quality**: `q_auto` (automatic), `q_80` (80% quality)
- **Format**: `f_auto` (auto-format), `f_webp` (WebP)
- **Gravity**: `g_auto` (auto), `g_face` (face detection)
- **Video**: `so_5` (seek to 5 seconds), `vc_h264` (H.264 codec)

See [Cloudinary Transformation Documentation](https://cloudinary.com/documentation/transformation_reference) for more options.

---

## Best Practices

### 1. File Validation on Frontend

Before uploading, validate files on the frontend:

```typescript
function validateFile(file: File, type: "image" | "video" | "document"): boolean {
  // Check file size
  const maxSizes = {
    image: 8 * 1024 * 1024, // 8MB
    video: 100 * 1024 * 1024, // 100MB
    document: 100 * 1024 * 1024, // 100MB
  };
  
  if (file.size > maxSizes[type]) {
    return false;
  }

  // Check file type
  const allowedTypes = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/webm", "video/quicktime"],
    document: ["application/pdf", "application/msword"],
  };

  return allowedTypes[type].includes(file.type);
}
```

### 2. Progress Tracking

For large files, implement upload progress:

```typescript
async function uploadWithProgress(
  file: File,
  onProgress: (progress: number) => void
) {
  const formData = new FormData();
  formData.append("file", file);

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const progress = (e.loaded / e.total) * 100;
      onProgress(progress);
    }
  });

  return new Promise((resolve, reject) => {
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error("Upload failed"));
      }
    });

    xhr.addEventListener("error", reject);

    xhr.open("POST", "/api/uploads/media");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  });
}
```

### 3. Error Handling

Always handle errors gracefully:

```typescript
try {
  const result = await uploadMedia(file);
  // Use result.url
} catch (error: any) {
  if (error.message.includes("file too large")) {
    // Show user-friendly error
    alert("File is too large. Maximum size is 100MB.");
  } else if (error.message.includes("Unauthorized")) {
    // Redirect to login
    window.location.href = "/login";
  } else {
    // Generic error
    alert("Upload failed. Please try again.");
  }
}
```

### 4. Storing URLs

Store the returned URL in your database. You can also store the `publicId` if you need to perform transformations or delete the file later.

```typescript
// After successful upload
const uploadResult = await uploadMedia(file);
await updateContent({
  heroImage: uploadResult.url,
  // Store publicId if needed for transformations
  heroImagePublicId: uploadResult.publicId,
});
```

---

## Example: Content Page Image Upload

For content pages (about, home, etc.), you might upload images like this:

```typescript
// Upload hero image
const heroImageFile = document.querySelector('#hero-image-input').files[0];
const heroResult = await uploadMedia(heroImageFile, "image", "tassel-wicker/content/hero");

// Upload video
const videoFile = document.querySelector('#video-input').files[0];
const videoResult = await uploadMedia(videoFile, "video", "tassel-wicker/content/videos");

// Upload document
const docFile = document.querySelector('#document-input').files[0];
const docResult = await uploadMedia(docFile, "document", "tassel-wicker/content/documents");

// Update content
await updateContentPage({
  heroImage: heroResult.url,
  videoUrl: videoResult.url,
  documentUrl: docResult.url,
});
```

---

## React Example Component

```typescript
import React, { useState } from "react";

interface UploadResult {
  success: boolean;
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
  resourceType: string;
}

function MediaUploader({
  onUploadComplete,
  type,
  folder,
}: {
  onUploadComplete: (result: UploadResult) => void;
  type?: "image" | "video" | "document";
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    if (type) formData.append("type", type);
    if (folder) formData.append("folder", folder);

    try {
      const response = await fetch("/api/uploads/media", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      const result = await response.json();
      onUploadComplete(result);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        accept={
          type === "image"
            ? "image/*"
            : type === "video"
            ? "video/*"
            : "*"
        }
      />
      {uploading && <div>Uploading... {progress}%</div>}
    </div>
  );
}

// Usage
<MediaUploader
  type="image"
  folder="tassel-wicker/content/hero"
  onUploadComplete={(result) => {
    console.log("Uploaded:", result.url);
    // Update your content with result.url
  }}
/>
```

---

## Security Considerations

1. **Authentication Required**: All upload endpoints require admin/moderator authentication
2. **File Type Validation**: The API validates file types based on MIME type
3. **File Size Limits**: Enforced server-side to prevent abuse
4. **Secure URLs**: Cloudinary returns HTTPS URLs by default
5. **Unique Filenames**: Cloudinary automatically ensures unique filenames to prevent conflicts

---

## Rate Limiting

Upload endpoints are subject to the same rate limiting as other authenticated endpoints. Ensure your implementation handles rate limit errors gracefully.

---

## Support

For issues or questions:
- Check Cloudinary dashboard for upload errors
- Verify environment variables are correctly set
- Ensure file sizes are within limits
- Verify user has admin/moderator permissions

