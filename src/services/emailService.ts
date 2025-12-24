import { Resend } from "resend";
import { env } from "../config/env";

export interface EmailConfig {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

function createResendClient() {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

export async function sendEmail(config: EmailConfig): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const resend = createResendClient();
  if (!resend) {
    return { success: false, error: "Email service is not configured (RESEND_API_KEY missing)" };
  }

  const fromAddress = env.SMTP_FROM || "info@tasselandwicker.com";
  const fromName = env.SMTP_FROM_NAME || "Tassel & Wicker";

  const to = Array.isArray(config.to) ? config.to : [config.to];
  const cc = config.cc ? (Array.isArray(config.cc) ? config.cc : [config.cc]) : undefined;
  const bcc = config.bcc ? (Array.isArray(config.bcc) ? config.bcc : [config.bcc]) : undefined;

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromAddress}>`,
    to,
    subject: config.subject,
    html: config.html,
    replyTo: config.replyTo,
    cc,
    bcc,
  });

  if (error) return { success: false, error: (error as any)?.message || "Failed to send email" };
  return { success: true, messageId: data?.id };
}


