import nodemailer from 'nodemailer';
import config from '../config/config.js';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendOtpEmailOptions {
  to: string;
  otp: string;
  purposeTitle?: string;
}

/**
 * Sends an email using Nodemailer transporter.
 * If SMTP credentials are not configured, it logs the email to console for development convenience.
 */
export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const { to, subject, html, text } = options;

  if (!config.smtpUser || !config.smtpPass) {
    console.log('====================================================');
    console.log(`[EMAIL DEV LOG] SMTP credentials not configured.`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || html}`);
    console.log('====================================================');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  await transporter.sendMail({
    from: config.emailFrom,
    to,
    subject,
    text: text || html.replace(/<[^>]*>?/gm, ''),
    html,
  });
};

/**
 * Sends a formatted OTP email.
 */
export const sendOtpEmail = async (options: SendOtpEmailOptions): Promise<void> => {
  const { to, otp, purposeTitle = 'Password Reset' } = options;
  const subject = `${purposeTitle} OTP Code - TeamStreak Promo`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; borderRadius: 8px;">
      <h2 style="color: #333333; text-align: center;">TeamStreak Promo</h2>
      <hr style="border: 0; border-top: 1px solid #eeeeee;" />
      <p style="font-size: 16px; color: #555555;">Hello,</p>
      <p style="font-size: 16px; color: #555555;">You requested a <strong>${purposeTitle}</strong>. Use the following OTP code to proceed:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4F46E5; background-color: #F3F4F6; padding: 12px 24px; border-radius: 6px; display: inline-block;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 14px; color: #777777;">This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
      <p style="font-size: 14px; color: #777777;">If you did not request this, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eeeeee; margin-top: 30px;" />
      <p style="font-size: 12px; color: #999999; text-align: center;">&copy; ${new Date().getFullYear()} TeamStreak Promo. All rights reserved.</p>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    html,
    text: `Your ${purposeTitle} OTP code is: ${otp}. It expires in 10 minutes.`,
  });
};
