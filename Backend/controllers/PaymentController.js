const PaymentHistory = require('../models/PaymentHistoryModel');
const Subscription = require('../models/SubscriptionModel');
const crypto = require('crypto');

exports.createPaymentOrder = async (req, res) => {
  try {
    const { amount, userId, type } = req.body;
    const payment = await PaymentHistory.create({
      userId,
      amount,
      type,
      status: 'pending',
      paymentDate: new Date()
    });
    res.json({ success: true, paymentId: payment._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    await PaymentHistory.findByIdAndUpdate(paymentId, { status: 'success' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.handlePaymentFailure = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;
    await PaymentHistory.findByIdAndUpdate(paymentId, {
      status: 'failed',
      notes: reason || 'Payment failed'
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const { paymentId } = req.body;
    await PaymentHistory.findByIdAndUpdate(paymentId, { status: 'refunded' });
    res.json({ success: true, message: 'Refund processed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPaymentStats = async (req, res) => {
  try {
    const total   = await PaymentHistory.countDocuments();
    const success = await PaymentHistory.countDocuments({ status: 'success' });
    const failed  = await PaymentHistory.countDocuments({ status: 'failed' });
    res.json({ total, success, failed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentHistory.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    res.json({ methods });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.initPayU = async (req, res) => {
  try {
    const { userId, userEmail, userName, plan } = req.body;
    const key = process.env.PAYU_KEY;
    const salt = process.env.PAYU_SALT;
    if (!key || !salt) {
      return res.status(500).json({ error: 'PayU credentials not configured' });
    }
    // Generate transaction id
    const txnid = `txn_${Date.now()}`;
    // Determine amount and product info from plan
    const amount = plan && plan.price ? plan.price.toString() : '';
    const productinfo = plan && plan.name ? plan.name : 'Subscription';
    const firstname = userName || '';
    const email = userEmail || '';
    const phone = '';
    // Create a pending subscription first
    const pendingSub = new Subscription({
      userId,
      userEmail,
      userName,
      planName: plan.name || 'Subscription',
      planPrice: plan.price || 0,
      billingCycle: "monthly",
      status: "pending",
      clientLimit: plan.clientLimit || '',
      employeeLimit: plan.employeeLimit || '',
      managerLimit: plan.managerLimit || '',
      businessLimit: plan.businessLimit || '',
      features: plan.features || []
    });
    await pendingSub.save();

    // Use udf1 to store the subscriptionId so PayU returns it in callbacks
    const udf1 = pendingSub._id.toString();
    const udf2 = '', udf3 = '', udf4 = '', udf5 = '';
    // Build hash string as per PayU specification
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    console.log('PayU hashString:', hashString);
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');
    console.log('PayU hash:', hash);
    // Success and failure URLs — PayU POSTs to backend, backend redirects to frontend
    const backendUrl = process.env.BASE_URL || 'http://localhost:5008';
    const surl = `${backendUrl}/api/payments/payu/success`;
    const furl = `${backendUrl}/api/payments/payu/failure`;
    const env = process.env.PAYU_ENV === 'prod' ? 'prod' : 'test';
    console.log('PayU surl:', surl, '| furl:', furl);
    // Respond with all required fields for frontend form submission
    res.json({
      success: true,
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      udf1,
      hash,
      surl,
      furl,
      env
    });
  } catch (error) {
    console.error('initPayU error:', error);
    res.status(500).json({ error: error.message });
  }
};