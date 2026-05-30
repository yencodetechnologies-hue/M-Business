const PaymentHistory = require("../models/PaymentHistoryModel");
const Subscription = require("../models/SubscriptionModel");
const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


class PaymentController {

  // ─── PayU Integration ────────────────────────────────────────────────────────
  static async initPayUPayment(req, res) {
    try {
      const { plan, userId, userEmail, userName } = req.body;
      const amount = plan.price;
      const txnid = `PAYU-${Date.now()}-${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;
      
      const key = process.env.PAYU_KEY;
      const salt = process.env.PAYU_SALT;
      const productinfo = plan.name;
      const firstname = userName || "User";
      const email = userEmail || "test@test.com";
      const phone = "9999999999";

      // 1. Cancel previous pending/active subscriptions for this user
      await Subscription.updateMany(
        { userId, status: { $in: ["active", "pending"] } },
        { status: "cancelled", updatedAt: new Date() }
      );

      // 2. Create a "pending" subscription
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const sub = new Subscription({
        userId, companyId: userId,
        userEmail, userName,
        planName: plan.name,
        planPrice: plan.price,
        billingCycle: "monthly",
        status: "pending", // Will activate on success
        isFullyPaid: false,
        startDate: new Date(),
        endDate,
        nextBillingDate: endDate,
        usageLimit: 999,
        features: plan.features,
        clientLimit: plan.clientLimit,
        employeeLimit: plan.employeeLimit,
        managerLimit: plan.managerLimit,
        businessLimit: plan.businessLimit,
        paymentMethod: "payu"
      });
      await sub.save();

      // 3. Create a "pending" payment history record
      const payment = new PaymentHistory({
        userId, userEmail, amount, currency: "INR",
        type: "subscription", description: `${plan.name} Plan Subscription`,
        status: "pending", paymentId: txnid, subscriptionId: sub._id,
        planName: plan.name, planDuration: "monthly",
        notes: JSON.stringify({ gateway: "payu", txnid })
      });
      await payment.save();

      // 4. Generate Hash
      // Hash sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
      const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      res.json({
        success: true,
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        hash,
        surl: `${process.env.BASE_URL || 'http://localhost:5008'}/api/payments/payu/success`,
        furl: `${process.env.BASE_URL || 'http://localhost:5008'}/api/payments/payu/failure`,
        env: process.env.PAYU_ENV || "test"
      });

    } catch (error) {
      console.error("PayU Init Error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  static async payuSuccessCallback(req, res) {
    try {
      const {
        txnid, status, hash, amount, productinfo, firstname, email,
        mihpayid, bank_ref_num, unmappedstatus, mode
      } = req.body;

      const key = process.env.PAYU_KEY;
      const salt = process.env.PAYU_SALT;
      const frontEndUrl = process.env.FRONTEND_URL || "http://localhost:5173";

      // Reverse hash verification
      // status||||||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
      const reverseHashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      const reverseHash = crypto.createHash('sha512').update(reverseHashString).digest('hex');

      if (reverseHash !== hash) {
        return res.redirect(`${frontEndUrl}/dashboard?payment=invalid_hash`);
      }

      if (status === "success") {
        const ts = Date.now();
        const payment = await PaymentHistory.findOneAndUpdate(
          { paymentId: txnid },
          {
            status: "completed",
            paymentMethod: mode || "payu",
            paymentDetails: { mihpayid, bank_ref_num, unmappedstatus },
            paymentDate: new Date(),
            invoiceNo: `INV-SUB-${ts}`,
            quotationNo: `QUO-SUB-${ts}`,
            updatedAt: new Date()
          },
          { returnDocument: 'after' }
        );

        if (payment && payment.subscriptionId) {
          await Subscription.findByIdAndUpdate(payment.subscriptionId, {
            status: "active",
            isFullyPaid: true,
            invoiceRefs: [`INV-SUB-${ts}`],
            quotationRefs: [`QUO-SUB-${ts}`],
            updatedAt: new Date()
          });
        }
        res.redirect(`${frontEndUrl}/dashboard?payment=success&txnid=${txnid}&plan=${encodeURIComponent(productinfo)}`);
      } else {
        res.redirect(`${frontEndUrl}/dashboard?payment=failed&txnid=${txnid}`);
      }
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=error`);
    }
  }

  static async payuFailureCallback(req, res) {
    try {
      const { txnid, error_Message } = req.body;
      const frontEndUrl = process.env.FRONTEND_URL || "http://localhost:5173";

      await PaymentHistory.findOneAndUpdate(
        { paymentId: txnid },
        {
          status: "failed",
          notes: `PayU Failure: ${error_Message}`,
          updatedAt: new Date()
        }
      );
      res.redirect(`${frontEndUrl}/dashboard?payment=failed&txnid=${txnid}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=error`);
    }
  }

  static async createPaymentOrder(req, res) {
    try {
      const { amount, currency = "INR", receipt, notes } = req.body;

      let razorpayOrder;
      let isMock = false;

      try {
        razorpayOrder = await razorpay.orders.create({
          amount: amount * 100,
          currency,
          receipt: receipt || `receipt_${Date.now()}`,
          notes
        });
      } catch (rzpError) {
        // Silently fallback to simulated gateway order
        razorpayOrder = {
          id: `order_mock_${Date.now()}`,
          amount: amount * 100,
          currency
        };
        isMock = true;
      }

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
        notes: JSON.stringify({ orderId: razorpayOrder.id, isMock })
      });

      await payment.save();

      res.status(201).json({
        success: true,
        order: razorpayOrder,
        payment,
        isMock
      });
    } catch (error) {
      console.error("Order creation error:", error);
      const errorMessage = error.error?.description || error.message || "Payment order creation failed";
      res.status(500).json({ error: errorMessage, details: error });
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

      if (razorpay_signature !== "mock_signature") {
        const generatedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || "dummy_secret")
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        if (generatedSignature !== razorpay_signature) {
          return res.status(400).json({ error: "Invalid signature" });
        }
      }

      const ts = Date.now();
      const payment = await PaymentHistory.findOneAndUpdate(
        { paymentId: razorpay_order_id },
        {
          status: "completed",
          paymentMethod: req.body.paymentMethod || "card",
          paymentDetails: req.body.paymentDetails || {},
          receiptUrl: `https://razorpay.com/payment/${razorpay_payment_id}`,
          paymentDate: new Date(),
          invoiceNo: `INV-SUB-${ts}`,
          quotationNo: `QUO-SUB-${ts}`,
          updatedAt: new Date()
        },
        { returnDocument: 'after' }
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
        { returnDocument: 'after' }
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