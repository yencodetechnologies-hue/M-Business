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
