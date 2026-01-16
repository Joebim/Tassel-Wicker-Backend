# Checkout API Documentation

## Overview

This document describes the backend API endpoints for the checkout process, including payment intent creation, shipping rate retrieval, payment intent updates, and order confirmation email sending. These endpoints integrate with Stripe for payment processing.

## Base URL

```
/api
```

## Authentication

All checkout endpoints are **public** (no authentication required). However, user information can be included in metadata for tracking purposes.

## Data Structures

### Create Payment Intent Request

```typescript
interface CreatePaymentIntentRequest {
  amount: number;              // Final amount in customer's currency
  currency: string;            // Currency code (e.g., 'gbp', 'usd', 'eur'), default: 'gbp'
  fxQuoteId?: string | null;   // Stripe FX quote ID (if currency conversion needed)
  items?: Array<{
    id: string;                // Product ID
    name: string;              // Product name
    quantity: number;          // Quantity (positive integer)
    price: number;             // Item price (non-negative)
  }>;
  metadata?: Record<string, any>; // Additional metadata (optional)
}
```

### Create Payment Intent Response

```typescript
interface CreatePaymentIntentResponse {
  success: boolean;
  clientSecret: string;        // Stripe Payment Intent client secret
  paymentIntentId: string;     // Stripe Payment Intent ID
  error?: string;              // Error message if creation failed
}
```

### Update Payment Intent Request

```typescript
interface UpdatePaymentIntentRequest {
  paymentIntentId: string;     // Payment Intent ID
  amount: number;              // Updated total amount (subtotal + shipping)
  currency: string;            // Currency code (default: 'gbp')
}
```

### Update Payment Intent Response

```typescript
interface UpdatePaymentIntentResponse {
  success: boolean;
  error?: string;              // Error message if update failed
}
```

### Get Shipping Rate Request

```typescript
interface GetShippingRateRequest {
  rateId: string;              // Stripe shipping rate ID
}
```

### Get Shipping Rate Response

```typescript
interface GetShippingRateResponse {
  amount: number;              // Shipping cost in cents
  currency: string;            // Currency code
  displayName: string;         // Shipping method display name
}
```

### Send Order Email Request

```typescript
interface SendOrderEmailRequest {
  paymentIntentId: string;     // Stripe Payment Intent ID
  customerEmail: string;       // Customer email address
  customerName?: string;       // Customer full name (optional)
}
```

### Send Order Email Response

```typescript
interface SendOrderEmailResponse {
  success: boolean;
  message?: string;            // Success/error message
  orderId?: string;            // Order ID (if order was created/updated)
}
```

## Endpoints

### 1. Create Payment Intent

Create a Stripe Payment Intent for processing a payment. Supports multi-currency via Stripe FX quotes.

**Endpoint:** `POST /api/create-payment-intent`

**Authentication:** Not required

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "amount": 205.18,
  "currency": "usd",
  "fxQuoteId": "fxq_1234567890",
  "items": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Artisan Wicker Basket",
      "quantity": 2,
      "price": 89.99
    }
  ],
  "metadata": {
    "userId": "507f1f77bcf86cd799439013",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe",
    "customerCurrency": "usd",
    "baseAmountGBP": "179.98"
  }
}
```

**Response:**

```json
{
  "success": true,
  "clientSecret": "pi_1234567890_secret_abcdef",
  "paymentIntentId": "pi_1234567890"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Failed to create payment intent"
}
```

**Status Codes:**

- `200 OK` - Payment Intent created successfully
- `500 Internal Server Error` - Failed to create Payment Intent or Stripe error

**Notes:**

- Amount is automatically converted to the smallest currency unit (cents for most currencies, except JPY which uses whole units)
- If `fxQuoteId` is provided, the Payment Intent is created with currency conversion using Stripe's FX quote feature
- Items and metadata are stored in the Payment Intent metadata for later retrieval
- Supports automatic payment methods (cards, Apple Pay, Google Pay, etc.)
- Allows redirects for payment methods that require additional authentication (3D Secure, etc.)

**Currency Handling:**

- For JPY (Japanese Yen), amounts are in whole units (not cents)
- For all other currencies, amounts are in cents (multiply by 100)
- Example: $205.18 USD = 20518 cents

**FX Quote Support:**

- When `fxQuoteId` is provided, Stripe uses the FX quote for currency conversion
- Requires Stripe API version `2025-10-29.clover;fx_quote_preview=v1`
- The FX quote must be valid and not expired

---

### 2. Update Payment Intent

Update the amount of an existing Payment Intent (typically when shipping is selected).

**Endpoint:** `POST /api/update-payment-intent`

**Authentication:** Not required

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "paymentIntentId": "pi_1234567890",
  "amount": 215.18,
  "currency": "usd"
}
```

**Response:**

```json
{
  "success": true
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Failed to update payment intent"
}
```

**Status Codes:**

- `200 OK` - Payment Intent updated successfully
- `500 Internal Server Error` - Failed to update Payment Intent or Stripe error

**Notes:**

- Amount is automatically converted to the smallest currency unit
- Only the amount can be updated; other Payment Intent properties remain unchanged
- Payment Intent must exist and be in a modifiable state (typically `requires_payment_method` or `requires_confirmation`)

---

### 3. Get Shipping Rate

Retrieve details about a Stripe shipping rate.

**Endpoint:** `POST /api/get-shipping-rate`

**Authentication:** Not required

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "rateId": "shr_1SY6XKDqrk2AVTntaI2Qcu4V"
}
```

**Response:**

```json
{
  "amount": 1000,
  "currency": "gbp",
  "displayName": "International delivery within Europe (DHL)"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Failed to retrieve shipping rate"
}
```

**Status Codes:**

- `200 OK` - Shipping rate retrieved successfully
- `500 Internal Server Error` - Failed to retrieve shipping rate or Stripe error

**Shipping Rate IDs:**

The following shipping rates are available:

- `shr_1SY6XKDqrk2AVTntaI2Qcu4V` - International delivery within Europe (DHL)
- `shr_1SY6VyDqrk2AVTnto4PrPyL3` - International delivery outside Europe (DHL)
- `shr_1SY658Dqrk2AVTnt4LEtyBhH` - Standard shipping incl VAT (DHL)

**Notes:**

- Amount is returned in the smallest currency unit (cents for most currencies)
- Shipping rates are configured in Stripe and must exist
- Display name is the customer-facing name of the shipping method

---

### 4. Send Order Email

Send order confirmation and payment confirmation emails to the customer after a successful payment. Also creates/updates an order record in the database.

**Endpoint:** `POST /api/send-order-email`

**Authentication:** Not required

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "paymentIntentId": "pi_1234567890",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order confirmation emails sent successfully",
  "orderId": "507f1f77bcf86cd799439012"
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Payment status is processing, not succeeded"
}
```

**Status Codes:**

- `200 OK` - Emails sent successfully
- `400 Bad Request` - Payment Intent status is not "succeeded"
- `500 Internal Server Error` - Failed to send emails or database error

**Notes:**

- Payment Intent must have status `succeeded` before emails can be sent
- Sends two emails:
  1. Order Confirmation email
  2. Payment Confirmation email
- Creates or updates an order record in the database keyed by Payment Intent ID
- Order number is generated as `PI-{paymentIntentId}`
- Order status is set to `confirmed` and payment status is set to `paid`
- If order already exists (same Payment Intent ID), it updates the existing order
- Order items are extracted from Payment Intent metadata
- Shipping address is extracted from Payment Intent shipping information (if available)
- Totals are calculated from Payment Intent amount

**Order Creation:**

The endpoint automatically creates/updates an order record with:

- Order number: `PI-{paymentIntentId}`
- Status: `confirmed`
- Payment status: `paid`
- Payment method: Detected from Payment Intent
- Items: Parsed from Payment Intent metadata
- Totals: Calculated from Payment Intent amount
- Payment Intent ID: Stored for reference

**Email Templates:**

- Uses `createOrderConfirmationEmailTemplate` for order confirmation
- Uses `createPaymentConfirmationEmailTemplate` for payment confirmation
- Emails include order details, items, totals, and shipping address (if available)

**Currency Handling:**

- Currency is extracted from Payment Intent metadata or Payment Intent currency field
- Amount conversion: For JPY, amount is in whole units; for other currencies, divide by 100 to get the actual amount

---

## Implementation Notes

1. **Stripe Integration:**
   - All endpoints use the Stripe API via the `getStripe()` service
   - Requires `STRIPE_SECRET_KEY` environment variable
   - Uses Stripe API version `2025-11-17.clover` (or `2025-10-29.clover;fx_quote_preview=v1` for FX quotes)

2. **Currency Conversion:**
   - JPY uses whole units (no division by 100)
   - All other currencies use cents (divide by 100 to get actual amount)
   - FX quotes allow multi-currency payments

3. **Payment Intent Metadata:**
   - Items are stored as JSON string in metadata
   - Additional metadata (userId, customerEmail, etc.) is stored as key-value pairs
   - Metadata is used to reconstruct order information later

4. **Order Creation:**
   - Orders are created/updated in the `send-order-email` endpoint
   - Orders are keyed by Payment Intent ID to prevent duplicates
   - Uses MongoDB `updateOne` with `upsert: true` for idempotency

5. **Error Handling:**
   - All endpoints return consistent error format with `success: false` and `error`/`message` field
   - Stripe errors are caught and returned as user-friendly error messages
   - Payment Intent status validation prevents invalid operations

6. **Email Sending:**
   - Uses the email service to send transactional emails
   - Order confirmation and payment confirmation are sent separately
   - Email sending failures are returned as errors

## Error Handling

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Or for send-order-email:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Common error scenarios:

- **Stripe API errors**: Invalid Payment Intent ID, invalid shipping rate ID, network errors
- **Configuration errors**: Missing `STRIPE_SECRET_KEY` environment variable
- **Validation errors**: Invalid request data, missing required fields
- **Business logic errors**: Payment Intent status not "succeeded" (for send-order-email)

## Rate Limiting

- Payment Intent creation: 50 requests per minute per IP
- Payment Intent updates: 100 requests per minute per IP
- Shipping rate retrieval: 100 requests per minute per IP
- Order email sending: 20 requests per minute per IP

## Example Usage

### Frontend Example (TypeScript)

```typescript
// Create Payment Intent
async function createPaymentIntent(
  amount: number,
  currency: string,
  items: Array<{ id: string; name: string; quantity: number; price: number }>,
  metadata: Record<string, any>,
  fxQuoteId?: string | null
) {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      items,
      metadata,
      fxQuoteId,
    }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to create payment intent');
  }
  return data;
}

// Update Payment Intent
async function updatePaymentIntent(
  paymentIntentId: string,
  amount: number,
  currency: string = 'gbp'
) {
  const response = await fetch('/api/update-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentIntentId,
      amount,
      currency,
    }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to update payment intent');
  }
  return data;
}

// Get Shipping Rate
async function getShippingRate(rateId: string) {
  const response = await fetch('/api/get-shipping-rate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rateId }),
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

// Send Order Email
async function sendOrderEmail(
  paymentIntentId: string,
  customerEmail: string,
  customerName?: string
) {
  const response = await fetch('/api/send-order-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentIntentId,
      customerEmail,
      customerName,
    }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to send order email');
  }
  return data;
}
```

### cURL Examples

```bash
# Create Payment Intent
curl -X POST https://api.example.com/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 205.18,
    "currency": "usd",
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Artisan Wicker Basket",
        "quantity": 2,
        "price": 89.99
      }
    ],
    "metadata": {
      "userId": "507f1f77bcf86cd799439013",
      "customerEmail": "customer@example.com",
      "customerName": "John Doe"
    }
  }'

# Update Payment Intent
curl -X POST https://api.example.com/api/update-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_1234567890",
    "amount": 215.18,
    "currency": "usd"
  }'

# Get Shipping Rate
curl -X POST https://api.example.com/api/get-shipping-rate \
  -H "Content-Type: application/json" \
  -d '{
    "rateId": "shr_1SY6XKDqrk2AVTntaI2Qcu4V"
  }'

# Send Order Email
curl -X POST https://api.example.com/api/send-order-email \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_1234567890",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe"
  }'
```

## Related Documentation

- [Backend Orders API Documentation](./backend-orders-api.md)
- [Checkout Process Documentation](./CHECKOUT_PROCESS_DOCUMENTATION.md)
- [Stripe Payment Intents Documentation](https://stripe.com/docs/payments/payment-intents)
- [Stripe Shipping Rates Documentation](https://stripe.com/docs/payments/checkout/shipping)

---

**Last Updated:** 2025-01-17
