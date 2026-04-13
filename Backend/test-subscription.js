const Subscription = require('./models/SubscriptionModel');
const PaymentHistory = require('./models/PaymentHistoryModel');

async function createTestSubscription() {
  try {
    console.log('Creating test subscription...');
    
    // Create a subscription that expires in 5 days for testing
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 5);
    
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    
    const subscription = new Subscription({
      userId: 'test-user-id',
      companyId: 'test-user-id',
      userEmail: 'irinfelshiya07@gmail.com',
      userName: 'Test User',
      planName: 'Professional',
      planPrice: 2999,
      billingCycle: 'monthly',
      status: 'active',
      isFullyPaid: true,
      startDate: new Date(),
      endDate: endDate,
      nextBillingDate: nextBilling,
      features: [
        'Unlimited Clients',
        'Unlimited Projects',
        'Invoice Generation',
        'Quotation Management',
        'Priority Support',
        'Cloud Storage 50GB'
      ],
      paymentMethod: 'card',
      providerCompany: 'M Business',
      providerEmail: 'billing@mbusiness.com',
      providerPhone: '+91-9876543210',
      invoiceRefs: ['INV-SUB-TEST-001'],
      quotationRefs: ['QUO-SUB-TEST-001']
    });
    
    await subscription.save();
    
    // Create payment history
    const payment = new PaymentHistory({
      userId: 'test-user-id',
      userEmail: 'irinfelshiya07@gmail.com',
      subscriptionId: subscription._id,
      paymentId: 'PAY-TEST-001',
      amount: 2999,
      currency: 'INR',
      type: 'subscription',
      invoiceNo: 'INV-SUB-TEST-001',
      quotationNo: 'QUO-SUB-TEST-001',
      description: 'Professional Plan - Monthly Subscription (Test)',
      status: 'completed',
      paymentMethod: 'card',
      paymentDetails: {
        cardLast4: '4242'
      },
      providerCompany: 'M Business',
      providerGst: 'GSTIN-33AABCM1234Z1Z1',
      providerAddress: 'M Business Pvt Ltd, 123 Tech Park, Chennai - 600001, Tamil Nadu, India',
      paymentDate: new Date(),
      planName: 'Professional',
      planDuration: 'monthly'
    });
    
    await payment.save();
    
    console.log('✅ Test subscription created successfully!');
    console.log(`📅 Subscription expires on: ${endDate.toDateString()}`);
    console.log(`📧 Email: irinfelshiya07@gmail.com`);
    console.log(`🆔 Subscription ID: ${subscription._id}`);
    
  } catch (error) {
    console.error('❌ Error creating test subscription:', error);
  }
}

createTestSubscription();
