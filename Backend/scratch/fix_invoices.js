const mongoose = require("mongoose");
require("dotenv").config();
const Subscription = require("../models/SubscriptionModel");
const PaymentHistory = require("../models/PaymentHistoryModel");

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/m_business");
    const subs = await Subscription.find({ status: "active" });
    console.log("Active Subscriptions:", subs.length);
    for (const s of subs) {
      const payments = await PaymentHistory.find({ userId: s.userId });
      console.log(`User: ${s.userEmail}, Payments: ${payments.length}`);
      if (s.isTrial && payments.length === 0) {
        console.log(`Creating trial invoice for ${s.userEmail}`);
        const ts = Date.now();
        const p = new PaymentHistory({
          userId: s.userId,
          userEmail: s.userEmail,
          subscriptionId: s._id,
          paymentId: `TRIAL-FORCED-${ts}`,
          amount: 0,
          currency: "INR",
          type: "subscription",
          invoiceNo: `INV-TRIAL-${ts}`,
          description: "Free 30-day trial registration",
          status: "completed",
          paymentMethod: "other",
          paymentDate: s.startDate || new Date(),
          planName: "Free Trial",
          planDuration: "trial",
          providerCompany: "M Business"
        });
        await p.save();
        console.log(`Saved invoice: ${p.invoiceNo}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
  process.exit();
}
check();
