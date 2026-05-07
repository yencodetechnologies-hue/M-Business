const express = require("express");
const router = express.Router();
const Subscription = require("../models/SubscriptionModel");
const PaymentHistory = require("../models/PaymentHistoryModel");
const User = require("../models/UserModels");
const Package = require("../models/PackageModel");
const { sendQuickEmail, sendTrialWelcome, sendUsageLimitAlert, sendSubscriptionSuccess } = require("../config/email");

// ─── Get current subscription ───────────────────────────────────────────────
router.get("/current/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findOne({
      $or: [{ userId: id }, { companyId: id }],
      status: { $in: ["active", "pending", "expired", "trial"] }
    }).sort({ createdAt: -1 });

    if (!subscription) return res.json({ hasSubscription: false, message: "No subscription found" });

    // Retroactive fix: If trial but no payment history exists, create one
    if (subscription.isTrial || subscription.planName === "Trial" || subscription.planName === "Free") {
      const targetUserId = subscription.userId || id;
      console.log(`[DEBUG] Checking retroactive trial invoice for userId: ${targetUserId}`);
      const existingPayment = await PaymentHistory.findOne({ userId: targetUserId, type: "subscription" });
      if (!existingPayment) {
        console.log(`[DEBUG] No trial invoice found. Creating one...`);
        const ts = Date.now();
        const trialPayment = new PaymentHistory({
          userId: targetUserId,
          userEmail: subscription.userEmail,
          subscriptionId: subscription._id,
          paymentId: `TRIAL-FIX-${ts}`,
          amount: 0,
          currency: "INR",
          type: "subscription",
          invoiceNo: `INV-TRIAL-${ts}`,
          description: "Free 30-day trial registration",
          status: "completed",
          paymentMethod: "other",
          paymentDate: subscription.startDate || new Date(),
          planName: "Free Trial",
          planDuration: "trial",
          providerCompany: "M Business"
        });
        await trialPayment.save();
        console.log(`[DEBUG] Retroactive trial invoice created: ${trialPayment.invoiceNo}`);
      } else {
        console.log(`[DEBUG] Existing trial invoice found: ${existingPayment.invoiceNo}`);
      }
    }

    res.json({ hasSubscription: true, subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get subscription by email ──────────────────────────────────────────────
router.get("/by-email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const subscription = await Subscription.findOne({
      userEmail: email,
      status: { $in: ["active", "pending"] }
    }).sort({ createdAt: -1 });

    if (!subscription) return res.json({ hasSubscription: false });
    res.json({ hasSubscription: true, subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Free 30-Day Trial ─────────────────────────────────────────────────
router.post("/start-trial", async (req, res) => {
  try {
    const { userId, userEmail, userName } = req.body;
    if (!userId || !userEmail) return res.status(400).json({ error: "userId and userEmail required" });

    // Check if already had a trial
    const existingTrial = await Subscription.findOne({ userId, isTrial: true });
    if (existingTrial) {
      return res.status(400).json({ error: "Trial already used. Please choose a paid plan." });
    }

    // Deactivate old subscriptions
    await Subscription.updateMany({ userId, status: "active" }, { status: "cancelled", updatedAt: new Date() });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const subscription = new Subscription({
      userId,
      companyId: userId,
      userEmail,
      userName: userName || "User",
      planName: req.body.planName || "Free",
      isTrial: true,
      planPrice: 0,
      billingCycle: "trial",
      status: "active",
      isFullyPaid: true,
      startDate,
      endDate,
      nextBillingDate: endDate,
      usageLimit: 999,
      usageCount: 0,
      features: req.body.features || ["30 Days Free Trial", "1 Company Name", "1 Employee", "", "Basic Reports", "Email Support"],
      clientLimit: req.body.clientLimit || "1 Company manage",
      employeeLimit: req.body.employeeLimit || "1 Employee manage",
      managerLimit: req.body.managerLimit || "",
      businessLimit: req.body.businessLimit || "",
      paymentMethod: "other",
      providerCompany: "M Business",
      notes: req.body.planName ? `Free 30-day trial for ${req.body.planName}` : "Free 30-day trial"
    });

    const subRecord = await subscription.save();

    // Create a $0 "Trial" Invoice record in PaymentHistory
    const ts = Date.now();
    const trialPayment = new PaymentHistory({
      userId,
      userEmail,
      subscriptionId: subRecord._id,
      paymentId: `TRIAL-${ts}`,
      amount: 0,
      currency: "INR",
      type: "subscription",
      invoiceNo: `INV-TRIAL-${ts}`,
      description: "Free 30-day trial registration",
      status: "completed",
      paymentMethod: "other",
      paymentDate: new Date(),
      planName: "Free Trial",
      planDuration: "trial",
      providerCompany: "M Business"
    });
    await trialPayment.save();

    // Update user mySubscriptions
    await User.findByIdAndUpdate(userId, { mySubscriptions: true, numberOfSubscriptions: 1 }).catch(() => { });

    // Send trial welcome email
    try {
      await sendTrialWelcome(userEmail, userName || "User", endDate);
    } catch (mailErr) {
      console.log("Trial welcome email failed:", mailErr.message);
    }

    res.status(201).json({ success: true, message: "30-day free trial started!", subscription: subRecord, payment: trialPayment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Create / Update Subscription ───────────────────────────────────────────
router.post("/create", async (req, res) => {
  try {
    const data = req.body;

    await Subscription.updateMany(
      { userId: data.userId, status: "active" },
      { status: "cancelled", updatedAt: new Date() }
    );

    const subscription = new Subscription(data);
    await subscription.save();

    await User.findByIdAndUpdate(data.userId, { mySubscriptions: true }).catch(() => { });

    // Send subscription success email
    try {
      await sendSubscriptionSuccess(data.userEmail, data.userName || "User", data.planName, data.startDate, data.endDate);
    } catch (mailErr) {
      console.log("Subscription success email failed:", mailErr.message);
    }

    res.status(201).json({ success: true, subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Update subscription ─────────────────────────────────────────────────────
router.put("/update/:id", async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: new Date() };
    const sub = await Subscription.findByIdAndUpdate(req.params.id, data, { returnDocument: "after" });
    if (!sub) return res.status(404).json({ error: "Subscription not found" });
    res.json({ success: true, subscription: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── All subscriptions (admin) ───────────────────────────────────────────────
router.get("/all", async (req, res) => {
  try {
    const subs = await Subscription.find().sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Increment usage count ───────────────────────────────────────────────────
router.post("/increment-usage/:id", async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Subscription not found" });

    sub.usageCount = (sub.usageCount || 0) + 1;

    const limit = sub.usageLimit || 999;
    const percent = (sub.usageCount / limit) * 100;

    // Auto-alert when ≥80% used
    if (percent >= 80 && !sub.usageLimitAlertSent) {
      try {
        await sendUsageLimitAlert(sub.userEmail, sub.userName || "User", sub.planName, sub.usageCount, limit);
        sub.usageLimitAlertSent = true;
      } catch (e) { console.log("Usage alert email failed:", e.message); }
    }

    await sub.save();
    res.json({ success: true, usageCount: sub.usageCount, usageRemaining: Math.max(0, limit - sub.usageCount) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Employee/SubAdmin subscription status ────────────────────────────────────
router.get("/employee-status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();

    // Check by userId OR companyId (for employees under a subadmin)
    const subscription = await Subscription.findOne({
      $or: [{ userId }, { companyId: userId }],
      status: { $in: ["active", "expired", "grace_period", "hidden"] }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.json({
        hasSubscription: false,
        notification: { type: "none", message: "No active subscription found." }
      });
    }

    const daysUntilExpiry = subscription.endDate
      ? Math.ceil((new Date(subscription.endDate) - now) / (1000 * 60 * 60 * 24))
      : null;

    const daysSinceExpiry = daysUntilExpiry !== null && daysUntilExpiry < 0 ? Math.abs(daysUntilExpiry) : 0;
    const isExpired = subscription.status === "expired" || (daysUntilExpiry !== null && daysUntilExpiry <= 0);
    const isHidden = subscription.status === "hidden" || daysSinceExpiry > 60;

    // Auto-hide after 60 days
    if (isHidden && subscription.status !== "hidden") {
      await Subscription.findByIdAndUpdate(subscription._id, { status: "hidden", hiddenAt: now });
    }

    // Build notification
    let notification = null;

    if (isHidden) {
      notification = {
        type: "hidden",
        message: "Your subscription has expired. Please contact your administrator to renew."
      };
    } else if (isExpired) {
      notification = {
        type: "expired",
        message: `Your ${subscription.planName} plan has expired. Contact your administrator.`,
        daysSinceExpiry
      };
    } else if (daysUntilExpiry !== null && daysUntilExpiry <= 10) {
      notification = {
        type: "renewal",
        message: `Your ${subscription.planName} plan expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}. Please renew soon.`,
        daysLeft: daysUntilExpiry
      };
    }

    res.json({
      hasSubscription: !isExpired && !isHidden,
      isHidden,
      subscription: isHidden ? null : {
        ...subscription.toObject(),
        daysUntilExpiry,
        usageRemaining: Math.max(0, (subscription.usageLimit || 999) - (subscription.usageCount || 0))
      },
      notification
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── mySubscriptions visibility toggle ──────────────────────────────────────
router.put("/toggle-visibility/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { showSubscriptions } = req.body;
    await Subscription.updateMany(
      { $or: [{ userId }, { companyId: userId }] },
      { showInDashboard: showSubscriptions }
    );
    await User.findByIdAndUpdate(userId, { mySubscriptions: showSubscriptions }).catch(() => { });
    res.json({ success: true, showSubscriptions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Subscription count for user ─────────────────────────────────────────────
router.get("/count/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const total = await Subscription.countDocuments({ $or: [{ userId }, { companyId: userId }] });
    const active = await Subscription.countDocuments({ $or: [{ userId }, { companyId: userId }], status: "active" });
    res.json({ total, active, expired: total - active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Payment History ──────────────────────────────────────────────────────────
router.get("/payments/:userId", async (req, res) => {
  try {
    const payments = await PaymentHistory.find({ userId: req.params.userId }).sort({ paymentDate: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/payments/by-email/:email", async (req, res) => {
  try {
    const payments = await PaymentHistory.find({ userEmail: req.params.email }).sort({ paymentDate: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/payments/create", async (req, res) => {
  try {
    const data = req.body;
    if (!data.paymentId) {
      data.paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;
    }
    const payment = new PaymentHistory(data);
    await payment.save();
    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/payments/update/:id", async (req, res) => {
  try {
    const payment = await PaymentHistory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/invoices/:userId", async (req, res) => {
  try {
    const payments = await PaymentHistory.find({ userId: req.params.userId, invoiceNo: { $exists: true, $ne: null } }).sort({ paymentDate: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/quotations/:userId", async (req, res) => {
  try {
    const payments = await PaymentHistory.find({ userId: req.params.userId, quotationNo: { $exists: true, $ne: null } }).sort({ paymentDate: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Assign package to subadmin ───────────────────────────────────────────────
router.post("/assign-to-subadmin", async (req, res) => {
  try {
    const { 
      subadminId, subadminEmail, subadminName, 
      packageId, packageTitle, planPrice, billingCycle, 
      durationDays, features, notes,
      clientLimit, employeeLimit, managerLimit, businessLimit 
    } = req.body;

    const assignedPackage = packageId ? await Package.findById(packageId) : null;

    // ── FIXED: Normalize limit to "N Type" format for consistent parsing ──
    const normalizeLimit = (rawVal, pkgVal, label) => {
      const val = (rawVal && rawVal !== "") ? rawVal : (pkgVal || "");
      if (!val) return "";
      const s = String(val).toLowerCase();
      if (s.includes("unlimited")) return "Unlimited";
      const m = s.match(/\d+/);
      if (m) return `${m[0]} ${label}`;  // e.g. "6 Employees"
      return val;
    };

    const resolvedClientLimit   = normalizeLimit(clientLimit,   assignedPackage?.clientLimit,   "Clients");
    const resolvedEmployeeLimit = normalizeLimit(employeeLimit, assignedPackage?.employeeLimit, "Employees");
    const resolvedManagerLimit  = normalizeLimit(managerLimit,  assignedPackage?.managerLimit,  "Managers");
    const resolvedBusinessLimit = normalizeLimit(businessLimit, assignedPackage?.businessLimit, "Business");

    console.log("[ASSIGN] Normalized limits:", {
      resolvedClientLimit,
      resolvedEmployeeLimit,
      resolvedManagerLimit,
    });

    await Subscription.updateMany(
      { userId: subadminId, status: { $in: ["active", "trial", "pending", "grace_period"] } },
      { status: "cancelled", updatedAt: new Date() }
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (parseInt(durationDays) || 30));

    const sub = new Subscription({
      userId: subadminId,
      companyId: subadminId,
      userEmail: subadminEmail,
      userName: subadminName,
      packageId,
      planName: packageTitle || "Custom",
      planPrice: planPrice || 0,
      billingCycle: billingCycle || "monthly",
      status: "active",
      isFullyPaid: true,
      startDate, endDate,
      nextBillingDate: endDate,
      usageLimit: 999,
      features: features || [packageTitle || "Subadmin Package"],
      clientLimit: resolvedClientLimit,
      employeeLimit: resolvedEmployeeLimit,
      managerLimit: resolvedManagerLimit,
      businessLimit: resolvedBusinessLimit,
      paymentMethod: "other",
      notes: notes || "Package assigned by admin"
    });

    await sub.save();

    console.log("[ASSIGN] Saved subscription:", {
      clientLimit: sub.clientLimit,
      employeeLimit: sub.employeeLimit,
      managerLimit: sub.managerLimit,
    });

    await User.findByIdAndUpdate(subadminId, { mySubscriptions: true }).catch(() => {});

    res.status(201).json({ success: true, subscription: sub });
  } catch (err) {
    console.error("[ASSIGN ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Get subadmin's subscriptions ────────────────────────────────────────────
router.get("/subadmin/:subadminId", async (req, res) => {
  try {
    const subs = await Subscription.find({
      userId: req.params.subadminId,
      status: { $in: ["active", "pending", "expired"] }
    }).sort({ createdAt: -1 });
    res.json({ hasSubscription: subs.length > 0, subscriptions: subs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Seed sample data ─────────────────────────────────────────────────────────
router.post("/seed/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, name, planName, planPrice, features } = req.body;

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const sub = new Subscription({
      userId, companyId: userId,
      userEmail: email, userName: name,
      planName: planName || "Professional",
      planPrice: planPrice !== undefined ? planPrice : 2999,
      billingCycle: "monthly",
      status: "active", isFullyPaid: true,
      startDate: new Date(), endDate, nextBillingDate: endDate,
      usageLimit: 999,
      features: features || ["Unlimited Clients", "Unlimited Projects", "Invoice Generation", "Quotation Management", "Priority Support"],
      paymentMethod: "card",
      invoiceRefs: ["INV-SUB-001"], quotationRefs: ["QUO-SUB-001"]
    });
    await sub.save();

    const ts = Date.now();
    const p1 = new PaymentHistory({
      userId, userEmail: email, subscriptionId: sub._id,
      paymentId: `PAY-${ts}-001`, amount: planPrice || 2999, currency: "INR",
      type: "subscription", invoiceNo: `INV-SUB-${ts}-001`, quotationNo: `QUO-SUB-${ts}-001`,
      description: `${planName || "Professional"} Plan - Monthly Subscription`,
      status: "completed", paymentMethod: "card",
      providerCompany: "M Business", providerGst: "GSTIN-33AABCM1234Z1Z1",
      providerAddress: "M Business Support, India",
      paymentDate: new Date(), planName: planName || "Professional", planDuration: "monthly"
    });
    await p1.save();

    res.json({ success: true, subscription: sub, payment: p1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Manual fix for missing trial invoices ───────────────────────────────────
router.post("/fix-invoices/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const subscription = await Subscription.findOne({
      $or: [{ userId }, { companyId: userId }],
      status: { $in: ["active", "trial"] }
    }).sort({ createdAt: -1 });

    if (!subscription) return res.status(404).json({ error: "No active subscription found" });

    const existingPayment = await PaymentHistory.findOne({ userId, type: "subscription" });
    if (existingPayment) return res.json({ success: true, message: "Invoice already exists", payment: existingPayment });

    const ts = Date.now();
    const trialPayment = new PaymentHistory({
      userId: userId,
      userEmail: subscription.userEmail,
      subscriptionId: subscription._id,
      paymentId: `TRIAL-MANUAL-${ts}`,
      amount: 0,
      currency: "INR",
      type: "subscription",
      invoiceNo: `INV-TRIAL-${ts}`,
      description: "Free 30-day trial registration",
      status: "completed",
      paymentMethod: "other",
      paymentDate: subscription.startDate || new Date(),
      planName: "Free Trial",
      planDuration: "trial",
      providerCompany: "M Business"
    });
    await trialPayment.save();
    res.json({ success: true, message: "Trial invoice generated!", payment: trialPayment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
