# Cart and Content API Implementation Documentation

This document describes the implementation of the Cart API and Content Management API in the Tassel & Wicker backend.

## Table of Contents

1. [Cart API Implementation](#cart-api-implementation)
2. [Content Management API Implementation](#content-management-api-implementation)
3. [Database Models](#database-models)
4. [Seed Scripts](#seed-scripts)
5. [Additional Features](#additional-features)
6. [Routes Integration](#routes-integration)

---

## Cart API Implementation

### Overview

The Cart API provides comprehensive shopping cart functionality with support for:

- User carts (authenticated users)
- Guest carts (session-based)
- Cart synchronization (offline/online)
- Guest cart merging on login
- Product validation and price verification

### Cart Model

**Location:** `src/models/Cart.ts`

**Schema Structure:**

```typescript
interface CartDoc {
  userId?: string;              // User ID (for logged-in users)
  sessionId?: string;           // Session ID (for guests)
  items: CartItem[];            // Array of cart items
  totalPrice: number;           // Total cart price (calculated)
  totalItems: number;           // Total item count (calculated)
  lastSyncedAt?: Date;         // ISO 8601 timestamp of last sync
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  id: string;                   // Unique item identifier
  productId: string;            // Product ID
  name: string;                 // Product name
  price: number;                // Item price
  image: string;                // Product image URL
  category: string;             // Product category
  description: string;          // Product description
  quantity: number;             // Quantity in cart
  variantName?: string;         // Optional variant name
  customItems?: Array<{...}>;   // For custom baskets
  basketItems?: Array<{...}>;   // For normal baskets
  createdAt: Date;
  updatedAt: Date;
}
```

**Features:**

- Automatic total calculation via Mongoose pre-save hook
- Unique indexes on `userId` and `sessionId` (sparse)
- Index on `updatedAt` for efficient queries
- JSON transformation via `applyToJSON` plugin

### Cart Routes

**Location:** `src/routes/cart.ts`

#### Endpoints

1. **GET /api/cart** - Get User Cart

   - Requires: Authentication (Bearer token)
   - Returns: User's cart with all items
   - Creates cart if it doesn't exist (lazy creation)

2. **GET /api/cart/guest** - Get Guest Cart

   - Requires: `X-Session-ID` header
   - Returns: Guest cart based on session ID
   - Creates cart if it doesn't exist

3. **POST /api/cart/items** - Add Item to Cart

   - Requires: Authentication
   - Body: `{ item: CartItem }`
   - Behavior:
     - Validates product exists and is in stock
     - Uses server price as source of truth
     - Increments quantity if item already exists
     - Adds new item if it doesn't exist

4. **PUT /api/cart/items/:itemId** - Update Item Quantity

   - Requires: Authentication
   - Body: `{ quantity: number }`
   - Behavior:
     - Updates quantity if > 0
     - Removes item if quantity is 0

5. **DELETE /api/cart/items/:itemId** - Remove Item from Cart

   - Requires: Authentication
   - Removes specific item from cart

6. **DELETE /api/cart** - Clear Cart

   - Requires: Authentication
   - Removes all items from cart

7. **POST /api/cart/sync** - Sync Cart

   - Requires: Authentication
   - Body: `{ localCart: CartItem[], lastSyncedAt?: string, mergeStrategy?: 'local' | 'server' | 'merge' }`
   - Behavior:
     - Merges local and server carts based on strategy
     - Resolves conflicts (uses higher quantity, server price)
     - Returns conflicts array if any
   - Merge Strategies:
     - `local`: Use local cart, discard server
     - `server`: Use server cart, discard local
     - `merge`: Merge both (default)

8. **POST /api/cart/merge-guest** - Merge Guest Cart on Login
   - Requires: Authentication + `X-Session-ID` header
   - Body: `{ guestCart: CartItem[] }`
   - Behavior:
     - Merges guest cart items into user cart
     - Uses higher quantity for existing items
     - Deletes guest cart after merge

**Key Features:**

- Product validation before adding items
- Stock availability checking
- Price synchronization (server is source of truth)
- Automatic cart totals calculation
- Conflict resolution for cart sync

---

## Content Management API Implementation

### Overview

The Content Management API provides functionality for managing page content including:

- Legal pages (Cookie Policy, Privacy Policy, Terms of Service, Returns, Shipping)
- About page (structured content with images and videos)
- PDF document uploads for legal pages

### Content Model

**Location:** `src/models/Content.ts`

**Schema Structure:**

```typescript
type ContentPage =
  | "about"
  | "cookie-policy"
  | "privacy-policy"
  | "terms-of-service"
  | "returns"
  | "shipping";

interface ContentDoc {
  id: string; // Content ID (same as page identifier)
  page: ContentPage; // Page identifier
  title: string; // Page title
  content: string; // HTML (legal pages) or JSON (About page)
  documentUrl?: string; // Optional PDF document URL
  updatedAt: Date;
  updatedBy: string; // User ID of last editor
  createdAt: Date;
}
```

**Features:**

- Unique index on `id` field
- Index on `page` for efficient queries
- Index on `updatedAt` for sorting
- JSON transformation via `applyToJSON` plugin

### Content Routes

**Location:** `src/routes/content.ts`

#### Endpoints

1. **GET /api/content/:page** - Get Content (Admin)

   - Requires: Authentication + Admin/Moderator role
   - Returns: Full content data including `updatedBy` and `createdAt`
   - Path parameter: `page` (ContentPage type)

2. **GET /api/content/public/:page** - Get Public Content

   - Requires: No authentication
   - Returns: Content data without sensitive fields (`updatedBy`, `createdAt`)
   - Rate limited: 100 requests per minute per IP

3. **GET /api/content** - Get All Content (Admin)

   - Requires: Authentication + Admin/Moderator role
   - Query params: `pages` (optional, comma-separated)
   - Returns: Array of all content pages

4. **PUT /api/content/:page** - Update Content

   - Requires: Authentication + Admin/Moderator role
   - Body: `{ content: string, documentUrl?: string | null }`
   - Behavior:
     - Validates About page JSON structure if page is "about"
     - Upserts content (creates if doesn't exist)
     - Updates `updatedBy` field with current user ID

5. **POST /api/content/upload** - Upload PDF Document
   - Requires: Authentication + Admin/Moderator role
   - Content-Type: `multipart/form-data`
   - Form fields:
     - `file`: PDF file (max 10MB)
     - `page`: Page identifier
   - Returns: `{ url, filename, size, mimeType }`
   - Uploads to Cloudinary as raw resource

**Content Validation:**

- About page: Validates JSON structure matches `AboutPageContent` interface
- Legal pages: Accepts HTML content (should be sanitized client-side)
- PDF uploads: Validates MIME type is `application/pdf`

**About Page Structure:**

```typescript
interface AboutPageContent {
  heroImage: string;
  myWhyTitle: string;
  myWhyText1: string;
  myWhyText2: string;
  myWhyImage: string;
  ourStoryTitle: string;
  ourStoryText1: string;
  ourStoryText2: string;
  ourStoryImage: string;
  signature: string;
  signatureTitle: string;
  builtForTitle: string;
  builtForVideos: string[]; // Array of video URLs
}
```

---

## Database Models

### Cart Model Details

**File:** `src/models/Cart.ts`

**Indexes:**

```javascript
// Unique sparse index on userId (only for logged-in users)
db.carts.createIndex({ userId: 1 }, { unique: true, sparse: true });

// Unique sparse index on sessionId (only for guests)
db.carts.createIndex({ sessionId: 1 }, { unique: true, sparse: true });

// Index on updatedAt for efficient queries
db.carts.createIndex({ updatedAt: 1 });
```

**Pre-save Hook:**

- Automatically calculates `totalItems` (sum of all item quantities)
- Automatically calculates `totalPrice` (sum of item.price \* item.quantity)

**Cart Item Schema:**

- Embedded documents (no separate collection)
- Timestamps for each item (`createdAt`, `updatedAt`)
- Supports custom baskets (`customItems`) and regular baskets (`basketItems`)

### Content Model Details

**File:** `src/models/Content.ts`

**Indexes:**

```javascript
// Unique index on id (page identifier)
db.content.createIndex({ id: 1 }, { unique: true });

// Index on page for filtering
db.content.createIndex({ page: 1 });

// Index on updatedAt for sorting
db.content.createIndex({ updatedAt: -1 });
```

**Content Storage:**

- Legal pages: HTML string stored in `content` field
- About page: JSON string stored in `content` field (must be parsed)
- PDF documents: URLs stored in `documentUrl` field (uploaded to Cloudinary)

---

## Seed Scripts

### Content Seed Script

**File:** `scripts/seed-content.ts`

**Purpose:** Seeds all content pages including legal pages and about page.

**Usage:**

```bash
npm run seed:content
```

**What it does:**

1. Clears all existing content
2. Seeds legal pages:
   - Cookie Policy
   - Privacy Policy
   - Terms of Service
   - Returns & Exchanges
   - Shipping Information
3. Seeds About page with structured JSON
4. Uses admin user ID for `updatedBy` field (or "system" if no admin exists)

**Legal Pages Content:**

- Extracted from frontend pages in `tassel-wicker-next/app/(site)/`
- Stored as HTML strings
- Includes all sections, subsections, and tables

**About Page Content:**

- Structured JSON matching `AboutPageContent` interface
- Includes all images and video URLs
- Extracted from `tassel-wicker-next/app/(site)/about/page.tsx`

### About Page Seed Script

**File:** `scripts/seed-about-page.ts`

**Purpose:** Dedicated seeder for About page content only.

**Usage:**

```bash
npm run seed:about
```

**What it does:**

1. Checks if About page content exists
2. Updates existing or creates new content
3. Validates structure after seeding
4. Displays detailed summary of seeded content

**Features:**

- Can be run independently
- Updates existing content instead of clearing all
- Provides detailed logging of seeded structure
- Warns if no admin user exists

---

## Additional Features

### PDF Upload Support

**Location:** `src/services/cloudinary.ts`

**Function:** `uploadDocument()`

**Features:**

- Uploads PDF files to Cloudinary as raw resources
- Stores in `{CLOUDINARY_FOLDER}/documents/` folder
- Auto-generates unique filenames with timestamps
- Returns public URL for direct access

**Usage:**

```typescript
const result = await uploadDocument({
  fileBuffer: file.buffer,
  filename: `${page}-${Date.now()}.pdf`,
  folder: "documents", // optional
});
```

**File Requirements:**

- Maximum size: 10MB
- MIME type: `application/pdf`
- Validated in route handler before upload

### About Page Structure

The About page uses a structured JSON format for easy editing and rendering:

**Sections:**

1. **Hero Section**

   - `heroImage`: Header image URL

2. **My Why Section**

   - `myWhyTitle`: Section title
   - `myWhyText1`: First paragraph
   - `myWhyText2`: Second paragraph
   - `myWhyImage`: Section image URL

3. **Our Story Section**

   - `ourStoryTitle`: Section title
   - `ourStoryText1`: First paragraph
   - `ourStoryText2`: Second paragraph
   - `ourStoryImage`: Section image URL

4. **Signature Section**

   - `signature`: Signature name
   - `signatureTitle`: Signature title/role

5. **Built For Section**
   - `builtForTitle`: Section title
   - `builtForVideos`: Array of video URLs for carousel

**Validation:**

- All fields are required
- `builtForVideos` must be an array
- All other fields must be strings
- Validated in `validateAboutContent()` function

---

## Routes Integration

### Main Router

**File:** `src/routes/index.ts`

**Updated to include:**

```typescript
import { cartRouter } from "./cart";
import { contentRouter } from "./content";

apiRouter.use("/cart", cartRouter);
apiRouter.use("/content", contentRouter);
```

**Route Order:**

1. `/api/auth` - Authentication routes
2. `/api/products` - Product routes
3. `/api/categories` - Category routes
4. `/api/orders` - Order routes
5. `/api/uploads` - Upload routes
6. `/api/cart` - **Cart routes (new)**
7. `/api/content` - **Content routes (new)**
8. `/api/*` - Legacy Next.js API compatibility routes

### Authentication Requirements

**Cart Routes:**

- Most endpoints require authentication
- Guest cart endpoint uses session ID instead
- Merge guest cart requires both auth and session ID

**Content Routes:**

- Admin endpoints: Require authentication + admin/moderator role
- Public endpoints: No authentication required
- Upload endpoint: Requires authentication + admin/moderator role

### Error Handling

All routes use the standard error handling pattern:

```typescript
{
  error: {
    code: string;      // Error code (e.g., "CART_NOT_FOUND")
    message: string;   // Human-readable message
    details?: any;     // Additional error details
  }
}
```

**Common Error Codes:**

**Cart API:**

- `CART_NOT_FOUND` - Cart doesn't exist
- `CART_ITEM_NOT_FOUND` - Item not in cart
- `INVALID_QUANTITY` - Quantity must be > 0
- `PRODUCT_NOT_FOUND` - Product doesn't exist
- `PRODUCT_OUT_OF_STOCK` - Product unavailable
- `PRICE_MISMATCH` - Product price changed
- `SYNC_CONFLICT` - Sync conflict detected

**Content API:**

- `CONTENT_NOT_FOUND` - Content doesn't exist
- `INVALID_CONTENT_FORMAT` - Invalid content structure
- `INVALID_PAGE` - Invalid page identifier
- `FILE_TOO_LARGE` - File exceeds size limit
- `INVALID_FILE_TYPE` - File is not a PDF
- `UPLOAD_FAILED` - File upload failed

---

## Implementation Notes

### Cart Implementation

1. **Lazy Cart Creation:**

   - Carts are created on first item add
   - No need to explicitly create empty carts

2. **Price Validation:**

   - Always validates product exists before adding
   - Server price is used as source of truth
   - Client price may be updated to match server

3. **Stock Validation:**

   - Checks `product.inStock` before adding items
   - Prevents adding out-of-stock products

4. **Sync Logic:**

   - Default merge strategy: `merge`
   - Conflict resolution: Higher quantity wins, server price wins
   - Invalid products are skipped during sync

5. **Guest Cart Management:**
   - Guest carts use session ID
   - Should be merged on login
   - Can be cleaned up after merge

### Content Implementation

1. **Content Storage:**

   - Legal pages: HTML strings (should be sanitized)
   - About page: JSON strings (must be parsed)
   - Documents: URLs to Cloudinary

2. **Validation:**

   - About page JSON structure is validated
   - PDF uploads validate MIME type
   - Page identifiers are validated against enum

3. **Public vs Admin:**

   - Public endpoints exclude sensitive fields
   - Admin endpoints include full metadata
   - Rate limiting differs between public and admin

4. **Document Upload:**
   - Files uploaded to Cloudinary
   - URLs stored in `documentUrl` field
   - Can be updated via PUT endpoint

---

## Testing

### Cart API Testing

**Test Scenarios:**

1. Create user cart and add items
2. Update item quantities
3. Remove items
4. Clear cart
5. Sync local and server carts
6. Merge guest cart on login
7. Handle product validation errors
8. Handle stock availability errors

### Content API Testing

**Test Scenarios:**

1. Fetch public content (no auth)
2. Fetch admin content (with auth)
3. Update legal page content
4. Update About page content (validate JSON)
5. Upload PDF document
6. Handle invalid page identifiers
7. Handle invalid content formats
8. Handle file upload errors

---

## Future Enhancements

### Potential Improvements

1. **Cart:**

   - Cart expiration (30 days for guest carts)
   - Cart abandonment tracking
   - Cart sharing functionality
   - Saved carts/wishlists

2. **Content:**

   - Content versioning/history
   - Content preview before publishing
   - Bulk content import/export
   - Content templates
   - Image upload for About page (not just URLs)

3. **Performance:**
   - Redis caching for public content
   - Cart caching for frequent access
   - CDN for document URLs

---

## Related Documentation

- **Frontend API Guide:** `tassel-wicker-next/docs/FRONTEND_API_GUIDE.md`
- **Backend Cart API:** `backend-cart-api.md`
- **Backend Content API:** `backend-content-api.md`
- **Main README:** `README.md`

---

## Support

For questions or issues:

- Check existing API documentation
- Review error codes and messages
- Verify authentication and permissions
- Check database indexes and schemas
