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

module.exports = PaymentController;[plugin:vite:react-babel] C:\M Business\M Business\src\components\AdminProposalManagement.jsx: Unexpected token, expected "," (969:6)
  972 |           title="Proposal Details"
C:/M Business/M Business/src/components/AdminProposalManagement.jsx:969:6
994 |              <div style={{
995 |                display: "grid",
996 |                gridTemplateColumns: "repeat(2, 1fr)",
    |      ^
997 |                gap: 12,
998 |                fontSize: 12,
    at constructor (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:365:19)
    at JSXParserMixin.raise (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:6599:19)
    at JSXParserMixin.unexpected (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:6619:16)
    at JSXParserMixin.expect (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:6899:12)
    at JSXParserMixin.parseParenAndDistinguishExpression (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:11661:14)
    at JSXParserMixin.parseExprAtom (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:11331:23)
    at JSXParserMixin.parseExprAtom (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:4764:20)
    at JSXParserMixin.parseExprSubscripts (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:11081:23)
    at JSXParserMixin.parseUpdate (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:11066:21)
    at JSXParserMixin.parseMaybeUnary (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:11046:23)
    at JSXParserMixin.parseMaybeUnaryOrPrivate (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:10899:61)
    at JSXParserMixin.parseExprOps (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:10904:23)
    at JSXParserMixin.parseMaybeConditional (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:10881:23)
    at JSXParserMixin.parseMaybeAssign (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:10831:21)
    at JSXParserMixin.parseExpressionBase (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:10784:23)
    at C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:10780:39
    at JSXParserMixin.allowInAnd (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:12421:16)
    at JSXParserMixin.parseExpression (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:10780:17)
    at JSXParserMixin.parseReturnStatement (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:13142:28)
    at JSXParserMixin.parseStatementContent (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:12798:21)
    at JSXParserMixin.parseStatementLike (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:12767:17)
    at JSXParserMixin.parseStatementListItem (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:12747:17)
    at JSXParserMixin.parseBlockOrModuleBlockBody (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:13316:61)
    at JSXParserMixin.parseBlockBody (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:13309:10)
    at JSXParserMixin.parseBlock (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:13297:10)
    at JSXParserMixin.parseFunctionBody (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:12100:24)
    at JSXParserMixin.parseFunctionBodyAndFinish (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:12086:10)
    at C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:13445:12
    at JSXParserMixin.withSmartMixTopicForbiddingContext (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:12403:14)
    at JSXParserMixin.parseFunction (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:13444:10)
    at JSXParserMixin.parseExportDefaultExpression (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:13907:19)
    at JSXParserMixin.parseExport (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:13828:25)
    at JSXParserMixin.parseStatementContent (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:12878:27)
    at JSXParserMixin.parseStatementLike (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:12767:17)
    at JSXParserMixin.parseModuleItem (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:12744:17)
    at JSXParserMixin.parseBlockOrModuleBlockBody (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:13316:36)
    at JSXParserMixin.parseBlockBody (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:13309:10)
    at JSXParserMixin.parseProgram (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:12622:10)
    at JSXParserMixin.parseTopLevel (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:12612:25)
    at JSXParserMixin.parse (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:14488:25)
    at parse (C:\M Business\M Business\node_modules\@babel\parser\lib\index.js:14522:38)
    at parser (C:\M Business\M Business\node_modules\@babel\core\lib\parser\index.js:41:34)
    at parser.next (<anonymous>)
    at normalizeFile (C:\M Business\M Business\node_modules\@babel\core\lib\transformation\normalize-file.js:64:37)
    at normalizeFile.next (<anonymous>)
    at run (C:\M Business\M Business\node_modules\@babel\core\lib\transformation\index.js:22:50)
    at run.next (<anonymous>)
    at transform (C:\M Business\M Business\node_modules\@babel\core\lib\transform.js:22:33)
    at transform.next (<anonymous>)
    at step (C:\M Business\M Business\node_modules\gensync\index.js:261:32)
Click outside, press Esc key, or fix the code to dismiss.
You can also disable this overlay by setting server.hmr.overlay to false in vite.config.js.