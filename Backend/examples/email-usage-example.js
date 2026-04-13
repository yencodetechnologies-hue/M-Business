// Example: How to use email functionality in your controllers
// This file demonstrates different ways to send emails using the configured nodemailer setup

const { sendEmail, sendOTPEmail, sendQuickEmail, sendRenewalReminder, sendExpiryNotification } = require('../config/email');

// Example 1: Send a custom email with HTML content
const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9333ea;">Welcome to M Business!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for joining M Business. Your account has been successfully created.</p>
        <p>You can now access all our features and services.</p>
        <div style="background: #f5f3ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Next Steps:</strong></p>
          <ul>
            <li>Complete your profile</li>
            <li>Explore our features</li>
            <li>Contact support if you need help</li>
          </ul>
        </div>
        <p>Best regards,<br/>M Business Team</p>
      </div>
    `;
    
    const result = await sendEmail(userEmail, 'Welcome to M Business!', html);
    console.log('Welcome email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Example 2: Send a quick notification email
const sendNotificationEmail = async (userEmail, subject, message) => {
  try {
    const result = await sendQuickEmail(userEmail, subject, message);
    console.log('Notification email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
};

// Example 3: Send OTP for email verification
const sendEmailVerificationOTP = async (userEmail, otp) => {
  try {
    const result = await sendOTPEmail(userEmail, otp, 'verification');
    console.log('Verification OTP sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending verification OTP:', error);
    throw error;
  }
};

// Example 4: Send password reset OTP
const sendPasswordResetOTP = async (userEmail, otp) => {
  try {
    const result = await sendOTPEmail(userEmail, otp, 'password_reset');
    console.log('Password reset OTP sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    throw error;
  }
};

// Example 5: How to use in a controller (like authroutes.js)
const exampleControllerUsage = async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Send welcome email
    await sendWelcomeEmail(email, name);
    
    // Or send a quick notification
    await sendNotificationEmail(
      email, 
      'Account Created Successfully', 
      'Your M Business account has been created. You can now log in and start using our services.'
    );
    
    res.json({ success: true, message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
};

// Example 6: Send subscription renewal reminder (already configured in cron job)
const sendManualRenewalReminder = async (userEmail, userName, planName, endDate) => {
  try {
    const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    const result = await sendRenewalReminder(userEmail, userName, planName, endDate, daysLeft);
    console.log('Manual renewal reminder sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending manual renewal reminder:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendNotificationEmail,
  sendEmailVerificationOTP,
  sendPasswordResetOTP,
  exampleControllerUsage,
  sendManualRenewalReminder
};
