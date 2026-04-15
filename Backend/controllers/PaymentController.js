const PaymentHistory = require("../models/PaymentHistoryModel");
const Subscription = require("../models/SubscriptionModel");
const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class PaymentController {

  static async createPaymentOrder(req, res) {
    try {
      const { amount, currency = "INR", receipt, notes } = req.body;

      const razorpayOrder = await razorpay.orders.create({
        amount: amount * 100,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes
      });

      const payment = new PaymentHistory({
        userId: req.user?.id || req.body.userId,
        userEmail: req.body.userEmail,
        amount,
        currency,
        type: req.body.type || "subscription",
        description: req.body.description,
        status: "pending",
        paymentId: razorpayOrder.id,
        planName: req.body.planName,
        planDuration: req.body.planDuration,
        notes: JSON.stringify({ orderId: razorpayOrder.id })
      });

      await payment.save();

      res.status(201).json({
        success: true,
        order: razorpayOrder,
        payment
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async verifyPayment(req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        paymentId
      } = req.body;

      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid signature" });
      }

      const payment = await PaymentHistory.findOneAndUpdate(
        { paymentId: razorpay_order_id },
        {
          status: "completed",
          paymentMethod: req.body.paymentMethod || "card",
          paymentDetails: req.body.paymentDetails || {},
          receiptUrl: `https://razorpay.com/payment/${razorpay_payment_id}`,
          paymentDate: new Date()
        },
        { new: true }
      );

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (payment.type === "subscription" && payment.subscriptionId) {
        await Subscription.findByIdAndUpdate(payment.subscriptionId, {
          status: "active",
          isFullyPaid: true,
          updatedAt: new Date()
        });
      }

      res.json({
        success: true,
        message: "Payment verified successfully",
        payment
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async handlePaymentFailure(req, res) {
    try {
      const { paymentId, reason, errorCode } = req.body;

      const payment = await PaymentHistory.findOneAndUpdate(
        { paymentId },
        {
          status: "failed",
          notes: `Payment failed: ${reason} (Error: ${errorCode})`,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json({
        success: true,
        message: "Payment failure recorded",
        payment
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async processRefund(req, res) {
    try {
      const { paymentId, refundAmount, reason } = req.body;

      const payment = await PaymentHistory.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (payment.status !== "completed") {
        return res.status(400).json({ error: "Can only refund completed payments" });
      }

      const refund = new PaymentHistory({
        userId: payment.userId,
        userEmail: payment.userEmail,
        subscriptionId: payment.subscriptionId,
        paymentId: `REFUND-${Date.now()}`,
        amount: refundAmount || payment.amount,
        currency: payment.currency,
        type: payment.type,
        invoiceNo: payment.invoiceNo,
        quotationNo: payment.quotationNo,
        description: `Refund for: ${payment.description}`,
        status: "refunded",
        paymentMethod: payment.paymentMethod,
        paymentDetails: payment.paymentDetails,
        providerCompany: payment.providerCompany,
        providerGst: payment.providerGst,
        providerAddress: payment.providerAddress,
        paymentDate: new Date(),
        planName: payment.planName,
        planDuration: payment.planDuration,
        notes: `Refund reason: ${reason}`
      });

      await refund.save();

      payment.status = "refunded";
      await payment.save();

      res.json({
        success: true,
        message: "Refund processed successfully",
        refund
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPaymentStats(req, res) {
    try {
      const { userId, startDate, endDate } = req.query;

      const matchQuery = {};
      if (userId) matchQuery.userId = userId;
      if (startDate || endDate) {
        matchQuery.paymentDate = {};
        if (startDate) matchQuery.paymentDate.$gte = new Date(startDate);
        if (endDate) matchQuery.paymentDate.$lte = new Date(endDate);
      }

      const stats = await PaymentHistory.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" }
          }
        }
      ]);

      const totalStats = await PaymentHistory.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalRevenue: { $sum: "$amount" },
            avgAmount: { $avg: "$amount" }
          }
        }
      ]);

      res.json({
        success: true,
        stats: stats,
        total: totalStats[0] || { totalPayments: 0, totalRevenue: 0, avgAmount: 0 }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPaymentMethods(req, res) {
    try {
      const { userId } = req.query;

      const matchQuery = userId ? { userId } : {};

      const methods = await PaymentHistory.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" }
          }
        }
      ]);

      res.json({
        success: true,
        methods
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = PaymentController;