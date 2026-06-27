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
    const total = await PaymentHistory.countDocuments();
    const success = await PaymentHistory.countDocuments({ status: 'success' });
    const failed = await PaymentHistory.countDocuments({ status: 'failed' });
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
    const { userId, userEmail, userName, userPhone, plan } = req.body;

    // ── Validate incoming data ──────────────────────────────────────────
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!userEmail) return res.status(400).json({ error: 'userEmail is required' });
    if (!plan) return res.status(400).json({ error: 'plan is required' });

    // Support both 'name' (DEFAULT_PLANS) and 'title' (DB packages)
    const planName = plan.name || plan.title || 'Subscription';

    // Support both number and string price, and both 'price' and 'monthlyPrice'
    const rawPrice = plan.price ?? plan.monthlyPrice ?? 0;
    const parsedPrice = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;

    if (parsedPrice <= 0) {
      return res.status(400).json({ error: 'Plan price must be greater than 0' });
    }

    // Format amount to exactly 2 decimal places — PayU requires this
    const amount = parsedPrice.toFixed(2);

    // ── PayU credentials ────────────────────────────────────────────────
    const key = process.env.PAYU_KEY;
    const salt = process.env.PAYU_SALT;

    if (!key || !salt) {
      console.error('PayU credentials missing. PAYU_KEY:', !!key, 'PAYU_SALT:', !!salt);
      return res.status(500).json({ error: 'PayU credentials not configured on server. Add PAYU_KEY and PAYU_SALT to your .env file.' });
    }

    const txnid = `txn_${Date.now()}`;
    const productinfo = planName;
    const firstname = (userName || '').trim() || 'User';
    const email = (userEmail || '').trim();
    const phone = (userPhone || '9999999999').replace(/\D/g, '').slice(0, 10) || '9999999999';

    // ── Cancel existing pending subscriptions ───────────────────────────
    await Subscription.updateMany(
      { userId, status: 'pending' },
      { status: 'cancelled', updatedAt: new Date() }
    );

    // ── Create pending subscription ─────────────────────────────────────
    const pendingSub = new Subscription({
      userId,
      userEmail: email,
      userName: firstname,
      planName: planName,
      planPrice: parsedPrice,
      billingCycle: 'monthly',
      status: 'pending',
      clientLimit: plan.clientLimit || '',
      employeeLimit: plan.employeeLimit || '',
      managerLimit: plan.managerLimit || '',
      businessLimit: plan.businessLimit || '',
      features: Array.isArray(plan.features) ? plan.features : []
    });
    await pendingSub.save();

    // ── Build PayU hash ─────────────────────────────────────────────────
    // Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    const udf1 = pendingSub._id.toString();
    const udf2 = '', udf3 = '', udf4 = '', udf5 = '';
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    console.log('[PayU] txnid:', txnid, '| amount:', amount, '| plan:', planName);
    console.log('[PayU] hash generated successfully');

    // ── Callback URLs ───────────────────────────────────────────────────
    const backendUrl = (process.env.BASE_URL || 'http://localhost:5008').replace(/\/$/, '');
    const surl = `${backendUrl}/api/payments/payu/success`;
    const furl = `${backendUrl}/api/payments/payu/failure`;
    const env = process.env.PAYU_ENV === 'prod' ? 'prod' : 'test';

    console.log('[PayU] env:', env, '| surl:', surl);

    return res.json({
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
    console.error('[PayU] initPayU error:', error.message, error.stack);
    return res.status(500).json({ error: error.message });
  }
};