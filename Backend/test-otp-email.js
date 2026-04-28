require('dotenv').config();
const { sendOTPEmail } = require('./config/email');

async function testOTPEmail() {
  // Test OTP
  const testOTP = Math.floor(100000 + Math.random() * 900000).toString();

  console.log('Testing OTP Email...');
  console.log('Generated OTP:', testOTP);
  console.log('SMTP User:', process.env.SMTP_USER || 'NOT SET');
  console.log('SMTP Host:', process.env.SMTP_HOST || 'NOT SET');

  try {
    const result = await sendOTPEmail('irinfelshiya07@gmail.com', testOTP, 'verification');

    if (result.success) {
      console.log('\n✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
    } else {
      console.log('\n❌ Failed to send email:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testOTPEmail();
