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

export interface SendNewAdminNotificationOptions {
  superAdminEmail: string;
  adminDetails: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string | undefined;
    role: string;
    referralCode?: string | undefined;
    profileImage?: string | undefined;
    isAgeOver18: boolean;
    agreesToTerms: boolean;
    registeredAt: Date;
  };
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
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

/**
 * Sends a detailed notification email to the Super Admin whenever a new user registers with the ADMIN role.
 */
export const sendNewAdminNotification = async (
  options: SendNewAdminNotificationOptions
): Promise<void> => {
  const { superAdminEmail, adminDetails } = options;
  const subject = `[Admin Alert] New Admin Registered: ${adminDetails.name} (${adminDetails.email}) - TeamStreak Promo`;

  const formattedDate = new Date(adminDetails.registeredAt).toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; background-color: #FAF7F2; border-radius: 16px; border: 1px solid #E2E2E2;">
      <div style="background-color: #111318; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700;">TeamStreak Promo</h1>
        <p style="color: #91C73E; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Security & Administration Notification</p>
      </div>

      <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #E2E2E2; margin-bottom: 20px;">
        <h2 style="color: #1A1A1A; margin: 0 0 8px 0; font-size: 18px;">New Admin User Account Created</h2>
        <p style="color: #757575; font-size: 14px; margin: 0 0 20px 0; line-height: 1.5;">
          A new user has completed registration on the platform with the <strong>ADMIN</strong> role. All registration details provided during sign-up are summarized below:
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tbody>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 10px 0; color: #757575; width: 35%;">User ID</td>
              <td style="padding: 10px 0; color: #1A1A1A; font-weight: 600; font-family: monospace;">${adminDetails.id}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 10px 0; color: #757575;">Full Name</td>
              <td style="padding: 10px 0; color: #1A1A1A; font-weight: 600;">${adminDetails.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 10px 0; color: #757575;">Email Address</td>
              <td style="padding: 10px 0; color: #1A1A1A; font-weight: 600;"><a href="mailto:${adminDetails.email}" style="color: #6366F1; text-decoration: none;">${adminDetails.email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 10px 0; color: #757575;">Phone Number</td>
              <td style="padding: 10px 0; color: #1A1A1A;">${adminDetails.phoneNumber || '<em>Not provided</em>'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 10px 0; color: #757575;">Assigned Role</td>
              <td style="padding: 10px 0;">
                <span style="background-color: #91C73E; color: #1A1A1A; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: inline-block;">
                  ${adminDetails.role}
                </span>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 10px 0; color: #757575;">Referral Code</td>
              <td style="padding: 10px 0; color: #1A1A1A; font-weight: 600; font-family: monospace;">${adminDetails.referralCode || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 10px 0; color: #757575;">Profile Image</td>
              <td style="padding: 10px 0; color: #1A1A1A;">
                ${
                  adminDetails.profileImage
                    ? `<a href="${adminDetails.profileImage}" target="_blank" style="color: #6366F1;">View Uploaded Photo</a>`
                    : '<em>None</em>'
                }
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 10px 0; color: #757575;">Age Confirmation</td>
              <td style="padding: 10px 0; color: #1A1A1A;">${adminDetails.isAgeOver18 ? '✅ 18+ Confirmed' : '❌ No'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 10px 0; color: #757575;">Terms & Conditions</td>
              <td style="padding: 10px 0; color: #1A1A1A;">${adminDetails.agreesToTerms ? '✅ Agreed' : '❌ No'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #757575;">Registration Timestamp</td>
              <td style="padding: 10px 0; color: #1A1A1A;">${formattedDate} (UTC)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p style="font-size: 12px; color: #888888; text-align: center; margin: 16px 0 0 0;">
        This is an automated administrative notification sent to the Super Admin address configured at <code>SUPER_ADMIN_EMAIL</code>.
      </p>
    </div>
  `;

  await sendEmail({
    to: superAdminEmail,
    subject,
    html,
    text: `New Admin Account Created on TeamStreak Promo:\n- ID: ${adminDetails.id}\n- Name: ${adminDetails.name}\n- Email: ${adminDetails.email}\n- Phone: ${adminDetails.phoneNumber || 'None'}\n- Role: ${adminDetails.role}\n- Referral Code: ${adminDetails.referralCode || 'N/A'}\n- Registered At: ${formattedDate}`,
  });
};
