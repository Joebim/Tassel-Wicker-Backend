## Tassel & Wicker Backend (Express + TypeScript + MongoDB)

This repo now contains a full backend API at the repo root, and the copied Next frontend inside `tassel-wicker-next/` for reference.

### Requirements

- Node.js 18+ (Node 20+ recommended)
- MongoDB (local or Atlas)

### Setup

- **1) Install**

```bash
npm install
```

- **2) Create env file**

Create `.env` in the repo root (copy from `env.example`) and fill values.

Minimum required:
- `MONGODB_URI`
- `JWT_ACCESS_SECRET` (>= 16 chars)
- `JWT_REFRESH_SECRET` (>= 16 chars)

For payments/emails:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY` (emails)
- `SYSTEME_API_KEY` (newsletter)

- **3) Run**

```bash
npm run dev
```

### Health checks

- `GET /health`
- `GET /api/health`

### Auth API (JWT)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me` (Bearer token)
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Store API

- **Categories**
  - `GET /api/categories`
  - `POST /api/categories` (admin/moderator)
  - `PUT /api/categories/:id` (admin/moderator)
  - `DELETE /api/categories/:id` (admin)

- **Products**
  - `GET /api/products` (supports `page`, `limit`, `search`, `categoryId`, `featured`, `inStock`)
  - `POST /api/products` (admin/moderator)
  - `PUT /api/products/:id` (admin/moderator)
  - `DELETE /api/products/:id` (admin)

- **Orders**
  - `POST /api/orders` (optional auth)
  - `GET /api/orders/my` (auth)
  - `GET /api/orders/:id` (auth, owner/admin)
  - `GET /api/orders/admin/list` (admin/moderator)
  - `PATCH /api/orders/admin/:id` (admin/moderator)

### Stripe + Email + Newsletter (compat routes)

These mirror the existing Next calls so you can swap the frontend over with minimal changes:

- `POST /api/create-payment-intent`
- `POST /api/update-payment-intent`
- `POST /api/create-checkout-session`
- `POST /api/get-shipping-rate`
- `GET/POST /api/fx-quote`
- `POST /api/send-order-email`
- `POST /api/contact`
- `POST /api/newsletter`
- `GET/POST /api/test-email`
- `POST /api/webhooks/stripe` (**raw body**; Stripe signature verified)

### Notes

- `POST /api/webhooks/stripe` and `POST /api/send-order-email` both upsert a minimal `Order` record keyed by `payment.stripePaymentIntentId` so orders can be managed server-side.


