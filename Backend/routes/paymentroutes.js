const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/PaymentController");
const PaymentHistory = require("../models/PaymentHistoryModel");

// Payment Order Creation
router.post("/create-order", PaymentController.createPaymentOrder);

// Payment Verification
router.post("/verify", PaymentController.verifyPayment);

// Payment Failure Handler
router.post("/failure", PaymentController.handlePaymentFailure);

// PayU Endpoints (integrated via PaymentController router)
router.post('/payu/init', PaymentController.initPayU);

// PayU Success Callback (PayU POSTs here after successful payment)
router.post('/payu/success', async (req, res) => {
  try {
    const { txnid, status, amount, productinfo, firstname, email, mihpayid } = req.body;
    console.log('PayU success callback:', req.body);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Redirect to frontend with success params
    res.redirect(`${frontendUrl}/?payment=success&plan=${encodeURIComponent(productinfo)}&txnid=${txnid}&mihpayid=${mihpayid || ''}`);
  } catch (err) {
    console.error('PayU success handler error:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?payment=success`);
  }
});

// PayU Failure Callback (PayU POSTs here after failed payment)
router.post('/payu/failure', async (req, res) => {
  try {
    const { txnid, status, productinfo } = req.body;
    console.log('PayU failure callback:', req.body);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?payment=failed&plan=${encodeURIComponent(productinfo || '')}&txnid=${txnid || ''}`);
  } catch (err) {
    console.error('PayU failure handler error:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?payment=failed`);
  }
});


// Process Refund
router.post("/refund", PaymentController.processRefund);

// Get Payment Statistics
router.get("/stats", PaymentController.getPaymentStats);

// Get Payment Methods Summary
router.get("/methods", PaymentController.getPaymentMethods);

// Get All Payments for Admin
router.get("/all", async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId, type } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (type) filter.type = type;

    const payments = await PaymentHistory.find(filter)
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PaymentHistory.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Payment Details
router.get("/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await PaymentHistory.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Payment Status (Manual override for admin)
router.put("/:paymentId/status", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, notes } = req.body;

    const payment = await PaymentHistory.findByIdAndUpdate(
      paymentId,
      { 
        status, 
        notes: notes || `Status updated to ${status}`,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({
      success: true,
      message: `Payment status updated to ${status}`,
      payment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Razorpay Webhook Handler
router.post("/webhook/razorpay", async (req, res) => {
  try {
    const event = req.body;
    
    // Verify webhook signature (in production)
    // const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    // const signature = req.headers['x-razorpay-signature'];
    
    switch (event.event) {
      case 'payment.captured':
        await PaymentController.verifyPayment({
          body: {
            razorpay_order_id: event.payload.payment.entity.order_id,
            razorpay_payment_id: event.payload.payment.entity.id,
            razorpay_signature: event.payload.payment.entity.signature,
            paymentId: event.payload.payment.entity.notes?.paymentId
          }
        });
        break;
        
      case 'payment.failed':
        await PaymentController.handlePaymentFailure({
          body: {
            paymentId: event.payload.payment.entity.notes?.paymentId,
            reason: event.payload.payment.entity.error?.description,
            errorCode: event.payload.payment.entity.error?.code
          }
        });
        break;
        
      default:
        console.log(`Unhandled event: ${event.event}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

module.exports = router;
