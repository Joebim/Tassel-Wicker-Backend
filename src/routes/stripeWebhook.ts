import type { RequestHandler } from "express";
import { env } from "../config/env";
import { getStripe } from "../services/stripeClient";
import { sendEmail } from "../services/emailService";
import { createOrderConfirmationEmailTemplate, createPaymentConfirmationEmailTemplate } from "../services/emailTemplates";
import { OrderModel } from "../models/Order";

export const stripeWebhookHandler: RequestHandler = async (req, res) => {
  const signature = req.header("stripe-signature");
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ success: false, error: "Missing webhook configuration" });
  }

  const stripe = getStripe();
  let event: any;
  try {
    // Body is a Buffer (mounted with express.raw)
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ success: false, error: "Webhook signature verification failed" });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as any;
    const metadata = paymentIntent.metadata || {};
    const items = metadata.items ? JSON.parse(metadata.items) : [];
    const customerEmail =
      paymentIntent.receipt_email || paymentIntent.billing_details?.email || metadata.customerEmail || "";
    const customerName = metadata.customerName || paymentIntent.billing_details?.name || "Valued Customer";
    const orderId = paymentIntent.id;
    const currency = (metadata.currency || paymentIntent.currency || "gbp").toUpperCase();
    const divisor = currency === "JPY" ? 1 : 100;
    const totalAmount = (paymentIntent.amount || 0) / divisor;

    const shippingAddress = paymentIntent.shipping
      ? {
          name: paymentIntent.shipping.name || customerName,
          address: paymentIntent.shipping.address?.line1 || "",
          city: paymentIntent.shipping.address?.city || "",
          postalCode: paymentIntent.shipping.address?.postal_code || "",
          country: paymentIntent.shipping.address?.country || "",
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
      customerName,
      customerEmail,
      items: orderItems,
      totalAmount,
      currency,
      shippingAddress,
      paymentMethod: paymentIntent.payment_method_types?.[0] || "card",
      orderDate: new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }),
    };

    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: `Order Confirmation - Order #${orderId.substring(3, 13)}`,
        html: createOrderConfirmationEmailTemplate(orderDetails),
      });
      await sendEmail({
        to: customerEmail,
        subject: `Payment Confirmation - Order #${orderId.substring(3, 13)}`,
        html: createPaymentConfirmationEmailTemplate(orderDetails),
      });
    }

    const adminEmail = env.ADMIN_EMAIL || env.SMTP_FROM;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New Order Received - Order #${orderId.substring(3, 13)}`,
        html: `<h2>New Order Received</h2><p><strong>Order ID:</strong> ${orderId}</p><p><strong>Customer:</strong> ${customerName} (${customerEmail || "No email"})</p><p><strong>Total:</strong> ${currency} ${totalAmount.toFixed(
          2
        )}</p><p><strong>Items:</strong> ${orderItems.length}</p>`,
      });
    }

    // Persist an order record keyed by Stripe payment intent id
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
          "payment.method": paymentIntent.payment_method_types?.[0] || "card",
          "payment.paidAt": new Date(),
          "payment.stripePaymentIntentId": paymentIntent.id,
        },
      },
      { upsert: true }
    );

    return res.json({ success: true, message: "Event processed", orderId });
  }

  return res.json({ success: true, message: `Event ${event.type} received` });
};


