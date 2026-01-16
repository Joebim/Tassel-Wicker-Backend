# Frontend API Integration Updates

These are the recent changes to the backend API that may require updates or provide new functionality for the frontend application.

## 1. Swagger API Documentation

We now have interactive API documentation available.

- **URL**: `http://localhost:4000/api-docs`
- **JSON Spec**: `http://localhost:4000/api-docs.json`
- **Use Case**: Reference this to see all available endpoints, required request bodies, and example responses.

## 2. Order ID System

The backend now generates and uses a unique, human-readable Order ID (e.g., `TW-M2KJ3L-A1B2C3D4`) instead of relying on the Stripe Payment Intent ID for emails and record keeping.

- **Changes**:
  - The `Order` object now explicitly includes an `orderId` field.
  - `orderId` is an alias for `orderNumber`.
  - **Frontend Action**: When displaying order confirmation screens or order history, use the `orderId` field for display to the user.

## 3. Multi-Currency Support

Orders now explicitly store and use the currency selected during the checkout process.

- **Request Updates**:
  - `POST /api/orders`: You can now optionally send a `currency` field (string, e.g., "USD", "GBP"). It defaults to "GBP".
- **Response Updates**:
  - The `Order` object now returns a `currency` field.
- **Emails**: Confirmation emails now automatically use the correct currency symbol ($, £, €, etc.) based on this field.

## 4. Custom Basket Stability (Cart Merge)

Fixed a bug where merging a guest cart with a "Custom Basket" (productId: `"custom"`) would fail.

- **Status**: No frontend changes required.
- **Result**: Guest carts with custom baskets will now successfully merge into the user's account upon login.

## 5. Stripe MetaData Update

When creating a Payment Intent or Checkout Session manually via the backend:

- The backend now injects a `orderNumber` into the Stripe metadata immediately.
- This ensures that if the user closes the window, the Webhook can still generate the correct order record using the human-readable ID.
