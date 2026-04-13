const { sendQuickEmail } = require('./config/email');

async function testEmail() {
  try {
    console.log('Testing email functionality...');
    
    const result = await sendQuickEmail(
      'irinfelshiya07@gmail.com',
      'Test Email from M Business',
      '<h3>Test Email</h3><p>This is a test email to verify the email functionality is working correctly.</p><p>If you receive this email, the setup is successful!</p>'
    );
    
    console.log('Email result:', result);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
    } else {
      console.log('❌ Email failed:', result.error);
    }
  } catch (error) {
    console.error('Error testing email:', error);
  }
}

testEmail();
