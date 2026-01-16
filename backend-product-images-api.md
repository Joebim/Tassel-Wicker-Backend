# Product Images API Documentation

## Overview

This document describes the product images API endpoints and the `isCover` functionality for managing product images. Products now support an array of image objects, each with a `url` and an optional `isCover` boolean flag to designate the cover image.

## Table of Contents

- [Image Structure](#image-structure)
- [Endpoints](#endpoints)
  - [Update Product (with images)](#update-product-with-images)
  - [Upload Product Image](#upload-product-image)
- [Examples](#examples)
- [Migration Notes](#migration-notes)

---

## Image Structure

### ProductImage Interface

```typescript
interface ProductImage {
  url: string;        // Image URL (required)
  isCover?: boolean;  // Whether this image is the cover image (optional, default: false)
}
```

### Product Images Array

Products now have an `images` array containing `ProductImage` objects:

```typescript
{
  images: [
    { url: "https://example.com/image1.jpg", isCover: true },
    { url: "https://example.com/image2.jpg", isCover: false },
    { url: "https://example.com/image3.jpg" }  // isCover defaults to false
  ]
}
```

### Rules

1. **Only one cover image**: Only one image in the array can have `isCover: true` at any time.
2. **First image default**: When creating a product, if no image is explicitly marked as cover, the first image is automatically set as cover.
3. **Backward compatibility**: The `coverImage` field is still maintained for backward compatibility and is automatically derived from the image with `isCover: true`.

---

## Endpoints

### Update Product (with images)

Update a product, including setting which image is the cover.

**Endpoint:** `PUT /api/products/:id`

**Authentication:** Required (Admin or Moderator)

**Request Body:**

```json
{
  "images": [
    { "url": "https://example.com/image1.jpg", "isCover": false },
    { "url": "https://example.com/image2.jpg", "isCover": true },
    { "url": "https://example.com/image3.jpg", "isCover": false }
  ],
  // ... other product fields
}
```

**Validation:**

- `images` must be an array of objects with `url` (string, min length 1) and optional `isCover` (boolean)
- Only one image can have `isCover: true`
- If multiple images have `isCover: true`, the API returns a `400 BadRequest` error

**Response:**

```json
{
  "item": {
    "id": "6942bda6038c1e54dc2be995",
    "name": "Product Name",
    "images": [
      { "url": "https://example.com/image1.jpg", "isCover": false },
      { "url": "https://example.com/image2.jpg", "isCover": true },
      { "url": "https://example.com/image3.jpg", "isCover": false }
    ],
    "coverImage": "https://example.com/image2.jpg",
    // ... other product fields
  }
}
```

**Error Responses:**

- `400 BadRequest`: Invalid product ID, invalid image structure, or multiple images set as cover
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not have admin or moderator role
- `404 NotFound`: Product not found

---

### Upload Product Image

Upload a new image for a product and add it to the `images` array.

**Endpoint:** `POST /api/products/:id/images`

**Authentication:** Required (Admin or Moderator)

**Content-Type:** `multipart/form-data`

**Request:**

- `file`: Image file (required, max 8MB)

**Behavior:**

- The uploaded image is added to the product's `images` array
- If this is the first image for the product, it is automatically set as `isCover: true`
- If the product already has images, the new image is added with `isCover: false`
- The `coverImage` field is updated automatically if this is the first image

**Response:**

```json
{
  "item": {
    "id": "6942bda6038c1e54dc2be995",
    "name": "Product Name",
    "images": [
      { "url": "https://cloudinary.com/image1.jpg", "isCover": true },
      { "url": "https://cloudinary.com/image2.jpg", "isCover": false }
    ],
    "coverImage": "https://cloudinary.com/image1.jpg",
    // ... other product fields
  },
  "upload": {
    "url": "https://cloudinary.com/image2.jpg",
    "publicId": "tassel-wicker/image2",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "bytes": 245678
  }
}
```

**Error Responses:**

- `400 BadRequest`: Invalid product ID or missing file
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not have admin or moderator role
- `404 NotFound`: Product not found

---

## Examples

### Example 1: Setting an Image as Cover

**Request:**

```http
PUT /api/products/6942bda6038c1e54dc2be995
Authorization: Bearer <token>
Content-Type: application/json

{
  "images": [
    { "url": "https://example.com/image1.jpg", "isCover": false },
    { "url": "https://example.com/image2.jpg", "isCover": true },
    { "url": "https://example.com/image3.jpg", "isCover": false }
  ]
}
```

**Response:**

```json
{
  "item": {
    "id": "6942bda6038c1e54dc2be995",
    "images": [
      { "url": "https://example.com/image1.jpg", "isCover": false },
      { "url": "https://example.com/image2.jpg", "isCover": true },
      { "url": "https://example.com/image3.jpg", "isCover": false }
    ],
    "coverImage": "https://example.com/image2.jpg"
  }
}
```

### Example 2: Creating a Product with Images

**Request:**

```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Product",
  "description": "Product description",
  "price": 100,
  "images": [
    { "url": "https://example.com/image1.jpg" },
    { "url": "https://example.com/image2.jpg", "isCover": true },
    { "url": "https://example.com/image3.jpg" }
  ]
}
```

**Response:**

```json
{
  "item": {
    "id": "6942bda6038c1e54dc2be995",
    "name": "New Product",
    "images": [
      { "url": "https://example.com/image1.jpg", "isCover": false },
      { "url": "https://example.com/image2.jpg", "isCover": true },
      { "url": "https://example.com/image3.jpg", "isCover": false }
    ],
    "coverImage": "https://example.com/image2.jpg"
  }
}
```

**Note:** If no image is explicitly marked as cover, the first image is automatically set as cover.

### Example 3: Error - Multiple Cover Images

**Request:**

```http
PUT /api/products/6942bda6038c1e54dc2be995
Authorization: Bearer <token>
Content-Type: application/json

{
  "images": [
    { "url": "https://example.com/image1.jpg", "isCover": true },
    { "url": "https://example.com/image2.jpg", "isCover": true }
  ]
}
```

**Response:**

```json
{
  "error": "BadRequest",
  "message": "Only one image can be set as cover",
  "requestId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Example 4: Uploading a New Image

**Request:**

```http
POST /api/products/6942bda6038c1e54dc2be995/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [binary image data]
```

**Response:**

```json
{
  "item": {
    "id": "6942bda6038c1e54dc2be995",
    "images": [
      { "url": "https://cloudinary.com/existing.jpg", "isCover": true },
      { "url": "https://cloudinary.com/new-image.jpg", "isCover": false }
    ],
    "coverImage": "https://cloudinary.com/existing.jpg"
  },
  "upload": {
    "url": "https://cloudinary.com/new-image.jpg",
    "publicId": "tassel-wicker/new-image",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "bytes": 245678
  }
}
```

---

## Migration Notes

### Backward Compatibility

- The `coverImage` field is still present in the product schema for backward compatibility
- When updating products, the `coverImage` field is automatically set to the URL of the image with `isCover: true`
- Existing products with the old `images: string[]` format will need to be migrated to the new `images: ProductImage[]` format

### Data Migration

If you have existing products with the old image format, you'll need to migrate them. Here's an example migration script:

```typescript
// Example migration script (not included in the codebase)
const products = await ProductModel.find({});
for (const product of products) {
  if (product.images && product.images.length > 0) {
    // Check if images are strings (old format)
    if (typeof product.images[0] === 'string') {
      const migratedImages = product.images.map((url: string, index: number) => ({
        url,
        isCover: index === 0, // First image becomes cover
      }));
      
      await ProductModel.updateOne(
        { _id: product._id },
        {
          $set: {
            images: migratedImages,
            coverImage: product.images[0], // Set coverImage for backward compatibility
          },
        }
      );
    }
  }
}
```

---

## TypeScript Types

```typescript
export interface ProductImage {
  url: string;
  isCover?: boolean;
}

export interface ProductDoc {
  // ... other fields
  images: ProductImage[];
  coverImage?: string; // Deprecated: kept for backward compatibility
  // ... other fields
}
```

---

## Summary

- Products now support an array of image objects with `url` and `isCover` properties
- Only one image can be marked as cover at a time
- The `coverImage` field is maintained for backward compatibility
- When creating products, the first image is automatically set as cover if none is specified
- The API validates that only one image has `isCover: true` and returns an error if multiple are set
