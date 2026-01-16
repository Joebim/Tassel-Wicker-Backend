# Create Order API

**Endpoint**: `POST /api/orders`

Creates a new order in the system. This endpoint handles stock validation, stock decrementing, and order persistence.

## Authentication

- **Type**: Bearer Token (Optional)
- **Header**: `Authorization: Bearer <token>`
- **Description**: If provided, the order will be linked to the authenticated user. If not provided, or if the token is invalid, the order will be created for a "Guest".

## Request Body

The request body must be a JSON object with the following structure:

### Schema

```typescript
interface CreateOrderRequest {
  items: OrderItem[];
  shipping: ShippingInfo;
  billing: BillingInfo;
  payment: PaymentInfo;
  totals: OrderTotals;
  currency?: string; // Default: "GBP"
  customerName?: string; // Optional name
  notes?: string; // Max 10000 chars
}
```

### Type Definitions

**1. OrderItem**

```typescript
{
  productId: string; // MongoDB ObjectId of the product
  productName: string;
  productImage: string; // URL to the product image
  price: number; // Unit price (non-negative)
  quantity: number; // Quantity (positive integer)
  total: number; // price * quantity
}
```

**2. ShippingInfo**

```typescript
{
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  // Shipping specific fields
  method: string;         // e.g., "Standard Shipping"
  cost: number;           // Shipping cost
  trackingNumber?: string;
}
```

**3. BillingInfo**

```typescript
{
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}
```

**4. PaymentInfo**

```typescript
{
  method: string;         // e.g., "stripe", "credit_card"
  status?: "pending" | "paid" | "failed" | "refunded"; // Default: "pending"
  transactionId?: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
}
```

**5. OrderTotals**

```typescript
{
  subtotal: number; // Sum of all item totals
  shipping: number; // Shipping cost
  tax: number; // Tax amount
  discount: number; // Discount amount
  total: number; // subtotal + shipping + tax - discount
}
```

### Example Request

```json
{
  "items": [
    {
      "productId": "65a1b2c3d4e5f67890123456",
      "productName": "Wicker Basket",
      "productImage": "https://example.com/images/basket.jpg",
      "price": 50.0,
      "quantity": 2,
      "total": 100.0
    }
  ],
  "shipping": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "London",
    "state": "Greater London",
    "postalCode": "SW1A 1AA",
    "country": "UK",
    "method": "Standard",
    "cost": 5.0
  },
  "billing": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "London",
    "state": "Greater London",
    "postalCode": "SW1A 1AA",
    "country": "UK"
  },
  "payment": {
    "method": "stripe",
    "stripePaymentIntentId": "pi_123456789"
  },
  "totals": {
    "subtotal": 100.0,
    "shipping": 5.0,
    "tax": 20.0,
    "discount": 0,
    "total": 125.0
  },
  "currency": "GBP",
  "notes": "Please leave at the front door."
}
```

## Response

### Success (201 Created)

Returns the created order object wrapped in an `item` property.

```json
{
  "item": {
    "id": "65b2c3d4e5f6789012345678",
    "orderNumber": "ORD-1706234567-AB12",
    "orderId": "ORD-1706234567-AB12",
    "userId": "65a1b2c3d4e5f67890123456", // Optional, present if authenticated
    "customerName": "John Doe",          // "Guest" if not authenticated
    "status": "pending",
    "currency": "GBP",
    "items": [ ... ],     // Same as request but persisted
    "shipping": { ... },  // Same as request
    "billing": { ... },   // Same as request
    "payment": { ... },   // Same as request
    "totals": { ... },    // Same as request
    "notes": "Please leave at the front door.",
    "createdAt": "2024-01-26T10:00:00.000Z",
    "updatedAt": "2024-01-26T10:00:00.000Z"
  }
}
```

### Errors

| Status Code                   | Code                  | Description                                                                                                                                             |
| :---------------------------- | :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **400 Bad Request**           | `BadRequest`          | Validation failed (e.g., missing fields, invalid types) or `Subtotal mismatch` / `Total mismatch` if client calculations don't match server validation. |
| **409 Conflict**              | `Conflict`            | `Insufficient stock for <Product Name>`. The requested quantity exceeds available stock.                                                                |
| **500 Internal Server Error** | `InternalServerError` | Unexpected server error.                                                                                                                                |

## Logic Notes

- **Stock Validation**: The endpoint checks stock for all items. If any item has insufficient stock, the entire order is rejected with a 409 error.
- **Total Validation**: The server re-calculates the subtotal and total. If the values provided in `totals` differ from the server's calculation by more than 0.01, the request is rejected.
- **Customer Name**:
  - If a `customerName` is provided in the body, it is used as the initial value.
  - If a User ID is found (via Auth token or `req._id`), the system fetches the user's name from the `User` model. If the user has a name in the DB, it overwrites the body value.
  - If neither is available, `customerName` defaults to "Guest".
