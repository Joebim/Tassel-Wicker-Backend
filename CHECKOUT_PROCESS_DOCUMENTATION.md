# Checkout Process Documentation

## Overview

This document provides a comprehensive guide to the checkout process, including all API calls, data flows, request/response types, and implementation details.

## Table of Contents

1. [Checkout Flow Overview](#checkout-flow-overview)
2. [Checkout Page (`/checkout`)](#checkout-page)
3. [Payment Processing](#payment-processing)
4. [Payment Success Page (`/payment-success`)](#payment-success-page)
5. [API Endpoints](#api-endpoints)
6. [Type Definitions](#type-definitions)
7. [Data Flow Diagrams](#data-flow-diagrams)
8. [Current Implementation Status](#current-implementation-status)

---

## Checkout Flow Overview

The checkout process consists of the following main steps:

1. **Cart Review** → User views cart and proceeds to checkout
2. **Checkout Page** → User enters shipping/billing information and payment details
3. **Payment Intent Creation** → Stripe Payment Intent is created with order details
4. **Payment Confirmation** → User confirms payment via Stripe Elements
5. **Payment Success** → User is redirected to success page, emails are sent
6. **Order Creation** ⚠️ **NOT YET IMPLEMENTED** → Order should be saved to database

---

## Checkout Page

**Route:** `/checkout`

**File:** `app/(site)/checkout/page.tsx`

### Initialization Steps

1. **Cart Validation**
   - Redirects to `/cart` if cart is empty
   - Uses `useCartStore` to get cart items and calculate totals

2. **User Authentication Check**
   - Checks if user is authenticated via `useAuthStore`
   - If not authenticated, shows checkout options (Sign In vs Guest Checkout)
   - If authenticated, automatically proceeds to checkout form

3. **Currency Detection & FX Quote**
   - Detects user location via `useCurrencyStore.detectLocation()`
   - Fetches FX quote if currency is not GBP
   - Uses FX quote to convert prices to customer's currency

4. **Payment Intent Creation**
   - Creates Stripe Payment Intent via `/api/create-payment-intent`
   - Includes cart items, amounts, currency, and metadata
   - Stores `clientSecret` and `paymentIntentId` in component state

### APIs Called on Checkout Page

#### 1. Create Payment Intent

**Endpoint:** `POST /api/create-payment-intent`

**When:** On component mount (after FX quote is fetched, if applicable)

**Request:**
```typescript
{
  amount: number;              // Final amount in customer's currency
  currency: string;            // Currency code (e.g., 'gbp', 'usd', 'eur')
  fxQuoteId?: string | null;   // Stripe FX quote ID (if currency conversion needed)
  items: Array<{
    id: string;                // Product ID
    name: string;              // Product name
    quantity: number;          // Quantity
    price: number;             // Item price
  }>;
  metadata: {
    userId: string;            // User ID or 'guest'
    customerEmail: string;     // Customer email
    customerName: string;      // Customer full name
    customerCurrency: string;  // Customer's currency
    baseAmountGBP: string;     // Base amount in GBP
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  clientSecret: string;        // Stripe Payment Intent client secret
  paymentIntentId: string;     // Stripe Payment Intent ID
  error?: string;              // Error message if creation failed
}
```

#### 2. Get Shipping Rates

**Endpoint:** `POST /api/get-shipping-rate`

**When:** On PaymentForm component mount (called for each shipping rate ID)

**Request:**
```typescript
{
  rateId: string;              // Stripe shipping rate ID
}
```

**Response:**
```typescript
{
  amount: number;              // Shipping cost in cents
  currency: string;            // Currency code
  displayName: string;         // Shipping method display name
}
```

**Shipping Rate IDs:**
- `shr_1SY6XKDqrk2AVTntaI2Qcu4V` - International delivery within Europe (DHL)
- `shr_1SY6VyDqrk2AVTnto4PrPyL3` - International delivery outside Europe (DHL)
- `shr_1SY658Dqrk2AVTnt4LEtyBhH` - Standard shipping incl VAT (DHL)

#### 3. Update Payment Intent

**Endpoint:** `POST /api/update-payment-intent`

**When:** When user selects a shipping rate (to update total amount)

**Request:**
```typescript
{
  paymentIntentId: string;     // Payment Intent ID
  amount: number;              // Updated total amount (subtotal + shipping)
  currency: string;            // Currency code
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

### User Input Collection

The checkout page collects the following information:

1. **Guest Email** (if guest checkout)
   - Email address input field
   - Validated for email format
   - Stored in component state and localStorage

2. **Shipping Address**
   - Collected via Stripe's `AddressElement` component
   - Includes: name, address lines, city, state, postal code, country, phone
   - Validated by Stripe

3. **Shipping Method**
   - User selects from available shipping rates
   - Updates Payment Intent amount when selected

4. **Payment Information**
   - Collected via Stripe's `PaymentElement` component
   - Supports: credit cards, Apple Pay, Google Pay
   - Includes billing details (auto-filled from shipping address)

### Payment Form Submission

When user clicks "Complete Order":

1. **Validate Form**
   - Validates guest email (if guest checkout)
   - Stripe Elements validates payment details

2. **Store Customer Info**
   - Stores email and name in localStorage
   - Stores payment intent and customer info in Zustand store (`usePaymentStore`)

3. **Confirm Payment**
   - Calls `stripe.confirmPayment()` with:
     - `elements`: Stripe Elements instance
     - `clientSecret`: Payment Intent client secret
     - `confirmParams.return_url`: `/payment-success`
     - `confirmParams.receipt_email`: Customer email
     - `redirect`: `'if_required'` (no redirect if payment succeeds immediately)

4. **Handle Payment Result**
   - If payment succeeds: Redirect to `/payment-success`
   - If payment requires action: Stripe handles redirect
   - If payment fails: Show error message

---

## Payment Processing

### Stripe Payment Intent Flow

1. **Payment Intent Creation**
   - Created with order total (including shipping)
   - Includes metadata for order tracking
   - Supports multi-currency via Stripe FX quotes

2. **Payment Confirmation**
   - User enters payment details via Stripe Elements
   - Stripe processes payment (card, Apple Pay, Google Pay, etc.)
   - Payment status: `succeeded`, `requires_action`, or `failed`

3. **Payment Status Check**
   - After confirmation, retrieves Payment Intent status
   - If `succeeded`: Redirects to success page
   - If `requires_action`: Stripe handles 3D Secure or other actions

### Payment Data Storage

**Zustand Store (`usePaymentStore`):**
```typescript
{
  paymentIntentId: string | null;
  paymentIntentClientSecret: string | null;
  customerEmail: string | null;
  customerName: string | null;
}
```

**localStorage:**
- `checkout_customer_email`: Customer email
- `checkout_first_name`: Customer first name
- `checkout_last_name`: Customer last name

---

## Payment Success Page

**Route:** `/payment-success`

**File:** `app/(site)/payment-success/page.tsx`

### Page Initialization

1. **Payment Intent Retrieval**
   - Gets payment intent ID from Zustand store (preferred)
   - Falls back to URL query parameters (for Stripe redirects)
   - Cleans up URL parameters immediately (security)

2. **Store Hydration Check**
   - Waits for payment store to be hydrated
   - Prevents duplicate email sends using sessionStorage

3. **Cart Clearing**
   - Clears cart immediately when payment intent is confirmed
   - Ensures cart is cleared even if email sending fails

### APIs Called on Payment Success Page

#### Send Order Email

**Endpoint:** `POST /api/send-order-email`

**When:** After 2-second delay (to ensure payment is fully processed)

**Request:**
```typescript
{
  paymentIntentId: string;     // Stripe Payment Intent ID
  customerEmail: string;       // Customer email address
  customerName: string;        // Customer full name
}
```

**Response:**
```typescript
{
  success: boolean;
  message?: string;            // Success/error message
  orderId?: string;            // Order ID (if order was created)
}
```

**Duplicate Prevention:**
- Uses `sessionStorage` to track sent emails
- Key: `sent_order_emails` (array of payment intent IDs)
- Prevents duplicate emails on page refresh

### Email Sending Logic

1. **Check if Email Already Sent**
   - Checks sessionStorage for payment intent ID
   - If already sent, skips email sending

2. **Send Email**
   - Calls `/api/send-order-email` API
   - API fetches payment intent from Stripe
   - API sends order confirmation email

3. **Handle Results**
   - On success: Shows success toast
   - On failure: Still shows success (payment already succeeded)

### Cleanup

After email is sent (or attempted):

1. **Clear localStorage** (after 10 seconds):
   - Removes `checkout_customer_email`
   - Removes `checkout_first_name`
   - Removes `checkout_last_name`

2. **Clear Payment Store**:
   - Clears payment intent from Zustand store

---

## API Endpoints

### Summary of All APIs Used in Checkout

| Endpoint | Method | Auth | Purpose | Called From |
|----------|--------|------|---------|-------------|
| `/api/create-payment-intent` | POST | No | Create Stripe Payment Intent | Checkout page |
| `/api/update-payment-intent` | POST | No | Update Payment Intent amount | Checkout page (shipping selection) |
| `/api/get-shipping-rate` | POST | No | Get shipping rate details | Checkout page (shipping rates) |
| `/api/send-order-email` | POST | No | Send order confirmation email | Payment success page |
| `/api/orders` | POST | Optional | **Create order in database** | ⚠️ **NOT YET IMPLEMENTED** |

---

## Type Definitions

### Checkout Page Types

```typescript
// Cart Item (from cartStore)
interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

// Payment Intent Creation Request
interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  fxQuoteId?: string | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  metadata: {
    userId: string;
    customerEmail: string;
    customerName: string;
    customerCurrency: string;
    baseAmountGBP: string;
  };
}

// Payment Intent Creation Response
interface CreatePaymentIntentResponse {
  success: boolean;
  clientSecret: string;
  paymentIntentId: string;
  error?: string;
}

// Shipping Rate Request
interface GetShippingRateRequest {
  rateId: string;
}

// Shipping Rate Response
interface GetShippingRateResponse {
  amount: number;        // In cents
  currency: string;
  displayName: string;
}

// Update Payment Intent Request
interface UpdatePaymentIntentRequest {
  paymentIntentId: string;
  amount: number;
  currency: string;
}

// Send Order Email Request
interface SendOrderEmailRequest {
  paymentIntentId: string;
  customerEmail: string;
  customerName: string;
}

// Send Order Email Response
interface SendOrderEmailResponse {
  success: boolean;
  message?: string;
  orderId?: string;
}
```

### Order Types (from Backend API Documentation)

```typescript
// Order Item
interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  total: number;
}

// Address
interface Address {
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

// Shipping Info (extends Address)
interface ShippingInfo extends Address {
  method: string;
  cost: number;
  trackingNumber?: string;
}

// Payment Info
interface PaymentInfo {
  method: string;
  status: "pending" | "paid" | "failed" | "refunded";
  transactionId?: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
}

// Totals
interface Totals {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

// Complete Order
interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  items: OrderItem[];
  shipping: ShippingInfo;
  billing: Address;
  payment: PaymentInfo;
  totals: Totals;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}
```

### Create Order Request (for POST /api/orders)

```typescript
interface CreateOrderRequest {
  items: OrderItem[];
  shipping: ShippingInfo;
  billing: Address;
  payment: PaymentInfo;
  totals: Totals;
  notes?: string;
}

// Response
interface CreateOrderResponse {
  item: Order;
}
```

---

## Data Flow Diagrams

### Complete Checkout Flow

```
User clicks "Checkout" from Cart
    ↓
Checkout Page Loads
    ↓
[Check Cart Empty?] → Yes → Redirect to /cart
    ↓ No
[User Authenticated?] → No → Show Checkout Options
    ↓ Yes                          ↓
Detect Location/Currency          User Selects: Sign In or Guest
    ↓                              ↓
Fetch FX Quote (if not GBP)    Redirect to /login OR Continue as Guest
    ↓
Create Payment Intent → POST /api/create-payment-intent
    ↓
Fetch Shipping Rates → POST /api/get-shipping-rate (for each rate)
    ↓
User Fills Form:
  - Shipping Address (Stripe AddressElement)
  - Shipping Method (Select from rates)
  - Payment Details (Stripe PaymentElement)
    ↓
User Clicks "Complete Order"
    ↓
[Update Payment Intent] (if shipping selected) → POST /api/update-payment-intent
    ↓
Store Customer Info (localStorage + Zustand)
    ↓
stripe.confirmPayment()
    ↓
[Payment Status?]
    ├─ succeeded → Redirect to /payment-success
    ├─ requires_action → Stripe handles (3D Secure, etc.)
    └─ failed → Show error message
```

### Payment Success Flow

```
User arrives at /payment-success
    ↓
Get Payment Intent ID (from store or URL)
    ↓
Clean up URL parameters (security)
    ↓
[Payment Store Hydrated?] → No → Wait
    ↓ Yes
[Email Already Sent?] (sessionStorage) → Yes → Skip email
    ↓ No
Clear Cart (useCartStore.clearCart())
    ↓
Wait 2 seconds (ensure payment processed)
    ↓
Send Order Email → POST /api/send-order-email
    ↓
[Email Sent Successfully?]
    ├─ Yes → Mark as sent (sessionStorage) → Show success toast
    └─ No → Show success toast anyway (payment succeeded)
    ↓
Clean up (after 10 seconds):
  - Clear localStorage
  - Clear payment store
```

---

## Current Implementation Status

### ✅ Implemented

1. **Checkout Page**
   - Cart validation
   - User authentication handling
   - Currency detection and FX quotes
   - Payment Intent creation
   - Shipping rate fetching
   - Payment Intent updating
   - Stripe Elements integration
   - Payment confirmation

2. **Payment Processing**
   - Stripe Payment Intent creation
   - Multi-currency support
   - Payment confirmation
   - Payment status checking

3. **Payment Success Page**
   - Payment Intent retrieval
   - Cart clearing
   - Order confirmation email sending
   - Duplicate prevention
   - Cleanup logic

### ⚠️ Missing Implementation

#### **Order Creation in Database**

**Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- Orders are **NOT** being saved to the database via `POST /api/orders`
- Currently, only emails are sent after payment
- No order records are created in the database

**What Should Happen:**

After payment succeeds, the system should:

1. **Retrieve Payment Intent from Stripe**
   - Get payment intent details (amount, currency, status)
   - Extract shipping address from payment intent
   - Extract billing address from payment intent

2. **Build Order Object**
   - Map cart items to order items
   - Extract shipping information
   - Extract billing information
   - Calculate totals
   - Include payment information (Stripe Payment Intent ID, status)

3. **Create Order via API**
   - Call `POST /api/orders` with order data
   - Include authentication token if user is logged in
   - Handle response (order ID, order number)

4. **Update Email Sending**
   - Include order information in confirmation email
   - Reference order number in email

**Where to Implement:**

The order creation should happen in one of these places:

1. **Option A: Payment Success Page** (Recommended)
   - After payment intent is confirmed
   - Before or after email sending
   - File: `app/(site)/payment-success/page.tsx`

2. **Option B: Backend API (`/api/send-order-email`)**
   - In the email sending endpoint
   - Create order before sending email
   - This ensures order is created even if frontend fails

3. **Option C: Stripe Webhook**
   - Handle `payment_intent.succeeded` event
   - Create order in webhook handler
   - Most reliable (works even if user closes browser)

**Required Data for Order Creation:**

```typescript
// Data needed from Payment Intent (retrieved from Stripe)
interface PaymentIntentData {
  id: string;                          // Payment Intent ID
  amount: number;                      // Amount in cents
  currency: string;                    // Currency code
  status: string;                      // Payment status
  shipping?: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    phone?: string;
  };
  // Billing address from payment method
}

// Order creation request
const createOrderRequest: CreateOrderRequest = {
  items: cartItems.map(item => ({
    productId: item.id,
    productName: item.name,
    productImage: item.image,
    price: item.price,
    quantity: item.quantity,
    total: item.price * item.quantity,
  })),
  shipping: {
    // Extract from Payment Intent shipping
    firstName: shipping.name.split(' ')[0],
    lastName: shipping.name.split(' ').slice(1).join(' '),
    address1: shipping.address.line1,
    address2: shipping.address.line2,
    city: shipping.address.city,
    state: shipping.address.state,
    postalCode: shipping.address.postal_code,
    country: shipping.address.country,
    phone: shipping.phone,
    method: selectedShippingMethod,  // From checkout
    cost: shippingCost,
  },
  billing: {
    // Extract from Payment Intent billing details
    // (similar to shipping)
  },
  payment: {
    method: 'card',  // Or detect from payment method
    status: 'paid',
    stripePaymentIntentId: paymentIntentId,
  },
  totals: {
    subtotal: cartSubtotal,
    shipping: shippingCost,
    tax: 0,  // Calculate if needed
    discount: 0,
    total: totalAmount,
  },
};
```

**Implementation Checklist:**

- [ ] Create order service function (`services/backend/orders.ts`)
- [ ] Add `createOrder` function to call `POST /api/orders`
- [ ] Retrieve Payment Intent from Stripe (to get shipping/billing addresses)
- [ ] Map cart items to order items format
- [ ] Extract shipping address from Payment Intent
- [ ] Extract billing address from Payment Intent
- [ ] Calculate totals correctly
- [ ] Call order creation API
- [ ] Handle errors (payment succeeded but order creation failed)
- [ ] Update email to include order number
- [ ] Test with authenticated users
- [ ] Test with guest checkout
- [ ] Test error scenarios

---

## Additional Notes

### Currency Handling

- Base prices are stored in GBP
- FX quotes are fetched for non-GBP currencies
- Payment Intent amounts are converted to customer's currency
- Shipping costs are converted using exchange rate
- Totals are calculated in customer's currency

### Guest vs Authenticated Checkout

- **Authenticated Users:**
  - User email comes from `useAuthStore`
  - Order will be associated with `userId`
  - Order can be retrieved via `GET /api/orders/my`

- **Guest Users:**
  - Email is collected in checkout form
  - Order will have `userId: null`
  - Order can only be accessed by admins

### Error Handling

- Payment Intent creation failures: Show error toast, allow retry
- Payment confirmation failures: Show error message, allow retry
- Email sending failures: Show success anyway (payment succeeded)
- Order creation failures: ⚠️ **Not yet implemented** (should show error and allow retry)

### Security Considerations

- Payment Intent client secrets are not stored in URLs
- Customer info is stored in Zustand store (client-side only)
- URL parameters are cleaned up immediately
- Payment Intent IDs are used instead of sensitive data

---

## Related Documentation

- [Backend Orders API Documentation](./backend-orders-api.md)
- [Backend API Guide](./BACKEND_API_GUIDE.md)
- [Email Troubleshooting](./EMAIL_TROUBLESHOOTING.md)

---

**Last Updated:** 2025-01-17
