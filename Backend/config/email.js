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

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"M Business" <${process.env.SMTP_USER || 'noreply@mbusiness.com'}>`,
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

const sendRenewalReminder = async (userEmail, userName, planName, endDate, daysLeft) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #9333ea;">Subscription Renewal Reminder</h2>
      <p>Hello ${userName},</p>
      <p>Your <strong>${planName}</strong> subscription will expire in <strong>${daysLeft} days</strong> on <strong>${new Date(endDate).toLocaleDateString('en-IN')}</strong>.</p>
      <p>Please renew your subscription to continue enjoying our services without interruption.</p>
      <div style="background: #f5f3ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Plan:</strong> ${planName}</p>
        <p style="margin: 8px 0 0 0;"><strong>Expiry Date:</strong> ${new Date(endDate).toLocaleDateString('en-IN')}</p>
        <p style="margin: 8px 0 0 0;"><strong>Days Remaining:</strong> ${daysLeft}</p>
      </div>
      <p>If you have any questions, please contact your administrator.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated reminder from M Business.</p>
    </div>
  `;
  return await sendEmail(userEmail, `Renew Your ${planName} Subscription - ${daysLeft} Days Left`, html);
};

const sendExpiryNotification = async (userEmail, userName, planName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Subscription Expired</h2>
      <p>Hello ${userName},</p>
      <p>Your <strong>${planName}</strong> subscription has now expired and is no longer accessible.</p>
      <p>Please contact your administrator to renew your subscription and regain access to our services.</p>
      <div style="background: #fef2f2; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #fecaca;">
        <p style="margin: 0; color: #dc2626;"><strong>Status:</strong> EXPIRED</p>
        <p style="margin: 8px 0 0 0;">Contact your administrator for renewal.</p>
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated notification from M Business.</p>
    </div>
  `;
  return await sendEmail(userEmail, `Your ${planName} Subscription Has Expired`, html);
};

const sendOTPEmail = async (userEmail, otp, purpose = 'verification') => {
  const purposeText = {
    verification: 'verify your email address',
    password_reset: 'reset your password',
    login: 'complete your login'
  }[purpose] || 'verify your account';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h2 style="color: white; margin: 0;">M Business</h2>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
        <h3 style="color: #1f2937; margin-top: 0;">Your OTP Code</h3>
        <p style="color: #4b5563;">Hello,</p>
        <p style="color: #4b5563;">Use the following OTP code to ${purposeText}. This code will expire in 10 minutes.</p>
        <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #9333ea; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          This is an automated email from M Business. Please do not reply.
        </p>
      </div>
    </div>
  `;
  return await sendEmail(userEmail, `Your M Business OTP Code - ${purpose.replace('_', ' ').toUpperCase()}`, html);
};

// Simple utility function to send quick emails
const sendQuickEmail = async (to, subject, message) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h2 style="color: white; margin: 0;">M Business</h2>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
        <p style="color: #1f2937;">${message}</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          This is an automated email from M Business. Please do not reply.
        </p>
      </div>
    </div>
  `;
  return await sendEmail(to, subject, html);
};

module.exports = { sendEmail, sendRenewalReminder, sendExpiryNotification, sendOTPEmail, sendQuickEmail };
