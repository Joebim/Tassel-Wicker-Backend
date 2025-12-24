# Cart Sync API Documentation

## Overview

This document describes the backend API endpoints for cart management with support for offline cart synchronization and logged-in user cart persistence.

## Base URL

```
/api/cart
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Data Structures

### CartItem

```typescript
interface CartItem {
  id: string; // Unique item identifier (productId or productId-variantSlug)
  productId: string; // Product ID
  name: string; // Product name
  price: number; // Item price (in cents or base currency unit)
  image: string; // Product image URL
  category: string; // Product category
  description: string; // Product description
  quantity: number; // Quantity in cart
  variantName?: string; // Optional variant name (e.g., "Large", "Red")
  customItems?: Array<{
    // For custom baskets
    id: string;
    name: string;
    image: string;
    price: number;
  }>;
  basketItems?: Array<{
    // For normal baskets
    name: string;
    image: string;
    category: string;
  }>;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

### Cart

```typescript
interface Cart {
  id: string; // Cart ID (user ID for logged-in users, session ID for guests)
  userId?: string; // User ID if logged in
  sessionId?: string; // Session ID for guest carts
  items: CartItem[]; // Array of cart items
  totalPrice: number; // Total cart price (calculated)
  totalItems: number; // Total item count (calculated)
  lastSyncedAt?: string; // ISO 8601 timestamp of last sync
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

### Sync Request

```typescript
interface SyncCartRequest {
  localCart: CartItem[]; // Cart items from client (localStorage)
  lastSyncedAt?: string; // Last sync timestamp from client
  mergeStrategy?: "local" | "server" | "merge"; // How to handle conflicts
}
```

### Sync Response

```typescript
interface SyncCartResponse {
  cart: Cart; // Merged/synced cart
  conflicts?: Array<{
    // Conflicts if merge strategy is 'merge'
    itemId: string;
    localQuantity: number;
    serverQuantity: number;
    resolution: "local" | "server" | "combined";
  }>;
  syncedAt: string; // ISO 8601 timestamp
}
```

## Endpoints

### 1. Get User Cart

Retrieve the current user's cart.

**Endpoint:** `GET /api/cart`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "cart": {
    "id": "user-123",
    "userId": "user-123",
    "items": [
      {
        "id": "product-1-large",
        "productId": "product-1",
        "name": "Artisan Wicker Basket",
        "price": 8999,
        "image": "https://example.com/image.jpg",
        "category": "Baskets",
        "description": "A beautifully crafted basket",
        "quantity": 2,
        "variantName": "Large",
        "createdAt": "2025-12-17T10:00:00Z",
        "updatedAt": "2025-12-17T10:00:00Z"
      }
    ],
    "totalPrice": 17998,
    "totalItems": 2,
    "lastSyncedAt": "2025-12-17T10:00:00Z",
    "createdAt": "2025-12-17T09:00:00Z",
    "updatedAt": "2025-12-17T10:00:00Z"
  }
}
```

**Status Codes:**

- `200 OK` - Cart retrieved successfully
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Cart not found (will be created on first add)

---

### 2. Add Item to Cart

Add an item to the user's cart.

**Endpoint:** `POST /api/cart/items`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "item": {
    "id": "product-1-large",
    "productId": "product-1",
    "name": "Artisan Wicker Basket",
    "price": 8999,
    "image": "https://example.com/image.jpg",
    "category": "Baskets",
    "description": "A beautifully crafted basket",
    "quantity": 1,
    "variantName": "Large"
  }
}
```

**Response:**

```json
{
  "cart": {
    "id": "user-123",
    "items": [...],
    "totalPrice": 8999,
    "totalItems": 1
  },
  "item": {
    "id": "product-1-large",
    "quantity": 1
  }
}
```

**Status Codes:**

- `200 OK` - Item added successfully (or quantity updated if item exists)
- `400 Bad Request` - Invalid item data
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Product not found

**Notes:**

- If item with same `id` already exists, quantity is incremented
- If item doesn't exist, it's added with quantity 1

---

### 3. Update Item Quantity

Update the quantity of an item in the cart.

**Endpoint:** `PUT /api/cart/items/:itemId`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "quantity": 3
}
```

**Response:**

```json
{
  "cart": {
    "id": "user-123",
    "items": [...],
    "totalPrice": 26997,
    "totalItems": 3
  },
  "item": {
    "id": "product-1-large",
    "quantity": 3
  }
}
```

**Status Codes:**

- `200 OK` - Quantity updated successfully
- `400 Bad Request` - Invalid quantity (must be > 0)
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Item not found in cart

**Notes:**

- If quantity is set to 0 or less, the item is removed from cart

---

### 4. Remove Item from Cart

Remove an item from the cart.

**Endpoint:** `DELETE /api/cart/items/:itemId`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "cart": {
    "id": "user-123",
    "items": [...],
    "totalPrice": 0,
    "totalItems": 0
  },
  "removedItemId": "product-1-large"
}
```

**Status Codes:**

- `200 OK` - Item removed successfully
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Item not found in cart

---

### 5. Clear Cart

Remove all items from the cart.

**Endpoint:** `DELETE /api/cart`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "cart": {
    "id": "user-123",
    "items": [],
    "totalPrice": 0,
    "totalItems": 0
  }
}
```

**Status Codes:**

- `200 OK` - Cart cleared successfully
- `401 Unauthorized` - Invalid or missing token

---

### 6. Sync Cart (Offline/Online Sync)

Synchronize local cart (from localStorage) with server cart. This endpoint handles merging carts when user logs in or comes back online.

**Endpoint:** `POST /api/cart/sync`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "localCart": [
    {
      "id": "product-2",
      "productId": "product-2",
      "name": "Another Product",
      "price": 5999,
      "image": "https://example.com/image2.jpg",
      "category": "Baskets",
      "description": "Another product",
      "quantity": 1
    }
  ],
  "lastSyncedAt": "2025-12-17T09:00:00Z",
  "mergeStrategy": "merge"
}
```

**Merge Strategies:**

- `local` - Use local cart, discard server cart
- `server` - Use server cart, discard local cart
- `merge` - Merge both carts (default)
  - If same item exists in both: use higher quantity or combine based on business logic
  - Add items that exist only in one cart

**Response:**

```json
{
  "cart": {
    "id": "user-123",
    "items": [
      {
        "id": "product-1-large",
        "quantity": 2
      },
      {
        "id": "product-2",
        "quantity": 1
      }
    ],
    "totalPrice": 23997,
    "totalItems": 3
  },
  "conflicts": [
    {
      "itemId": "product-1-large",
      "localQuantity": 1,
      "serverQuantity": 2,
      "resolution": "server"
    }
  ],
  "syncedAt": "2025-12-17T10:00:00Z"
}
```

**Status Codes:**

- `200 OK` - Cart synced successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or missing token

**Sync Logic:**

1. Compare `lastSyncedAt` timestamps
2. If server cart is newer, merge with local cart
3. For items with same `id`:
   - If quantities differ, use the higher quantity (or business logic)
   - If prices differ, use server price (server is source of truth)
4. Return merged cart with conflict resolution details

---

### 7. Get Guest Cart (Session-based)

For non-authenticated users, use session-based cart storage.

**Endpoint:** `GET /api/cart/guest`

**Headers:**

```
X-Session-ID: <session-id>
```

**Response:**
Same as `GET /api/cart` but with `sessionId` instead of `userId`

**Status Codes:**

- `200 OK` - Cart retrieved successfully
- `400 Bad Request` - Missing session ID

**Notes:**

- Guest carts are stored with session ID
- When user logs in, guest cart should be merged with user cart via sync endpoint

---

### 8. Merge Guest Cart on Login

When a guest user logs in, merge their guest cart with their user cart.

**Endpoint:** `POST /api/cart/merge-guest`

**Headers:**

```
Authorization: Bearer <token>
X-Session-ID: <session-id>
Content-Type: application/json
```

**Request Body:**

```json
{
  "guestCart": [
    {
      "id": "product-3",
      "productId": "product-3",
      "name": "Guest Product",
      "price": 3999,
      "quantity": 1
    }
  ]
}
```

**Response:**

```json
{
  "cart": {
    "id": "user-123",
    "items": [
      {
        "id": "product-1-large",
        "quantity": 2
      },
      {
        "id": "product-3",
        "quantity": 1
      }
    ],
    "totalPrice": 21997,
    "totalItems": 3
  },
  "mergedItems": ["product-3"]
}
```

**Status Codes:**

- `200 OK` - Carts merged successfully
- `401 Unauthorized` - Invalid or missing token
- `400 Bad Request` - Invalid request data

---

## Database Schema (MongoDB)

### Cart Collection

```javascript
{
  _id: ObjectId,
  userId: String,              // User ID (for logged-in users)
  sessionId: String,           // Session ID (for guests)
  items: [{
    id: String,
    productId: String,
    name: String,
    price: Number,
    image: String,
    category: String,
    description: String,
    quantity: Number,
    variantName: String,
    customItems: [{
      id: String,
      name: String,
      image: String,
      price: Number
    }],
    basketItems: [{
      name: String,
      image: String,
      category: String
    }],
    createdAt: Date,
    updatedAt: Date
  }],
  totalPrice: Number,
  totalItems: Number,
  lastSyncedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.carts.createIndex({ userId: 1 }, { unique: true, sparse: true })
db.carts.createIndex({ sessionId: 1 }, { unique: true, sparse: true })
db.carts.createIndex({ updatedAt: 1 })
```

## Implementation Notes

1. **Cart Creation**: Carts are created lazily on first item add
2. **Price Validation**: Always validate product prices against current product data
3. **Stock Validation**: Check product availability before adding/updating
4. **Session Management**: Guest carts expire after 30 days of inactivity
5. **Conflict Resolution**: Default to server cart for price conflicts, higher quantity for quantity conflicts
6. **Optimistic Updates**: Client can update UI immediately, sync happens in background
7. **Offline Support**: Client stores cart in localStorage, syncs when online

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": {
    "code": "CART_ITEM_NOT_FOUND",
    "message": "Item not found in cart",
    "details": {}
  }
}
```

Common error codes:

- `CART_NOT_FOUND` - Cart doesn't exist
- `CART_ITEM_NOT_FOUND` - Item not in cart
- `INVALID_QUANTITY` - Quantity must be > 0
- `PRODUCT_NOT_FOUND` - Product doesn't exist
- `PRODUCT_OUT_OF_STOCK` - Product unavailable
- `PRICE_MISMATCH` - Product price changed
- `SYNC_CONFLICT` - Sync conflict detected

## Rate Limiting

- Cart operations: 100 requests per minute per user
- Sync operations: 10 requests per minute per user
