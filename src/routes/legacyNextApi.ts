import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate";
import { ApiError } from "../middleware/errorHandler";
import { env } from "../config/env";
import { getStripe } from "../services/stripeClient";
import { sendEmail } from "../services/emailService";
import {
  createContactFormEmailTemplate,
  createOrderConfirmationEmailTemplate,
  createPaymentConfirmationEmailTemplate,
} from "../services/emailTemplates";
import { OrderModel } from "../models/Order";

export const legacyNextApiRouter = Router();

// --------- /api/create-payment-intent
const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional().default("gbp"),
  items: z.any().optional(),
  metadata: z.record(z.any()).optional(),
  fxQuoteId: z.string().optional(),
});

legacyNextApiRouter.post(
  "/create-payment-intent",
  validateBody(createPaymentIntentSchema),
  async (req, res) => {
    const { amount, currency, items, metadata, fxQuoteId } = req.body as z.infer<
      typeof createPaymentIntentSchema
    >;

    const divisor = currency.toLowerCase() === "jpy" ? 1 : 100;
    const amountInSmallestUnit = Math.round(amount * divisor);

    if (!env.STRIPE_SECRET_KEY) throw new ApiError(500, "STRIPE_SECRET_KEY is not set", "ConfigError");

    if (fxQuoteId) {
      const formData = new URLSearchParams();
      formData.append("amount", amountInSmallestUnit.toString());
      formData.append("currency", currency.toLowerCase());
      formData.append("fx_quote", fxQuoteId);
      formData.append("automatic_payment_methods[enabled]", "true");
      formData.append("automatic_payment_methods[allow_redirects]", "always");

      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          formData.append(`metadata[${key}]`, String(value));
        });
        if (items) formData.append("metadata[items]", JSON.stringify(items));
        formData.append("metadata[originalAmount]", amount.toString());
        formData.append("metadata[currency]", currency.toLowerCase());
      }

      const response = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Stripe-Version": "2025-10-29.clover;fx_quote_preview=v1",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new ApiError(500, errorData?.error?.message || "Stripe error", "StripeError");
      }

      const paymentIntent = (await response.json()) as any;
      return res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true, allow_redirects: "always" },
      metadata: {
        ...(metadata || {}),
        items: JSON.stringify(items || []),
        originalAmount: amount.toString(),
        currency: currency.toLowerCase(),
      },
    } as any);

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  }
);

// --------- /api/update-payment-intent
const updatePaymentIntentSchema = z.object({
  paymentIntentId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().optional().default("gbp"),
});

legacyNextApiRouter.post(
  "/update-payment-intent",
  validateBody(updatePaymentIntentSchema),
  async (req, res) => {
    const { paymentIntentId, amount, currency } = req.body as z.infer<typeof updatePaymentIntentSchema>;
    const divisor = currency.toLowerCase() === "jpy" ? 1 : 100;
    const amountInSmallestUnit = Math.round(amount * divisor);
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.update(paymentIntentId, { amount: amountInSmallestUnit });
    res.json({ success: true, clientSecret: paymentIntent.client_secret, amount: paymentIntent.amount });
  }
);

// --------- /api/create-checkout-session
const checkoutSchema = z.object({
  amount: z.number().positive(),
  items: z.array(z.any()).default([]),
  metadata: z.record(z.any()).optional(),
  customerEmail: z.string().email().optional(),
});

legacyNextApiRouter.post("/create-checkout-session", validateBody(checkoutSchema), async (req, res) => {
  const { items, metadata, customerEmail } = req.body as z.infer<typeof checkoutSchema>;
  const stripe = getStripe();

  const shippingRates = [
    "shr_1SY6XKDqrk2AVTntaI2Qcu4V",
    "shr_1SY6VyDqrk2AVTnto4PrPyL3",
    "shr_1SY658Dqrk2AVTnt4LEtyBhH",
  ];

  const lineItems = items.map((item: any) => ({
    price_data: {
      currency: "gbp",
      product_data: { name: item.name },
      unit_amount: Math.round((item.price || 0) * 100),
    },
    quantity: item.quantity || 1,
  }));

  const origin = req.header("origin") || "https://tasselandwicker.com";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    shipping_address_collection: {
      allowed_countries: [
        "US","CA","GB","AU","NZ","DE","FR","IT","ES","NL","BE","AT","CH","IE","PT","GR","FI","SE","DK","NO","PL","CZ","HU","RO","BG","HR","SK","SI","LT","LV","EE","LU","MT","CY",
        "JP","KR","CN","SG","MY","TH","ID","PH","VN","IN",
        "ZA","NG","KE","EG",
        "BR","MX","AR","CL","CO","PE",
      ],
    },
    shipping_options: shippingRates.map((rateId) => ({ shipping_rate: rateId })),
    success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout`,
    customer_email: customerEmail,
    metadata: {
      ...(metadata || {}),
      items: JSON.stringify(items || []),
      originalAmount: String(req.body.amount),
      currency: "gbp",
    },
  });

  res.json({ sessionId: session.id, url: session.url });
});

// --------- /api/get-shipping-rate
const shippingRateSchema = z.object({ rateId: z.string().min(1) });
legacyNextApiRouter.post("/get-shipping-rate", validateBody(shippingRateSchema), async (req, res) => {
  const { rateId } = req.body as z.infer<typeof shippingRateSchema>;
  const stripe = getStripe();
  const shippingRate = await stripe.shippingRates.retrieve(rateId);
  res.json({
    id: shippingRate.id,
    amount: shippingRate.fixed_amount?.amount || 0,
    currency: shippingRate.fixed_amount?.currency || "gbp",
    displayName: shippingRate.display_name,
  });
});

// --------- /api/fx-quote
const CURRENCIES_ONLY_NONE = new Set(["ngn", "zar"]);
function getLockDuration(fromCurrencies: string[], requestedDuration = "hour") {
  const hasRestricted = fromCurrencies.some((c) => CURRENCIES_ONLY_NONE.has(c.toLowerCase()));
  return hasRestricted ? "none" : requestedDuration;
}

const fxQuotePostSchema = z.object({
  toCurrency: z.string().optional().default("gbp"),
  fromCurrencies: z.array(z.string()).nonempty().optional().default(["usd", "eur", "cad", "aud", "jpy"]),
  lockDuration: z.string().optional().default("hour"),
});

legacyNextApiRouter.post("/fx-quote", validateBody(fxQuotePostSchema), async (req, res) => {
  if (!env.STRIPE_SECRET_KEY) throw new ApiError(500, "STRIPE_SECRET_KEY is not set", "ConfigError");
  const { toCurrency, fromCurrencies, lockDuration } = req.body as z.infer<typeof fxQuotePostSchema>;

  const effective = getLockDuration(fromCurrencies, lockDuration);
  const formData = new URLSearchParams();
  formData.append("to_currency", toCurrency.toLowerCase());
  fromCurrencies.forEach((c) => formData.append("from_currencies[]", c.toLowerCase()));
  formData.append("lock_duration", effective);

  const response = await fetch("https://api.stripe.com/v1/fx_quotes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2025-10-29.clover;fx_quote_preview=v1",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorData: any = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new ApiError(400, errorData?.error?.message || "FX quote error", "StripeError");
  }

  const fxQuote = (await response.json()) as any;
  res.json({
    success: true,
    fxQuote: {
      id: fxQuote.id,
      toCurrency: fxQuote.to_currency,
      lockDuration: fxQuote.lock_duration,
      lockExpiresAt: fxQuote.lock_expires_at,
      lockStatus: fxQuote.lock_status,
      rates: fxQuote.rates,
    },
  });
});

legacyNextApiRouter.get("/fx-quote", async (req, res) => {
  const quoteId = typeof req.query.id === "string" ? req.query.id : "";
  if (!quoteId) throw new ApiError(400, "FX quote ID is required", "BadRequest");
  if (!env.STRIPE_SECRET_KEY) throw new ApiError(500, "STRIPE_SECRET_KEY is not set", "ConfigError");

  const response = await fetch(`https://api.stripe.com/v1/fx_quotes/${quoteId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Stripe-Version": "2025-10-29.clover;fx_quote_preview=v1",
    },
  });

  if (!response.ok) {
    const errorData: any = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new ApiError(400, errorData?.error?.message || "FX quote error", "StripeError");
  }

  const fxQuote = (await response.json()) as any;
  res.json({
    success: true,
    fxQuote: {
      id: fxQuote.id,
      toCurrency: fxQuote.to_currency,
      lockDuration: fxQuote.lock_duration,
      lockExpiresAt: fxQuote.lock_expires_at,
      lockStatus: fxQuote.lock_status,
      rates: fxQuote.rates,
    },
  });
});

// --------- /api/contact
const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

legacyNextApiRouter.post("/contact", validateBody(contactSchema), async (req, res) => {
  const { name, email, message } = req.body as z.infer<typeof contactSchema>;

  const recipientEmail =
    env.CONTACT_FORM_RECIPIENT || env.ADMIN_EMAIL || env.SMTP_FROM || "info@tasselandwicker.com";

  const emailResult = await sendEmail({
    to: recipientEmail,
    replyTo: email,
    subject: `New Contact Form Submission from ${name}`,
    html: createContactFormEmailTemplate({ name, email, message }),
  });

  if (!emailResult.success) {
    throw new ApiError(500, emailResult.error || "Failed to send email", "EmailError");
  }

  res.json({ success: true, message: "Contact form submitted successfully", emailId: emailResult.messageId });
});

// --------- /api/newsletter (Systeme.io)
const newsletterSchema = z.object({
  email: z.string().email(),
  locale: z.string().optional().default("en"),
  fields: z
    .array(z.object({ slug: z.string().min(1), value: z.string().min(1) }))
    .optional()
    .default([]),
});

legacyNextApiRouter.post("/newsletter", validateBody(newsletterSchema), async (req, res) => {
  const { email, locale, fields } = req.body as z.infer<typeof newsletterSchema>;

  if (!env.SYSTEME_API_KEY) {
    throw new ApiError(500, "Newsletter service is not configured (SYSTEME_API_KEY missing)", "ConfigError");
  }

  const apiUrl = "https://api.systeme.io/api/contacts";
  const contactData: any = {
    email: email.trim().toLowerCase(),
    locale: locale || "en",
    ...(fields && fields.length > 0 ? { fields } : {}),
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.SYSTEME_API_KEY,
      Accept: "application/json",
    },
    body: JSON.stringify(contactData),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    if (response.status === 409) {
      return res.status(409).json({ success: false, error: "This email is already subscribed to our newsletter." });
    }
    throw new ApiError(response.status, errorText || "Newsletter subscription failed", "NewsletterError");
  }

  const data = (await response.json()) as any;
  res.json({
    success: true,
    message: "Successfully subscribed to newsletter!",
    data: {
      id: data.id,
      email: data.email,
      registeredAt: data.registeredAt,
      needsConfirmation: data.needsConfirmation,
    },
  });
});

// --------- /api/test-email (basic echo)
legacyNextApiRouter.get("/test-email", (_req, res) => {
  res.json({ success: true, message: "Test endpoint is working", timestamp: new Date().toISOString() });
});
legacyNextApiRouter.post("/test-email", async (req, res) => {
  res.json({ success: true, message: "Test POST endpoint is working", received: req.body, timestamp: new Date().toISOString() });
});

// --------- /api/send-order-email
const sendOrderEmailSchema = z.object({
  paymentIntentId: z.string().min(1),
  customerEmail: z.string().email(),
  customerName: z.string().optional(),
});

legacyNextApiRouter.post("/send-order-email", validateBody(sendOrderEmailSchema), async (req, res) => {
  const { paymentIntentId, customerEmail, customerName } = req.body as z.infer<typeof sendOrderEmailSchema>;
  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== "succeeded") {
    return res.status(400).json({ success: false, error: `Payment status is ${paymentIntent.status}, not succeeded` });
  }

  const metadata: any = paymentIntent.metadata || {};
  const items = metadata.items ? JSON.parse(metadata.items) : [];
  const orderId = paymentIntent.id;
  const currency = (metadata.currency || paymentIntent.currency || "gbp").toUpperCase();
  const divisor = currency === "JPY" ? 1 : 100;
  const totalAmount = (paymentIntent.amount || 0) / divisor;

  const shippingAddress = (paymentIntent as any).shipping
    ? {
        name: (paymentIntent as any).shipping.name || customerName || "Customer",
        address: (paymentIntent as any).shipping.address?.line1 || "",
        city: (paymentIntent as any).shipping.address?.city || "",
        postalCode: (paymentIntent as any).shipping.address?.postal_code || "",
        country: (paymentIntent as any).shipping.address?.country || "",
      }
    : undefined;

  const orderItems = (items || []).map((item: any) => ({
    id: item.id || "unknown",
    name: item.name || "Unknown Item",
    quantity: item.quantity || 1,
    price: item.price || 0,
  }));

  const orderDetails = {
    orderId,
    customerName: customerName || metadata.customerName || "Valued Customer",
    customerEmail,
    items: orderItems,
    totalAmount,
    currency,
    shippingAddress,
    paymentMethod: (paymentIntent as any).payment_method_types?.[0] || "card",
    orderDate: new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }),
  };

  const orderEmailResult = await sendEmail({
    to: customerEmail,
    subject: `Order Confirmation - Order #${orderId.substring(3, 13)}`,
    html: createOrderConfirmationEmailTemplate(orderDetails),
  });

  if (!orderEmailResult.success) {
    return res.status(500).json({ success: false, error: orderEmailResult.error || "Failed to send order confirmation email" });
  }

  const paymentEmailResult = await sendEmail({
    to: customerEmail,
    subject: `Payment Confirmation - Order #${orderId.substring(3, 13)}`,
    html: createPaymentConfirmationEmailTemplate(orderDetails),
  });

  // Upsert a minimal order record keyed by Stripe payment intent
  await OrderModel.updateOne(
    { "payment.stripePaymentIntentId": paymentIntent.id },
    {
      $setOnInsert: {
        orderNumber: `PI-${paymentIntent.id}`,
        status: "confirmed",
        items: (items || []).map((it: any) => ({
          productId: it.id || "unknown",
          productName: it.name || "Unknown Item",
          productImage: it.image || "",
          price: it.price || 0,
          quantity: it.quantity || 1,
          total: (it.price || 0) * (it.quantity || 1),
        })),
        totals: { subtotal: totalAmount, shipping: 0, tax: 0, discount: 0, total: totalAmount },
      },
      $set: {
        status: "confirmed",
        "payment.status": "paid",
        "payment.method": orderDetails.paymentMethod || "card",
        "payment.paidAt": new Date(),
        "payment.stripePaymentIntentId": paymentIntent.id,
      },
    },
    { upsert: true }
  );

  res.json({
    success: true,
    message: "Order confirmation emails sent successfully",
    orderId,
    orderEmailMessageId: orderEmailResult.messageId,
    paymentEmailMessageId: paymentEmailResult.success ? paymentEmailResult.messageId : undefined,
  });
});


