# Activities API Documentation

## Overview

The Activities API provides comprehensive activity tracking and audit logging for the Tassel & Wicker backend. It tracks all important user interactions including account operations, orders, cart activities, and administrative actions. This endpoint is **admin and moderator only**.

## Base URL

```
/api/activities
```

## Authentication

All endpoints require admin or moderator authentication via JWT token:

```
Authorization: Bearer <token>
```

## Data Structures

### ActivityType

The activity type enum defines all trackable activities:

```typescript
type ActivityType =
  | "user.registered"
  | "user.login"
  | "user.login_failed"
  | "user.logout"
  | "user.password_reset_requested"
  | "user.password_reset"
  | "order.created"
  | "order.updated"
  | "order.cancelled"
  | "order.payment_received"
  | "cart.item_added"
  | "cart.item_updated"
  | "cart.item_removed"
  | "cart.cleared"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "content.updated"
  | "category.created"
  | "category.updated"
  | "category.deleted";
```

### ActivityData

```typescript
interface ActivityData {
  id: string; // Activity ID
  type: ActivityType; // Activity type
  userId?: string; // User ID who performed the action (if authenticated)
  user?: {
    id: string; // User ID
    email: string; // User email
    firstName?: string | null; // User first name
    lastName?: string | null; // User last name
    fullName?: string | null; // User full name (firstName + lastName, or firstName, or lastName)
    role: string; // User role (admin, customer, moderator)
  }; // User information (populated when userId exists)
  sessionId?: string; // Session ID for guest users
  ipAddress?: string; // IP address of the user
  userAgent?: string; // User agent string
  metadata?: Record<string, any>; // Additional context data
  createdAt: string; // ISO 8601 timestamp
}
```

### Activity Metadata Examples

The `metadata` field contains context-specific information:

**User Activities:**

```typescript
// user.registered
{ email: string, role: string }

// user.login, user.login_failed
{ email: string }

// user.password_reset_requested, user.password_reset
{ email: string }
```

**Order Activities:**

```typescript
// order.created
{
  orderId: string,
  orderNumber: string,
  total: number,
  itemCount: number,
  paymentMethod: string
}

// order.payment_received
{
  orderId: string,
  orderNumber: string,
  amount: number
}

// order.updated, order.cancelled
{
  orderId: string,
  orderNumber: string,
  status?: string
}
```

**Cart Activities:**

```typescript
// cart.item_added, cart.item_updated
{
  productId: string,
  productName: string,
  quantity: number,
  price?: number
}

// cart.item_removed
{
  productId: string,
  productName: string
}
```

## Endpoints

### 1. Get Activities

Retrieve a paginated list of activities with optional filtering.

**Endpoint:** `GET /api/activities`

**Authentication:** Required (Admin or Moderator)

**Query Parameters:**

- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page, max 100 (default: 50)
- `type` (string, optional) - Filter by activity type (e.g., "user.login", "order.created")
- `userId` (string, optional) - Filter by user ID
- `startDate` (string, optional) - Start date for date range filter (ISO 8601 format)
- `endDate` (string, optional) - End date for date range filter (ISO 8601 format)
- `orderId` (string, optional) - Filter by order ID (searches in metadata)
- `productId` (string, optional) - Filter by product ID (searches in metadata)

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "activities": [
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "type": "user.login",
      "userId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "user": {
        "id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe",
        "role": "customer"
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "metadata": {
        "email": "user@example.com"
      },
      "createdAt": "2025-01-17T10:30:00.000Z"
    },
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "type": "order.created",
      "userId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "user": {
        "id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe",
        "role": "customer"
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "metadata": {
        "orderId": "65a1b2c3d4e5f6g7h8i9j0k4",
        "orderNumber": "ORD-20250117-001",
        "total": 125.99,
        "itemCount": 3,
        "paymentMethod": "card"
      },
      "createdAt": "2025-01-17T10:35:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "totalPages": 25
  }
}
```

**Status Codes:**

- `200 OK` - Activities retrieved successfully
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have admin/moderator permission

**Example Requests:**

```bash
# Get all activities (first page)
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/activities

# Get activities with filters
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/activities?type=user.login&page=1&limit=20"

# Get activities for a specific user
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/activities?userId=65a1b2c3d4e5f6g7h8i9j0k2"

# Get activities in date range
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/activities?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z"

# Get activities for a specific order
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/activities?orderId=65a1b2c3d4e5f6g7h8i9j0k4"
```

---

### 2. Get Activity Statistics

Get aggregated statistics about activities.

**Endpoint:** `GET /api/activities/stats`

**Authentication:** Required (Admin or Moderator)

**Query Parameters:**

- `startDate` (string, optional) - Start date for date range (ISO 8601 format)
- `endDate` (string, optional) - End date for date range (ISO 8601 format)

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "activityCounts": [
    {
      "type": "user.login",
      "count": 1250
    },
    {
      "type": "order.created",
      "count": 340
    },
    {
      "type": "cart.item_added",
      "count": 2890
    },
    {
      "type": "user.registered",
      "count": 156
    }
  ],
  "totalUniqueUsers": 892,
  "recentActivitiesCount": 245,
  "dateRange": {
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-01-31T23:59:59.000Z"
  }
}
```

**Response Fields:**

- `activityCounts` - Array of activity types with their counts, sorted by count (descending)
- `totalUniqueUsers` - Total number of unique users who have generated activities
- `recentActivitiesCount` - Count of activities in the last 24 hours
- `dateRange` - The date range used for filtering (if provided)

**Status Codes:**

- `200 OK` - Statistics retrieved successfully
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have admin/moderator permission

**Example Request:**

```bash
# Get statistics for all time
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/activities/stats

# Get statistics for specific date range
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/activities/stats?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z"
```

---

### 3. Get Activity by ID

Retrieve a specific activity by its ID.

**Endpoint:** `GET /api/activities/:id`

**Authentication:** Required (Admin or Moderator)

**Path Parameters:**

- `id` (string, required) - Activity ID

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "type": "order.created",
  "userId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "role": "customer"
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "metadata": {
    "orderId": "65a1b2c3d4e5f6g7h8i9j0k4",
    "orderNumber": "ORD-20250117-001",
    "total": 125.99,
    "itemCount": 3,
    "paymentMethod": "card"
  },
  "createdAt": "2025-01-17T10:35:00.000Z"
}
```

**Status Codes:**

- `200 OK` - Activity retrieved successfully
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have admin/moderator permission
- `404 Not Found` - Activity not found

**Example Request:**

```bash
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/activities/65a1b2c3d4e5f6g7h8i9j0k1
```

---

## Activity Types Reference

### User Activities

- **user.registered** - New user account created
- **user.login** - Successful user login
- **user.login_failed** - Failed login attempt
- **user.logout** - User logged out
- **user.password_reset_requested** - Password reset requested
- **user.password_reset** - Password reset completed

### Order Activities

- **order.created** - New order created
- **order.updated** - Order status or details updated
- **order.cancelled** - Order cancelled
- **order.payment_received** - Payment received for order

### Cart Activities

- **cart.item_added** - Item added to cart
- **cart.item_updated** - Cart item quantity updated
- **cart.item_removed** - Item removed from cart
- **cart.cleared** - Entire cart cleared

### Product Activities (Future)

- **product.created** - New product created
- **product.updated** - Product updated
- **product.deleted** - Product deleted

### Content Activities (Future)

- **content.updated** - Content page updated

### Category Activities (Future)

- **category.created** - Category created
- **category.updated** - Category updated
- **category.deleted** - Category deleted

---

## Database Schema (MongoDB)

### Activity Collection

```javascript
{
  _id: ObjectId,
  type: String,              // Activity type (enum)
  userId: String,            // User ID (optional, indexed)
  sessionId: String,         // Session ID (optional, indexed)
  ipAddress: String,         // IP address
  userAgent: String,         // User agent string
  metadata: Object,          // Additional context data
  createdAt: Date            // Timestamp (indexed)
}

// Indexes
db.activities.createIndex({ type: 1, createdAt: -1 })
db.activities.createIndex({ userId: 1, createdAt: -1 })
db.activities.createIndex({ createdAt: -1 })
db.activities.createIndex({ "metadata.orderId": 1 })
db.activities.createIndex({ "metadata.productId": 1 })
```

---

## Implementation Notes

### Activity Logging

Activities are automatically logged throughout the application using the `logActivity` service function. The logging is **non-blocking** - it won't affect the main request flow if logging fails.

**Example Usage:**

```typescript
import {
  logActivity,
  getIpAddress,
  getUserAgent,
} from "../services/activityLogger";

await logActivity({
  type: "order.created",
  userId: user.id,
  ipAddress: getIpAddress(req),
  userAgent: getUserAgent(req),
  metadata: {
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: order.totals.total,
  },
});
```

### Performance Considerations

- Activities are stored in a separate collection to avoid impacting main query performance
- Indexes are optimized for common query patterns (type, userId, createdAt)
- Activity logging is asynchronous and won't block request processing
- Consider implementing retention policies for old activities (e.g., archive after 1 year)

### Security Considerations

- Activities endpoint is **admin/moderator only**
- IP addresses and user agents are stored for security auditing
- Sensitive information should not be stored in metadata (e.g., passwords, credit card numbers)
- Consider data privacy regulations (GDPR) when storing user activity data

### Integration Points

Activities are automatically logged in the following routes:

1. **Authentication Routes** (`src/routes/auth.ts`)

   - User registration
   - Login (success and failure)
   - Logout
   - Password reset requests and completions

2. **Order Routes** (`src/routes/orders.ts`)

   - Order creation
   - Order updates
   - Order cancellations
   - Payment received

3. **Cart Routes** (`src/routes/cart.ts`)
   - Item added to cart
   - Item updated in cart
   - Item removed from cart
   - Cart cleared

### Future Enhancements

- Real-time activity feed via WebSockets
- Activity export (CSV, JSON)
- Activity search with full-text search
- Activity retention policies and archival
- Activity aggregation for analytics dashboards
- Email notifications for critical activities

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Activity not found",
    "details": {}
  }
}
```

Common error codes:

- `UNAUTHORIZED` - Missing or invalid authentication token
- `FORBIDDEN` - User doesn't have required permissions
- `NOT_FOUND` - Activity not found
- `BAD_REQUEST` - Invalid query parameters

---

## Rate Limiting

- Activities endpoints: 100 requests per minute per user
- No rate limiting on activity logging (internal operations)

---

## Example Implementation (Frontend)

```typescript
// Fetch activities with filters
async function getActivities(
  filters: {
    page?: number;
    limit?: number;
    type?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  },
  token: string
) {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.type) params.append("type", filters.type);
  if (filters.userId) params.append("userId", filters.userId);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const response = await fetch(`/api/activities?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch activities");
  }

  return response.json();
}

// Get activity statistics
async function getActivityStats(
  token: string,
  startDate?: string,
  endDate?: string
) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const response = await fetch(`/api/activities/stats?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch statistics");
  }

  return response.json();
}
```

---

## cURL Examples

```bash
# Get all activities (page 1)
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/activities

# Get login activities
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/activities?type=user.login&limit=100"

# Get activities for specific user
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/activities?userId=65a1b2c3d4e5f6g7h8i9j0k2"

# Get activities in date range
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/activities?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z&type=order.created"

# Get statistics
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/activities/stats

# Get specific activity
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/activities/65a1b2c3d4e5f6g7h8i9j0k1
```
