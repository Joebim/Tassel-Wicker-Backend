# Content Management API Documentation

## Overview

This document describes the backend API endpoints for managing page content including the About page and legal pages (Cookie Policy, Privacy Policy, Terms of Service, Returns & Exchanges, Shipping Information).

## Base URL

```
/api/content
```

## Authentication

All endpoints require admin or moderator authentication via JWT token:

```
Authorization: Bearer <token>
```

## Data Structures

### ContentPage

```typescript
type ContentPage =
  | "about"
  | "cookie-policy"
  | "privacy-policy"
  | "terms-of-service"
  | "returns"
  | "shipping";
```

### ContentData

```typescript
interface ContentData {
  id: string; // Content ID (same as page identifier)
  page: ContentPage; // Page identifier
  title: string; // Page title
  content: string; // HTML content (for rich text pages) or JSON (for structured pages like About)
  documentUrl?: string; // Optional PDF document URL
  updatedAt: string; // ISO 8601 timestamp
  updatedBy: string; // User ID of last editor
  createdAt: string; // ISO 8601 timestamp
}
```

### AboutPageContent (Structured JSON)

For the About page, content is stored as structured JSON:

```typescript
interface AboutPageContent {
  myWhyTitle: string;
  myWhyText1: string;
  myWhyText2: string;
  ourStoryTitle: string;
  ourStoryText1: string;
  ourStoryText2: string;
  signature: string; // Signature name (e.g., "Dee")
  signatureTitle: string; // Signature title (e.g., "Founder, Tassel & Wicker")
}
```

### UploadResponse

```typescript
interface UploadResponse {
  url: string; // Public URL of uploaded document
  filename: string; // Original filename
  size: number; // File size in bytes
  mimeType: string; // MIME type (e.g., "application/pdf")
}
```

## Endpoints

### 1. Get Content

Retrieve content for a specific page.

**Endpoint:** `GET /api/content/:page`

**Path Parameters:**

- `page` (string, required) - One of: `about`, `cookie-policy`, `privacy-policy`, `terms-of-service`, `returns`, `shipping`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "about",
  "page": "about",
  "title": "About Page",
  "content": "{\"myWhyTitle\":\"MY WHY\",\"myWhyText1\":\"...\",\"myWhyText2\":\"...\",\"ourStoryTitle\":\"...\",\"ourStoryText1\":\"...\",\"ourStoryText2\":\"...\",\"signature\":\"Dee\",\"signatureTitle\":\"Founder, Tassel & Wicker\"}",
  "documentUrl": null,
  "updatedAt": "2025-12-17T10:00:00Z",
  "updatedBy": "user-123",
  "createdAt": "2025-12-17T09:00:00Z"
}
```

**Status Codes:**

- `200 OK` - Content retrieved successfully
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Content not found (will be created on first update)

**Notes:**

- For `about` page, `content` is a JSON string of `AboutPageContent`
- For other pages, `content` is HTML string from rich text editor

---

### 2. Update Content

Update content for a specific page.

**Endpoint:** `PUT /api/content/:page`

**Path Parameters:**

- `page` (string, required) - One of: `about`, `cookie-policy`, `privacy-policy`, `terms-of-service`, `returns`, `shipping`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "content": "<p>Updated HTML content...</p>",
  "documentUrl": "https://example.com/documents/cookie-policy.pdf"
}
```

**For About Page (Structured):**

```json
{
  "content": "{\"myWhyTitle\":\"MY WHY\",\"myWhyText1\":\"Updated text...\",\"myWhyText2\":\"...\",\"ourStoryTitle\":\"...\",\"ourStoryText1\":\"...\",\"ourStoryText2\":\"...\",\"signature\":\"Dee\",\"signatureTitle\":\"Founder, Tassel & Wicker\"}",
  "documentUrl": null
}
```

**Response:**

```json
{
  "id": "cookie-policy",
  "page": "cookie-policy",
  "title": "Cookie Policy",
  "content": "<p>Updated HTML content...</p>",
  "documentUrl": "https://example.com/documents/cookie-policy.pdf",
  "updatedAt": "2025-12-17T10:30:00Z",
  "updatedBy": "user-123",
  "createdAt": "2025-12-17T09:00:00Z"
}
```

**Status Codes:**

- `200 OK` - Content updated successfully
- `400 Bad Request` - Invalid content data
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Content not found (will be created)

**Validation:**

- `content` is required
- For `about` page, content must be valid JSON matching `AboutPageContent` structure
- For other pages, content should be valid HTML
- `documentUrl` is optional

---

### 3. Upload Document

Upload a PDF document for a page (used for legal pages that have downloadable documents).

**Endpoint:** `POST /api/content/upload`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**

- `file` (File, required) - PDF file to upload
- `page` (string, required) - Page identifier

**Request:**

```
POST /api/content/upload
Content-Type: multipart/form-data

file: [PDF file]
page: cookie-policy
```

**Response:**

```json
{
  "url": "https://example.com/uploads/cookie-policy-20251217.pdf",
  "filename": "cookie-policy.pdf",
  "size": 245678,
  "mimeType": "application/pdf"
}
```

**Status Codes:**

- `200 OK` - File uploaded successfully
- `400 Bad Request` - Invalid file or missing page parameter
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have permission
- `413 Payload Too Large` - File size exceeds limit (max 10MB)
- `415 Unsupported Media Type` - File is not a PDF

**File Requirements:**

- Maximum file size: 10MB
- Allowed MIME types: `application/pdf`
- File naming: Auto-generated with timestamp to prevent conflicts

**Storage:**

- Files should be stored in a cloud storage service (AWS S3, Google Cloud Storage, etc.)
- Public URL should be returned for direct access
- Consider CDN for faster delivery

---

### 4. Get All Content (Admin)

Retrieve all content pages (for admin overview).

**Endpoint:** `GET /api/content`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `pages` (string[], optional) - Filter by specific pages (comma-separated)

**Response:**

```json
{
  "pages": [
    {
      "id": "about",
      "page": "about",
      "title": "About Page",
      "content": "...",
      "documentUrl": null,
      "updatedAt": "2025-12-17T10:00:00Z",
      "updatedBy": "user-123",
      "createdAt": "2025-12-17T09:00:00Z"
    },
    {
      "id": "cookie-policy",
      "page": "cookie-policy",
      "title": "Cookie Policy",
      "content": "...",
      "documentUrl": "https://example.com/documents/cookie-policy.pdf",
      "updatedAt": "2025-12-17T10:30:00Z",
      "updatedBy": "user-123",
      "createdAt": "2025-12-17T09:00:00Z"
    }
  ],
  "total": 6
}
```

**Status Codes:**

- `200 OK` - Content retrieved successfully
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have permission

---

### 5. Get Public Content

Get content for public display (no authentication required, but may be rate-limited).

**Endpoint:** `GET /api/content/public/:page`

**Path Parameters:**

- `page` (string, required) - Page identifier

**Response:**

```json
{
  "id": "cookie-policy",
  "page": "cookie-policy",
  "title": "Cookie Policy",
  "content": "<p>Public HTML content...</p>",
  "documentUrl": "https://example.com/documents/cookie-policy.pdf",
  "updatedAt": "2025-12-17T10:30:00Z"
}
```

**Status Codes:**

- `200 OK` - Content retrieved successfully
- `404 Not Found` - Content not found

**Notes:**

- This endpoint doesn't require authentication
- `updatedBy` and `createdAt` are excluded from response
- Rate limiting: 100 requests per minute per IP

---

## Database Schema (MongoDB)

### Content Collection

```javascript
{
  _id: ObjectId,
  id: String,                  // Same as page identifier (unique)
  page: String,                // Page identifier
  title: String,               // Page title
  content: String,             // HTML or JSON string
  documentUrl: String,         // Optional PDF document URL
  updatedAt: Date,
  updatedBy: String,           // User ID
  createdAt: Date
}

// Indexes
db.content.createIndex({ id: 1 }, { unique: true })
db.content.createIndex({ page: 1 })
db.content.createIndex({ updatedAt: -1 })
```

## Content Rendering

### Client-Side Rendering

For rich text content (legal pages), use the `RichTextRenderer` component:

```tsx
import RichTextRenderer from "@/components/common/RichTextRenderer";

<RichTextRenderer content={contentData.content} />;
```

For About page (structured), parse JSON and render:

```tsx
const aboutContent = JSON.parse(contentData.content);
// Render structured form fields
```

### HTML Sanitization

All HTML content should be sanitized before rendering to prevent XSS attacks. Consider using libraries like:

- `DOMPurify` for client-side sanitization
- Server-side sanitization before storage

## Implementation Notes

1. **Content Validation**:

   - Validate HTML structure for rich text pages
   - Validate JSON structure for About page
   - Sanitize HTML to prevent XSS

2. **Version History** (Optional):

   - Consider storing content versions for audit trail
   - Allow rollback to previous versions

3. **Caching**:

   - Cache public content responses (5-10 minutes)
   - Invalidate cache on content update

4. **File Storage**:

   - Use cloud storage (S3, GCS, Azure Blob)
   - Generate unique filenames with timestamps
   - Implement file cleanup for old uploads

5. **Permissions**:

   - Only admin and moderator roles can edit content
   - Public endpoints are read-only

6. **Content Migration**:
   - Provide migration script for initial content setup
   - Support bulk content import/export

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": {
    "code": "CONTENT_NOT_FOUND",
    "message": "Content not found for page: cookie-policy",
    "details": {}
  }
}
```

Common error codes:

- `CONTENT_NOT_FOUND` - Content doesn't exist
- `INVALID_CONTENT_FORMAT` - Invalid content structure
- `INVALID_PAGE` - Invalid page identifier
- `FILE_TOO_LARGE` - File exceeds size limit
- `INVALID_FILE_TYPE` - File is not a PDF
- `UPLOAD_FAILED` - File upload failed

## Rate Limiting

- Admin endpoints: 50 requests per minute per user
- Public endpoints: 100 requests per minute per IP
- Upload endpoint: 10 requests per minute per user

## Example Implementation (Node.js/Express)

```javascript
// GET /api/content/:page
router.get("/content/:page", authenticateAdmin, async (req, res) => {
  try {
    const { page } = req.params;
    const content = await Content.findOne({ page });

    if (!content) {
      return res.status(404).json({
        error: {
          code: "CONTENT_NOT_FOUND",
          message: `Content not found for page: ${page}`,
        },
      });
    }

    res.json(content);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// PUT /api/content/:page
router.put("/content/:page", authenticateAdmin, async (req, res) => {
  try {
    const { page } = req.params;
    const { content, documentUrl } = req.body;

    // Validate content
    if (page === "about") {
      const parsed = JSON.parse(content);
      // Validate AboutPageContent structure
    } else {
      // Validate HTML
    }

    const updated = await Content.findOneAndUpdate(
      { page },
      {
        content,
        documentUrl: documentUrl || null,
        updatedAt: new Date(),
        updatedBy: req.user.id,
      },
      { upsert: true, new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
});
```
