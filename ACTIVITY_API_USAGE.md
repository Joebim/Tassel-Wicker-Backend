# Activity Endpoint - Frontend Usage Guide

## Base Endpoint

```
GET /api/activities
```

**Authentication Required**: Yes (Admin/Moderator only)

---

## 1. Basic Usage - Get Recent Activities

```typescript
// Fetch the first page of activities (default: 50 items)
const response = await fetch('http://localhost:4000/api/activities', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const data = await response.json();

// Response structure:
{
  "activities": [
    {
      "id": "...",
      "type": "order.created",
      "userId": "user123",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": {
        "orderId": "order456",
        "orderNumber": "TW-M2KJ3L-A1B2C3D4",
        "total": 150.00,
        "itemCount": 3
      },
      "createdAt": "2026-01-15T01:30:00.000Z",
      "user": {
        "id": "user123",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe",
        "role": "customer"
      }
    },
    // ... more activities
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 245,
    "totalPages": 5
  }
}
```

---

## 2. Pagination

```typescript
// Get page 2 with 20 items per page
const response = await fetch(
  "http://localhost:4000/api/activities?page=2&limit=20",
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

---

## 3. Filter by Activity Type

```typescript
// Get only order-related activities
const response = await fetch(
  "http://localhost:4000/api/activities?type=order.created",
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);

// Available activity types:
// - user.registered
// - user.login
// - user.login_failed
// - user.logout
// - user.password_reset_requested
// - user.password_reset
// - order.created
// - order.updated
// - order.cancelled
// - order.payment_received
// - cart.item_added
// - cart.item_updated
// - cart.item_removed
// - cart.cleared
// - product.created
// - product.updated
// - product.deleted
// - product.image_uploaded
// - content.updated
// - content.document_uploaded
// - category.created
// - category.updated
// - category.deleted
// - upload.product_image
// - upload.media
```

---

## 4. Filter by User

```typescript
// Get all activities for a specific user
const userId = "user123";
const response = await fetch(
  `http://localhost:4000/api/activities?userId=${userId}`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

---

## 5. Filter by Date Range

```typescript
// Get activities from the last 7 days
const endDate = new Date().toISOString();
const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const response = await fetch(
  `http://localhost:4000/api/activities?startDate=${startDate}&endDate=${endDate}`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

---

## 6. Filter by Order ID

```typescript
// Get all activities related to a specific order
const orderId = "order123";
const response = await fetch(
  `http://localhost:4000/api/activities?orderId=${orderId}`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

---

## 7. Filter by Product ID

```typescript
// Get all activities related to a specific product
const productId = "product456";
const response = await fetch(
  `http://localhost:4000/api/activities?productId=${productId}`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

---

## 8. Combined Filters

```typescript
// Get order creation activities for a specific user in the last 30 days
const params = new URLSearchParams({
  type: "order.created",
  userId: "user123",
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
  page: "1",
  limit: "25",
});

const response = await fetch(
  `http://localhost:4000/api/activities?${params.toString()}`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

---

## 9. React Component Example

```tsx
import { useState, useEffect } from "react";

interface Activity {
  id: string;
  type: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
  };
}

interface ActivityResponse {
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function ActivityLog() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activityType, setActivityType] = useState<string>("");

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          ...(activityType && { type: activityType }),
        });

        const response = await fetch(
          `http://localhost:4000/api/activities?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [page, activityType]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      <h1>Activity Log</h1>

      {/* Filter */}
      <select
        value={activityType}
        onChange={(e) => setActivityType(e.target.value)}
      >
        <option value="">All Activities</option>
        <option value="order.created">Orders Created</option>
        <option value="user.login">User Logins</option>
        <option value="product.created">Products Created</option>
      </select>

      {/* Activities List */}
      <ul>
        {data.activities.map((activity) => (
          <li key={activity.id}>
            <strong>{activity.type}</strong>
            {activity.user &&
              ` by ${activity.user.fullName || activity.user.email}`}
            <br />
            <small>{new Date(activity.createdAt).toLocaleString()}</small>
            {activity.metadata && (
              <pre>{JSON.stringify(activity.metadata, null, 2)}</pre>
            )}
          </li>
        ))}
      </ul>

      {/* Pagination */}
      <div>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>
          Page {data.pagination.page} of {data.pagination.totalPages}
        </span>
        <button
          disabled={page === data.pagination.totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ActivityLog;
```

---

## 10. Get Activity Statistics

```typescript
// Get activity statistics for the last 30 days
const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const endDate = new Date().toISOString();

const response = await fetch(
  `http://localhost:4000/api/activities/stats?startDate=${startDate}&endDate=${endDate}`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

const stats = await response.json();

// Response:
{
  "activityCounts": [
    { "type": "user.login", "count": 450 },
    { "type": "order.created", "count": 125 },
    { "type": "cart.item_added", "count": 380 }
  ],
  "totalUniqueUsers": 87,
  "recentActivitiesCount": 234,
  "dateRange": {
    "startDate": "2025-12-16T00:00:00.000Z",
    "endDate": "2026-01-15T00:00:00.000Z"
  }
}
```

---

## 11. Get Single Activity by ID

```typescript
const activityId = "activity123";
const response = await fetch(
  `http://localhost:4000/api/activities/${activityId}`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);

const activity = await response.json();
```

---

## Common Use Cases

### Admin Dashboard - Recent Activity Feed

```typescript
// Show last 10 activities
fetch("/api/activities?limit=10");
```

### User Profile - User's Activity History

```typescript
// Show all activities for a specific user
fetch(`/api/activities?userId=${userId}&limit=50`);
```

### Order Details - Order Activity Timeline

```typescript
// Show all activities related to an order
fetch(`/api/activities?orderId=${orderId}`);
```

### Security Monitoring - Failed Login Attempts

```typescript
// Show failed login attempts in the last 24 hours
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
fetch(`/api/activities?type=user.login_failed&startDate=${yesterday}`);
```

### Product Analytics - Product Activity

```typescript
// Show all activities for a product
fetch(`/api/activities?productId=${productId}`);
```
