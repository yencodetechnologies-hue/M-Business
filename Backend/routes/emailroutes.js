const express = require("express");
const router = express.Router();
const { sendEmail, sendOTPEmail, sendQuickEmail } = require("../config/email");

// Send custom email
router.post("/send", async (req, res) => {
  try {
    const { to, subject, message, html } = req.body;
    
    if (!to || !subject || (!message && !html)) {
      return res.status(400).json({ 
        success: false, 
        message: "To, subject, and message (or html) are required" 
      });
    }

    const result = html 
      ? await sendEmail(to, subject, html)
      : await sendQuickEmail(to, subject, message);

    res.json(result);
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send email",
      error: error.message 
    });
  }
});

// Send OTP email
router.post("/send-otp", async (req, res) => {
  try {
    const { to, otp, purpose } = req.body;
    
    if (!to || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and OTP are required" 
      });
    }

    const result = await sendOTPEmail(to, otp, purpose || 'verification');
    res.json(result);
  } catch (error) {
    console.error("OTP email send error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send OTP email",
      error: error.message 
    });
  }
});

// Test email configuration
router.get("/test", async (req, res) => {
  try {
    const testEmail = process.env.SMTP_USER || 'test@example.com';
    const result = await sendQuickEmail(
      testEmail, 
      "Test Email from M Business", 
      "This is a test email to verify that the email configuration is working correctly."
    );
    
    res.json({
      ...result,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? "Configured" : "Not configured",
        pass: process.env.SMTP_PASS ? "Configured" : "Not configured"
      }
    });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Test email failed",
      error: error.message 
    });
  }
});

module.exports = router;
