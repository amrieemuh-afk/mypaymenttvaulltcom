import nodemailer from "nodemailer";
import { logger } from "./logger";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const masked = local[0] + "***";
  return `${masked}@${domain}`;
}

export { maskEmail };

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM ?? smtpUser ?? "noreply@mypaymentvault.com";

  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn(
      { to, code },
      "[DEV MODE] SMTP not configured — OTP code logged here instead of emailed"
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: `"MyPaymentVault" <${fromEmail}>`,
    to,
    subject: "Your MyPaymentVault verification code",
    text: `Your one-time verification code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <p style="font-size:13px;color:#555">Your MyPaymentVault verification code:</p>
        <p style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111">${code}</p>
        <p style="font-size:12px;color:#888">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });

  logger.info({ to }, "OTP email sent");
}
