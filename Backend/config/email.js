const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const mbHeader = `
  <div style="background:linear-gradient(135deg,#9333ea 0%,#7c3aed 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <h2 style="color:#fff;margin:0;font-size:22px;font-family:Arial,sans-serif;letter-spacing:1px;">Management Platform</h2>
    <p style="color:#e9d5ff;margin:4px 0 0;font-size:12px;">Automated Business Workflow</p>
  </div>
`;

const mbFooter = `
  <p style="color:#9ca3af;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;font-family:Arial,sans-serif;">
    This is an automated message. Please do not reply directly.
  </p>
`;

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Business Notification" <${process.env.SMTP_USER || 'noreply@platform.com'}>`,
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// 10-day renewal reminder
const sendRenewalReminder = async (userEmail, userName, planName, endDate, daysLeft) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${mbHeader}
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <h3 style="color:#1e0a3c;margin-top:0;">⏰ Subscription Renewal Reminder</h3>
        <p style="color:#4b5563;">Hello <strong>${userName}</strong>,</p>
        <p style="color:#4b5563;">Your <strong>${planName}</strong> plan will expire in <strong style="color:#f59e0b;">${daysLeft} days</strong> on <strong>${new Date(endDate).toLocaleDateString('en-IN')}</strong>.</p>
        <div style="background:#fefce8;border:1.5px solid #fde68a;border-radius:10px;padding:20px;margin:24px 0;">
          <table style="width:100%;font-size:14px;color:#3b0764;">
            <tr><td style="padding:5px 0;font-weight:600;">Plan</td><td style="padding:5px 0;">${planName}</td></tr>
            <tr><td style="padding:5px 0;font-weight:600;">Expiry Date</td><td style="padding:5px 0;">${new Date(endDate).toLocaleDateString('en-IN')}</td></tr>
            <tr><td style="padding:5px 0;font-weight:600;">Days Remaining</td><td style="padding:5px 0;color:#f59e0b;font-weight:700;">${daysLeft}</td></tr>
          </table>
        </div>
        <p style="color:#4b5563;">Please renew your subscription to avoid service interruption. Contact your administrator or visit your dashboard to renew.</p>
        <a href="#" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">Renew Now</a>
        ${mbFooter}
      </div>
    </div>
  `;
  return await sendEmail(userEmail, `⏰ Renew Your ${planName} Plan — Only ${daysLeft} Days Left!`, html);
};

// Expiry notification
const sendExpiryNotification = async (userEmail, userName, planName) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${mbHeader}
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <h3 style="color:#dc2626;margin-top:0;">🚫 Subscription Expired</h3>
        <p style="color:#4b5563;">Hello <strong>${userName}</strong>,</p>
        <p style="color:#4b5563;">Your <strong>${planName}</strong> subscription has expired and is no longer active.</p>
        <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;padding:20px;margin:24px 0;">
          <p style="margin:0;color:#dc2626;font-weight:700;">Status: EXPIRED</p>
          <p style="margin:8px 0 0;color:#7f1d1d;">Please contact your administrator to renew your subscription and restore access.</p>
        </div>
        <p style="color:#6b7280;font-size:13px;">Note: Your data remains safe. Your subscription will be accessible for 60 days after expiry. After that, access will be fully restricted.</p>
        ${mbFooter}
      </div>
    </div>
  `;
  return await sendEmail(userEmail, `🚫 Your ${planName} Subscription Has Expired`, html);
};

// Usage limit alert (e.g., 80% of 999 used)
const sendUsageLimitAlert = async (userEmail, userName, planName, usageCount, usageLimit) => {
  const usagePercent = Math.round((usageCount / usageLimit) * 100);
  const remaining = usageLimit - usageCount;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${mbHeader}
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <h3 style="color:#d97706;margin-top:0;">⚠️ Subscription Usage Limit Alert</h3>
        <p style="color:#4b5563;">Hello <strong>${userName}</strong>,</p>
        <p style="color:#4b5563;">Your <strong>${planName}</strong> plan has reached <strong style="color:#d97706;">${usagePercent}%</strong> of its usage limit.</p>
        <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;padding:20px;margin:24px 0;">
          <table style="width:100%;font-size:14px;color:#3b0764;">
            <tr><td style="padding:5px 0;font-weight:600;">Plan</td><td>${planName}</td></tr>
            <tr><td style="padding:5px 0;font-weight:600;">Used</td><td style="color:#d97706;font-weight:700;">${usageCount} / ${usageLimit}</td></tr>
            <tr><td style="padding:5px 0;font-weight:600;">Remaining</td><td style="color:#16a34a;font-weight:700;">${remaining}</td></tr>
          </table>
          <div style="margin-top:12px;background:#e5e7eb;border-radius:6px;height:10px;overflow:hidden;">
            <div style="width:${usagePercent}%;background:linear-gradient(90deg,#9333ea,#f59e0b);height:10px;border-radius:6px;"></div>
          </div>
        </div>
        <p style="color:#4b5563;">You are approaching your subscription limit. Consider upgrading your plan to avoid service disruption.</p>
        <a href="#" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">Upgrade Plan</a>
        ${mbFooter}
      </div>
    </div>
  `;
  return await sendEmail(userEmail, `⚠️ Usage Limit Alert — ${remaining} remaining in your ${planName} plan`, html);
};

// Subscription success email (Trial or Paid)
const sendSubscriptionSuccess = async (userEmail, userName, planName, startDate, endDate, isTrial = false) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${mbHeader}
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <h3 style="color:#16a34a;margin-top:0;">🎉 Subscription Activated!</h3>
        <p style="color:#4b5563;">Hello <strong>${userName}</strong>,</p>
        <p style="color:#4b5563;">Your <strong>${planName}</strong> plan has been successfully activated. ${isTrial ? "Enjoy your 30-day free trial!" : "Thank you for choosing Business Suite."}</p>
        <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:20px;margin:24px 0;">
          <table style="width:100%;font-size:14px;color:#166534;">
            <tr><td style="padding:5px 0;font-weight:600;">Plan Name</td><td>${planName}</td></tr>
            <tr><td style="padding:5px 0;font-weight:600;">Status</td><td><span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:700;">ACTIVE</span></td></tr>
            <tr><td style="padding:5px 0;font-weight:600;">Start Date</td><td>${new Date(startDate).toLocaleDateString('en-IN')}</td></tr>
            <tr><td style="padding:5px 0;font-weight:600;">Expiry Date</td><td style="color:#15803d;font-weight:700;">${new Date(endDate).toLocaleDateString('en-IN')}</td></tr>
          </table>
        </div>
        <p style="color:#4b5563;">You can now access all management tools from your dashboard. If you have any questions, our support team is here to help.</p>
        <div style="text-align:center;margin-top:28px;">
          <a href="#" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">Go to Dashboard</a>
        </div>
        ${mbFooter}
      </div>
    </div>
  `;
  const subject = isTrial ? `🎉 Your 30-Day Free Trial is Now Active` : `✅ Your ${planName} Subscription is Now Active!`;
  return await sendEmail(userEmail, subject, html);
};

// Trial welcome email
const sendTrialWelcome = async (userEmail, userName, endDate) => {
  return await sendSubscriptionSuccess(userEmail, userName, "30-Day Free Trial", new Date(), endDate, true);
};

// OTP email
const sendOTPEmail = async (userEmail, otp, purpose = 'verification') => {
  const purposeText = {
    verification: 'verify your email address',
    password_reset: 'reset your password',
    login: 'complete your login'
  }[purpose] || 'verify your account';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${mbHeader}
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <h3 style="color:#1f2937;margin-top:0;">Your OTP Code</h3>
        <p style="color:#4b5563;">Hello,</p>
        <p style="color:#4b5563;">Use the following OTP to ${purposeText}. Expires in 10 minutes.</p>
        <div style="background:#f5f3ff;padding:24px;border-radius:10px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;color:#9333ea;letter-spacing:10px;">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px;">If you didn't request this, please ignore this email.</p>
        ${mbFooter}
      </div>
    </div>
  `;
  return await sendEmail(userEmail, `Your OTP Code — ${purpose.replace('_', ' ').toUpperCase()}`, html);
};

// Quick email utility
const sendQuickEmail = async (to, subject, message) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${mbHeader}
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <p style="color:#1f2937;">${message}</p>
        ${mbFooter}
      </div>
    </div>
  `;
  return await sendEmail(to, subject, html);
};

module.exports = { sendEmail, sendRenewalReminder, sendExpiryNotification, sendUsageLimitAlert, sendTrialWelcome, sendOTPEmail, sendQuickEmail, sendSubscriptionSuccess };
