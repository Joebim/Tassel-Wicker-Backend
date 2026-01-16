# Cloudinary Usage Guide

This project uses [Cloudinary](https://cloudinary.com/) for storing and managing all media assets (product images, documents, videos, etc.). This guide explains the configuration, service helper functions, and available API endpoints.

## 1. Configuration

To use Cloudinary, you must configure the following environment variables in your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=tassel-wicker  # Optional: root folder for uploads
```

## 2. Service Layer (`src/services/cloudinary.ts`)

We use the `cloudinary` npm package (v2). The service file exports helper functions to standardize uploads.

### Helper Functions

- **`uploadProductImage`**: Optimized for product images.
- **`uploadMedia`**: General-purpose uploader. Supports:
  - `image` (default)
  - `video` (chunked upload support)
  - `raw` (documents like PDF, DOCX)
- **`ensureCloudinaryConfigured`**: Validates env vars before attempting operations.

### Admin API Access

The service also exports the configured `cloudinary` instance, allowing direct access to the Admin API for management tasks (e.g., `cloudinary.api.resources`).

## 3. API Endpoints

### Uploading Media

**POST** `/api/uploads/media`

- **Auth**: Admin, Moderator
- **Body**: `multipart/form-data`
  - `file`: The file to upload.
  - `type` (optional): `image`, `video`, `document` (or `raw`).
  - `folder` (optional): Custom sub-folder.
- **Response**: Returns the secure URL, public ID, and metadata.

**POST** `/api/uploads/product-image`

- **Auth**: Admin, Moderator
- **Body**: `multipart/form-data` with `file`.
- **Note**: This is a legacy/convenience endpoint specific to product images.

### Managing Uploads (Admin Dashboard)

**GET** `/api/uploads`

- **Auth**: Admin
- **Description**: Returns a list of all uploads from Cloudinary, **grouped by folder**.
- **Usage Check**: The backend performs a "Link Check" scan across the database to identify if an image is currently in use.
  - **Scanned Collections**: `Products` (images, variants, cover), `Categories` (image), `Content` (docs, embedded HTML images), `Orders` (snapshot images).
  - **Result**: Each file object includes an `isLinked: true/false` flag.
  - **Why?**: This helps admins safely identify "orphan" images that can be deleted to save space.

**DELETE** `/api/uploads/:publicId`

- **Auth**: Admin
- **Description**: Deletes a specific resource provided its `publicId`.
- **Note**: The `publicId` may contain slashes (e.g., `folder/subfolder/image_id`), ensuring the router handles this correctly.

## 4. Database Storage

We do **not** store binary blobs in the database. Instead, we store the `secure_url` returned by Cloudinary.

**Example (Product Model):**

```typescript
{
  name: "Wicker Basket",
  images: [
    {
      url: "https://res.cloudinary.com/.../tassel-wicker/products/basket.jpg",
      isCover: true
    }
  ]
}
```

## 5. Best Practices

1.  **Always use the Service**: Do not import `cloudinary` directly in controllers unless you need specific Admin API features not covered by helper functions.
2.  **Check `isLinked`**: Before deleting an image via the Admin Dashboard, always verify the `isLinked` status.
3.  **Folder Organization**: Use meaningful folder names. The `uploadMedia` function defaults to `images`, `videos`, or `documents` subfolders if not specified.
