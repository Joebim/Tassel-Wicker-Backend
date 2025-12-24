/**
 * Copied/adapted from `tassel-wicker-next/lib/email-templates.ts`
 * so emails render the same after moving API routes to this backend.
 */

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod?: string;
  orderDate?: string;
}

function getBaseEmailTemplate(content: string, title?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || "Tassel & Wicker"}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif; background-color: #ffffff; color: #1a1a1a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e6e6e6;">
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; background-color: #4c062c;">
                            <img src="https://res.cloudinary.com/dtaegi6gk/image/upload/v1765738878/TASSEL_WICKER_LOGO_PRIMARY_WHITE_zusxr2.png" alt="Tassel & Wicker" style="max-width: 200px; height: auto; margin: 0 auto 20px; display: block;" />
                            ${
                              title
                                ? `<p style="margin: 10px 0 0; color: #ffffff; font-size: 14px; font-weight: 200; letter-spacing: 1px; text-transform: uppercase; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">${title}</p>`
                                : ""
                            }
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #4c062c; text-align: center;">
                            <img src="https://res.cloudinary.com/dtaegi6gk/image/upload/v1765738878/TASSEL_WICKER_LOGO_PRIMARY_WHITE_zusxr2.png" alt="Tassel & Wicker" style="max-width: 150px; height: auto; margin: 0 auto 10px; display: block; filter: brightness(0) invert(1);" />
                            <p style="margin: 5px 0 0; color: #ffffff; font-size: 11px; font-weight: 200;">
                                Wicker Gift Baskets & Lifestyle Essentials
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

export function createContactFormEmailTemplate(formData: {
  name: string;
  email: string;
  message: string;
}): string {
  const content = `
    <p style="margin: 0 0 30px; color: #1a1a1a; font-size: 16px; font-weight: 200; line-height: 1.6;">
        You have received a new message from your website contact form.
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid #e6e6e6;">
                <p style="margin: 0; color: #6b6b6b; font-size: 12px; font-weight: 200; text-transform: uppercase; letter-spacing: 1px;">
                    Full Name
                </p>
                <p style="margin: 5px 0 0; color: #1a1a1a; font-size: 16px; font-weight: 200;">
                    ${formData.name}
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid #e6e6e6;">
                <p style="margin: 0; color: #6b6b6b; font-size: 12px; font-weight: 200; text-transform: uppercase; letter-spacing: 1px;">
                    Email Address
                </p>
                <p style="margin: 5px 0 0; color: #1a1a1a; font-size: 16px; font-weight: 200;">
                    <a href="mailto:${formData.email}" style="color: #4c062c; text-decoration: none;">${formData.email}</a>
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 15px 0;">
                <p style="margin: 0; color: #6b6b6b; font-size: 12px; font-weight: 200; text-transform: uppercase; letter-spacing: 1px;">
                    Message
                </p>
                <p style="margin: 15px 0 0; color: #1a1a1a; font-size: 16px; font-weight: 200; line-height: 1.8; white-space: pre-wrap;">
                    ${formData.message}
                </p>
            </td>
        </tr>
    </table>
    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e6e6e6;">
        <p style="margin: 0; color: #6b6b6b; font-size: 12px; font-weight: 200; text-align: center;">
            This email was sent from the Tassel & Wicker contact form.
        </p>
    </div>
  `;
  return getBaseEmailTemplate(content, "New Contact Form Submission");
}

export function createOrderConfirmationEmailTemplate(order: OrderDetails): string {
  const formatPrice = (amount: number): string => `£${amount.toFixed(2)}`;
  const capitalizedName = order.customerName
    ? order.customerName.charAt(0).toUpperCase() + order.customerName.slice(1)
    : "Valued Customer";

  const itemsList = order.items
    .map(
      (item) => `
        <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid #e6e6e6;">
                <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 200;">
                    ${item.name} × ${item.quantity}
                </p>
            </td>
            <td style="padding: 15px 0; border-bottom: 1px solid #e6e6e6; text-align: right;">
                <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 200;">
                    ${formatPrice(item.price * item.quantity)}
                </p>
            </td>
        </tr>
    `
    )
    .join("");

  const shippingInfo = order.shippingAddress
    ? `
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <tr>
                <td style="padding: 15px 0; border-bottom: 1px solid #e6e6e6;">
                    <p style="margin: 0; color: #6b6b6b; font-size: 12px; font-weight: 200; text-transform: uppercase; letter-spacing: 1px; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">
                        Shipping Address
                    </p>
                    <p style="margin: 5px 0 0; color: #1a1a1a; font-size: 16px; font-weight: 200; line-height: 1.6; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">
                        ${order.shippingAddress.name}<br>
                        ${order.shippingAddress.address}<br>
                        ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}<br>
                        ${order.shippingAddress.country}
                    </p>
                </td>
            </tr>
        </table>
    `
    : "";

  const content = `
    <p style="margin: 0 0 30px; color: #1a1a1a; font-size: 16px; font-weight: 200; line-height: 1.6; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">
        Dear ${capitalizedName},
    </p>
    <p style="margin: 0 0 30px; color: #1a1a1a; font-size: 16px; font-weight: 200; line-height: 1.6; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">
        Thank you for your order! We're delighted to confirm that your order has been received and is being processed.
    </p>
    <div style="margin-bottom: 30px; padding: 20px; background-color: #f9f9f9; border-left: 3px solid #4c062c;">
        <p style="margin: 0 0 10px; color: #1a1a1a; font-size: 14px; font-weight: 200; text-transform: uppercase; letter-spacing: 1px;">
            Order Number
        </p>
        <p style="margin: 0; color: #4c062c; font-size: 24px; font-weight: 200; letter-spacing: 2px;">
            ${order.orderId}
        </p>
        ${
          order.orderDate
            ? `<p style="margin: 10px 0 0; color: #6b6b6b; font-size: 12px; font-weight: 200;">ORDER DATE: ${order.orderDate}</p>`
            : ""
        }
    </div>
    <h2 style="margin: 30px 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 200; text-transform: uppercase; letter-spacing: 1px;">
        Order Details
    </h2>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        ${itemsList}
        <tr>
            <td style="padding: 20px 0 0; border-top: 2px solid #1a1a1a;" colspan="2">
                <p style="margin: 0; color: #1a1a1a; font-size: 18px; font-weight: 200; text-align: right;">
                    <strong>Total: ${formatPrice(order.totalAmount)}</strong>
                </p>
            </td>
        </tr>
    </table>
    ${shippingInfo}
    ${
      order.paymentMethod
        ? `
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <tr>
                <td style="padding: 15px 0; border-bottom: 1px solid #e6e6e6;">
                    <p style="margin: 0; color: #6b6b6b; font-size: 12px; font-weight: 200; text-transform: uppercase; letter-spacing: 1px; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">
                        Payment Method
                    </p>
                    <p style="margin: 5px 0 0; color: #1a1a1a; font-size: 16px; font-weight: 200; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">
                        ${order.paymentMethod}
                    </p>
                </td>
            </tr>
        </table>
    `
        : ""
    }
    <div style="margin-top: 40px; padding: 20px; background-color: #f9f9f9;">
        <p style="margin: 0 0 15px; color: #1a1a1a; font-size: 16px; font-weight: 200; line-height: 1.6;">
            <strong>Next Steps</strong>
        </p>
        <p style="margin: 0; color: #6b6b6b; font-size: 14px; font-weight: 200; line-height: 1.6;">
            We will send you another email once your order has been shipped with tracking information. You can contact us at info@tasselandwicker.com if you have any questions.
        </p>
    </div>
    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e6e6e6;">
        <p style="margin: 0; color: #6b6b6b; font-size: 12px; font-weight: 200; text-align: center; text-transform: uppercase; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">
            THANK YOU FOR CHOOSING TASSEL & WICKER
        </p>
    </div>
  `;

  return getBaseEmailTemplate(content, "Order Confirmation");
}

export function createPaymentConfirmationEmailTemplate(order: OrderDetails): string {
  const formatPrice = (amount: number): string => `£${amount.toFixed(2)}`;
  const capitalizedName = order.customerName
    ? order.customerName.charAt(0).toUpperCase() + order.customerName.slice(1)
    : "Valued Customer";

  const content = `
    <p style="margin: 0 0 30px; color: #1a1a1a; font-size: 16px; font-weight: 200; line-height: 1.6; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">
        Dear ${capitalizedName},
    </p>
    <p style="margin: 0 0 30px; color: #1a1a1a; font-size: 16px; font-weight: 200; line-height: 1.6; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">
        We are pleased to confirm that your payment of <strong>${formatPrice(order.totalAmount)}</strong> has been successfully processed.
    </p>
    <div style="margin-bottom: 30px; padding: 20px; background-color: #f0f9f0; border-left: 3px solid #4c062c;">
        <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 200; line-height: 1.6;">
            ✓ Payment confirmed for Order #${order.orderId}
        </p>
    </div>
    <p style="margin: 0 0 30px; color: #1a1a1a; font-size: 16px; font-weight: 200; line-height: 1.6; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">
        Your order is now being prepared for shipment. You will receive a shipping confirmation email with tracking details once your items are on their way.
    </p>
    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e6e6e6;">
        <p style="margin: 0; color: #6b6b6b; font-size: 12px; font-weight: 200; text-align: center; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">
            You can contact us at <a href="mailto:info@tasselandwicker.com" style="color: #4c062c; text-decoration: none; font-family: 'Balgin', 'Mathilda', system-ui, sans-serif;">info@tasselandwicker.com</a> if you have any questions.
        </p>
    </div>
  `;

  return getBaseEmailTemplate(content, "Payment Confirmation");
}


