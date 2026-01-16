import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate";
import { ApiError } from "../middleware/errorHandler";
import { env } from "../config/env";
import { getStripe } from "../services/stripeClient";
import { sendEmail } from "../services/emailService";
import {
  createOrderConfirmationEmailTemplate,
  createPaymentConfirmationEmailTemplate,
} from "../services/emailTemplates";
import { OrderModel } from "../models/Order";
import { generateOrderNumber } from "../utils/orderNumber";

export const checkoutRouter = Router();

// --------- POST /api/create-payment-intent
const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional().default("gbp"),
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().nonnegative(),
      })
    )
    .optional(),
  metadata: z.record(z.any()).optional(),
  fxQuoteId: z.string().nullable().optional(),
});

/**
 * @openapi
 * /api/create-payment-intent:
 *   post:
 *     tags: [Checkout]
 *     summary: Create a Stripe payment intent
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number }
 *               currency: { type: string, default: gbp }
 *               fxQuoteId: { type: string }
 *     responses:
 *       200:
 *         description: Payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret: { type: string }
 *                 paymentIntentId: { type: string }
 */
checkoutRouter.post(
  "/create-payment-intent",
  validateBody(createPaymentIntentSchema),
  async (req, res) => {
    try {
      const { amount, currency, items, metadata, fxQuoteId } =
        req.body as z.infer<typeof createPaymentIntentSchema>;

      const divisor = currency.toLowerCase() === "jpy" ? 1 : 100;
      const amountInSmallestUnit = Math.round(amount * divisor);

      if (!env.STRIPE_SECRET_KEY) {
        throw new ApiError(500, "STRIPE_SECRET_KEY is not set", "ConfigError");
      }

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
          formData.append("metadata[orderNumber]", generateOrderNumber());
        }

        const response = await fetch(
          "https://api.stripe.com/v1/payment_intents",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
              "Content-Type": "application/x-www-form-urlencoded",
              "Stripe-Version": "2025-10-29.clover;fx_quote_preview=v1",
            },
            body: formData.toString(),
          }
        );

        if (!response.ok) {
          const errorData: any = await response
            .json()
            .catch(() => ({ error: { message: response.statusText } }));
          return res.status(500).json({
            success: false,
            error:
              errorData?.error?.message || "Failed to create payment intent",
          });
        }

        const paymentIntent = (await response.json()) as any;
        return res.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
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
          orderNumber: generateOrderNumber(),
        },
      } as any);

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to create payment intent",
      });
    }
  }
);

// --------- POST /api/update-payment-intent
const updatePaymentIntentSchema = z.object({
  paymentIntentId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().optional().default("gbp"),
});

checkoutRouter.post(
  "/update-payment-intent",
  validateBody(updatePaymentIntentSchema),
  async (req, res) => {
    try {
      const { paymentIntentId, amount, currency } = req.body as z.infer<
        typeof updatePaymentIntentSchema
      >;
      const divisor = currency.toLowerCase() === "jpy" ? 1 : 100;
      const amountInSmallestUnit = Math.round(amount * divisor);
      const stripe = getStripe();
      await stripe.paymentIntents.update(paymentIntentId, {
        amount: amountInSmallestUnit,
      });
      res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to update payment intent",
      });
    }
  }
);

// --------- POST /api/get-shipping-rate
const shippingRateSchema = z.object({
  rateId: z.string().min(1),
});

checkoutRouter.post(
  "/get-shipping-rate",
  validateBody(shippingRateSchema),
  async (req, res) => {
    try {
      const { rateId } = req.body as z.infer<typeof shippingRateSchema>;
      const stripe = getStripe();
      const shippingRate = await stripe.shippingRates.retrieve(rateId);
      res.json({
        amount: shippingRate.fixed_amount?.amount || 0,
        currency: shippingRate.fixed_amount?.currency || "gbp",
        displayName: shippingRate.display_name,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve shipping rate",
      });
    }
  }
);

// --------- POST /api/send-order-email
const sendOrderEmailSchema = z.object({
  paymentIntentId: z.string().min(1),
  customerEmail: z.string().email(),
  customerName: z.string().optional(),
});

checkoutRouter.post(
  "/send-order-email",
  validateBody(sendOrderEmailSchema),
  async (req, res) => {
    console.log(
      "Send Order Email (Checkout) - Request Body:",
      JSON.stringify(req.body, null, 2)
    );
    console.log(
      "Send Order Email (Checkout) - req.auth.userId:",
      req.auth?.userId
    );

    const { paymentIntentId, customerEmail, customerName } =
      req.body as z.infer<typeof sendOrderEmailSchema>;
    const stripe = getStripe();

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          success: false,
          message: `Payment status is ${paymentIntent.status}, not succeeded`,
        });
      }

      const metadata: any = paymentIntent.metadata || {};
      const items = metadata.items ? JSON.parse(metadata.items) : [];
      const orderNumber = metadata.orderNumber || generateOrderNumber();
      const orderIdForEmail = orderNumber; // Use orderNumber for emails
      const currency = (
        metadata.currency ||
        paymentIntent.currency ||
        "gbp"
      ).toUpperCase();
      const divisor = currency === "JPY" ? 1 : 100;
      const totalAmount = (paymentIntent.amount || 0) / divisor;

      const shippingAddress = (paymentIntent as any).shipping
        ? {
            name:
              (paymentIntent as any).shipping.name ||
              customerName ||
              "Customer",
            address: (paymentIntent as any).shipping.address?.line1 || "",
            city: (paymentIntent as any).shipping.address?.city || "",
            postalCode:
              (paymentIntent as any).shipping.address?.postal_code || "",
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
        orderId: orderNumber, // Use orderNumber as orderId in templates
        stripePaymentIntentId: paymentIntent.id,
        customerName:
          customerName || metadata.customerName || "Valued Customer",
        customerEmail,
        items: orderItems,
        totalAmount,
        currency,
        shippingAddress,
        paymentMethod:
          (paymentIntent as any).payment_method_types?.[0] || "card",
        orderDate: new Date().toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };

      const orderEmailResult = await sendEmail({
        to: customerEmail,
        subject: `Order Confirmation - Order #${orderNumber}`,
        html: createOrderConfirmationEmailTemplate(orderDetails),
      });

      if (!orderEmailResult.success) {
        return res.status(500).json({
          success: false,
          message:
            orderEmailResult.error || "Failed to send order confirmation email",
        });
      }

      await sendEmail({
        to: customerEmail,
        subject: `Payment Confirmation - Order #${orderNumber}`,
        html: createPaymentConfirmationEmailTemplate(orderDetails),
      });

      // Upsert a minimal order record keyed by Stripe payment intent
      await OrderModel.updateOne(
        { "payment.stripePaymentIntentId": paymentIntent.id },
        {
          $setOnInsert: {
            orderNumber: orderNumber,
            currency: currency,
            items: (items || []).map((it: any) => ({
              productId: it.id || "unknown",
              productName: it.name || "Unknown Item",
              productImage: it.image || "",
              price: it.price || 0,
              quantity: it.quantity || 1,
              total: (it.price || 0) * (it.quantity || 1),
            })),
            totals: {
              subtotal: totalAmount,
              shipping: 0,
              tax: 0,
              discount: 0,
              total: totalAmount,
            },
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

      // Get the created/updated order to return orderId
      const order = await OrderModel.findOne({
        "payment.stripePaymentIntentId": paymentIntent.id,
      });

      res.json({
        success: true,
        message: "Order confirmation emails sent successfully",
        orderId: orderNumber,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to send order email",
      });
    }
  }
);
