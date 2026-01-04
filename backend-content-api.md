# Content Management API Documentation

## Overview

This document describes the backend API endpoints for managing page content including the About page and legal pages (Cookie Policy, Privacy Policy, Terms of Service, Returns & Exchanges, Shipping Information).

## Base URL

```
/api/content
```

## Authentication

**Public Endpoints** (No authentication required):
- `GET /api/content/:page` - Get public content

**Admin Endpoints** (Authentication required):
- `GET /api/content/admin/:page` - Get content with sensitive fields
- `GET /api/content/` - Get all content
- `PUT /api/content/:page` - Update content
- `POST /api/content/upload` - Upload document

Admin endpoints require JWT token with admin or moderator role:

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

### ContentData (Public Response)

```typescript
interface ContentData {
  id: string; // Content ID (same as page identifier)
  page: ContentPage; // Page identifier
  title: string; // Page title
  content: string; // HTML content (for rich text pages) or JSON (for structured pages like About)
  documentUrl?: string; // Optional PDF document URL
  updatedAt: string; // ISO 8601 timestamp
  // Note: updatedBy and createdAt are excluded from public responses
}
```

### ContentData (Admin Response)

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

For the About page, content is stored as structured JSON with the following required fields:

```typescript
interface AboutPageContent {
  heroImage: string; // Hero section image URL
  myWhyTitle: string; // "My Why" section title
  myWhyText1: string; // First paragraph of "My Why" section
  myWhyText2: string; // Second paragraph of "My Why" section
  myWhyImage: string; // "My Why" section image URL
  ourStoryTitle: string; // "Our Story" section title
  ourStoryText1: string; // First paragraph of "Our Story" section
  ourStoryText2: string; // Second paragraph of "Our Story" section
  ourStoryImage: string; // "Our Story" section image URL
  signature: string; // Signature name (e.g., "Dee")
  signatureTitle: string; // Signature title (e.g., "Founder, Tassel & Wicker")
  builtForTitle: string; // "Built For" section title
  builtForVideos: string[]; // Array of video URLs for carousel
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

### 1. Get Public Content (User Endpoint)

Retrieve public content for a specific page. This endpoint does not require authentication and is designed for users to access content on the frontend.

**Endpoint:** `GET /api/content/:page`

**Authentication:** None required

**Path Parameters:**

- `page` (string, required) - One of: `about`, `cookie-policy`, `privacy-policy`, `terms-of-service`, `returns`, `shipping`

**Response:**

```json
{
  "id": "about",
  "page": "about",
  "title": "About Page",
  "content": "{\"heroImage\":\"https://...\",\"myWhyTitle\":\"MY WHY\",\"myWhyText1\":\"...\",\"myWhyText2\":\"...\",\"myWhyImage\":\"https://...\",\"ourStoryTitle\":\"...\",\"ourStoryText1\":\"...\",\"ourStoryText2\":\"...\",\"ourStoryImage\":\"https://...\",\"signature\":\"Dee\",\"signatureTitle\":\"Founder, Tassel & Wicker\",\"builtForTitle\":\"...\",\"builtForVideos\":[\"https://...\"]}",
  "documentUrl": null,
  "updatedAt": "2025-12-17T10:00:00Z"
}
```

**Status Codes:**

- `200 OK` - Content retrieved successfully
- `400 Bad Request` - Invalid page identifier
- `404 Not Found` - Content not found for the specified page

**Notes:**

- This endpoint excludes sensitive fields (`updatedBy` and `createdAt`) from the response
- For `about` page, `content` is a JSON string that should be parsed to get the structured `AboutPageContent` object
- For other pages, `content` is an HTML string from rich text editor
- No authentication token is required

**Example Request:**

```bash
curl https://api.example.com/api/content/about
```

---

### 2. Get Content (Admin Endpoint)

Retrieve content for a specific page with all fields including sensitive information. Requires admin or moderator authentication.

**Endpoint:** `GET /api/content/admin/:page`

**Authentication:** Required (Admin or Moderator role)

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
  "content": "{\"heroImage\":\"https://...\",\"myWhyTitle\":\"MY WHY\",...}",
  "documentUrl": null,
  "updatedAt": "2025-12-17T10:00:00Z",
  "updatedBy": "user-123",
  "createdAt": "2025-12-17T09:00:00Z"
}
```

**Status Codes:**

- `200 OK` - Content retrieved successfully
- `400 Bad Request` - Invalid page identifier
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have admin/moderator permission
- `404 Not Found` - Content not found for the specified page

**Notes:**

- Includes all fields including `updatedBy` and `createdAt`
- For `about` page, `content` is a JSON string of `AboutPageContent`
- For other pages, `content` is HTML string from rich text editor

---

### 3. Get All Content (Admin)

Retrieve all content pages for admin overview. Supports filtering by specific pages.

**Endpoint:** `GET /api/content/`

**Authentication:** Required (Admin or Moderator role)

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `pages` (string, optional) - Comma-separated list of page identifiers to filter results

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

**Example Request:**

```bash
# Get all pages
curl -H "Authorization: Bearer <token>" https://api.example.com/api/content/

# Get specific pages
curl -H "Authorization: Bearer <token>" "https://api.example.com/api/content/?pages=about,cookie-policy,privacy-policy"
```

**Status Codes:**

- `200 OK` - Content retrieved successfully
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have admin/moderator permission

**Notes:**

- Results are sorted by `updatedAt` in descending order (most recently updated first)
- If `pages` query parameter is provided, only valid page identifiers are included in the filter

---

### 4. Update Content

Update content for a specific page. Creates the content if it doesn't exist (upsert).

**Endpoint:** `PUT /api/content/:page`

**Authentication:** Required (Admin or Moderator role)

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

**For About Page (Structured JSON):**

```json
{
  "content": "{\"heroImage\":\"https://...\",\"myWhyTitle\":\"MY WHY\",\"myWhyText1\":\"Updated text...\",\"myWhyText2\":\"...\",\"myWhyImage\":\"https://...\",\"ourStoryTitle\":\"...\",\"ourStoryText1\":\"...\",\"ourStoryText2\":\"...\",\"ourStoryImage\":\"https://...\",\"signature\":\"Dee\",\"signatureTitle\":\"Founder, Tassel & Wicker\",\"builtForTitle\":\"...\",\"builtForVideos\":[\"https://...\"]}",
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
- `400 Bad Request` - Invalid content data or validation failed
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have admin/moderator permission

**Validation:**

- `content` is required and must be a non-empty string
- For `about` page, content must be valid JSON matching `AboutPageContent` structure with all required fields
- For other pages, content should be valid HTML
- `documentUrl` is optional and must be a valid URL if provided

**About Page Validation:**

The About page content must include all of the following fields:
- `heroImage` (string)
- `myWhyTitle` (string)
- `myWhyText1` (string)
- `myWhyText2` (string)
- `myWhyImage` (string)
- `ourStoryTitle` (string)
- `ourStoryText1` (string)
- `ourStoryText2` (string)
- `ourStoryImage` (string)
- `signature` (string)
- `signatureTitle` (string)
- `builtForTitle` (string)
- `builtForVideos` (array of strings)

---

### 5. Upload Document

Upload a PDF document for a page (used for legal pages that have downloadable documents).

**Endpoint:** `POST /api/content/upload`

**Authentication:** Required (Admin or Moderator role)

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**

- `file` (File, required) - PDF file to upload (max 10MB)
- `page` (string, required) - Page identifier (one of the valid ContentPage values)

**Request:**

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@cookie-policy.pdf" \
  -F "page=cookie-policy" \
  https://api.example.com/api/content/upload
```

**Response:**

```json
{
  "url": "https://example.com/uploads/cookie-policy-1734432000000.pdf",
  "filename": "cookie-policy.pdf",
  "size": 245678,
  "mimeType": "application/pdf"
}
```

**Status Codes:**

- `200 OK` - File uploaded successfully
- `400 Bad Request` - Missing file or page parameter
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have admin/moderator permission
- `413 Payload Too Large` - File size exceeds limit (max 10MB)
- `415 Unsupported Media Type` - File is not a PDF

**File Requirements:**

- Maximum file size: 10MB
- Allowed MIME types: `application/pdf` only
- File naming: Auto-generated with format `${page}-${timestamp}.pdf` to prevent conflicts

**Storage:**

- Files are uploaded to Cloudinary
- Public URL is returned for direct access
- Consider CDN for faster delivery

---

## Database Schema (MongoDB)

### Content Collection

```javascript
{
  _id: ObjectId,
  id: String,                  // Same as page identifier (unique)
  page: String,                // Page identifier (enum)
  title: String,               // Page title
  content: String,             // HTML or JSON string
  documentUrl: String,         // Optional PDF document URL
  updatedAt: Date,
  updatedBy: String,           // User ID of last editor
  createdAt: Date
}

// Indexes
db.content.createIndex({ id: 1 }, { unique: true })
db.content.createIndex({ page: 1 })
db.content.createIndex({ updatedAt: -1 })
```

## Content Rendering

### Client-Side Rendering

**For Rich Text Content (Legal Pages):**

Use a rich text renderer component to display HTML content:

```tsx
import RichTextRenderer from "@/components/common/RichTextRenderer";

<RichTextRenderer content={contentData.content} />;
```

**For About Page (Structured JSON):**

Parse the JSON string and render structured content:

```tsx
const aboutContent = JSON.parse(contentData.content);

// Render structured form fields
<div>
  <img src={aboutContent.heroImage} alt="Hero" />
  <h1>{aboutContent.myWhyTitle}</h1>
  <p>{aboutContent.myWhyText1}</p>
  <p>{aboutContent.myWhyText2}</p>
  {/* ... other fields ... */}
  <div>
    {aboutContent.builtForVideos.map((videoUrl, index) => (
      <video key={index} src={videoUrl} />
    ))}
  </div>
</div>
```

### HTML Sanitization

All HTML content should be sanitized before rendering to prevent XSS attacks. Consider using libraries like:

- `DOMPurify` for client-side sanitization
- Server-side sanitization before storage (recommended)

## Implementation Notes

1. **Content Validation**:
   - Validate HTML structure for rich text pages
   - Validate JSON structure for About page (all required fields must be present)
   - Sanitize HTML to prevent XSS attacks

2. **Version History** (Optional):
   - Consider storing content versions for audit trail
   - Allow rollback to previous versions

3. **Caching**:
   - Cache public content responses (5-10 minutes recommended)
   - Invalidate cache on content update
   - Use appropriate cache headers

4. **File Storage**:
   - Files are stored in Cloudinary
   - Generate unique filenames with timestamps to prevent conflicts
   - Consider implementing file cleanup for old uploads

5. **Permissions**:
   - Only admin and moderator roles can edit content
   - Public GET endpoint is read-only and requires no authentication
   - Admin endpoints require authentication and appropriate role

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

- `CONTENT_NOT_FOUND` - Content doesn't exist for the specified page
- `INVALID_CONTENT_FORMAT` - Invalid content structure (e.g., missing required fields in About page JSON)
- `INVALID_PAGE` - Invalid page identifier
- `FILE_TOO_LARGE` - File exceeds size limit (10MB)
- `UNSUPPORTED_MEDIA_TYPE` - File is not a PDF
- `UNAUTHORIZED` - Missing or invalid authentication token
- `FORBIDDEN` - User doesn't have required permissions

## Rate Limiting

- Admin endpoints: 50 requests per minute per user
- Public endpoints: 100 requests per minute per IP
- Upload endpoint: 10 requests per minute per user

## Example Usage

### Frontend Example (React/TypeScript)

```typescript
// Fetch public content
async function getPublicContent(page: ContentPage) {
  const response = await fetch(`/api/content/${page}`);
  if (!response.ok) {
    throw new Error('Failed to fetch content');
  }
  return response.json();
}

// Fetch admin content (with auth)
async function getAdminContent(page: ContentPage, token: string) {
  const response = await fetch(`/api/content/admin/${page}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch content');
  }
  return response.json();
}

// Update content (admin only)
async function updateContent(
  page: ContentPage,
  content: string,
  documentUrl: string | null,
  token: string
) {
  const response = await fetch(`/api/content/${page}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, documentUrl })
  });
  if (!response.ok) {
    throw new Error('Failed to update content');
  }
  return response.json();
}
```

### cURL Examples

```bash
# Get public content
curl https://api.example.com/api/content/about

# Get admin content
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/content/admin/about

# Get all content (admin)
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/content/

# Update content
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"<p>Updated content</p>","documentUrl":null}' \
  https://api.example.com/api/content/cookie-policy

# Upload document
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@policy.pdf" \
  -F "page=cookie-policy" \
  https://api.example.com/api/content/upload
```
