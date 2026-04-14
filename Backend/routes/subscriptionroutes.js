const express = require("express");
const router = express.Router();
const Subscription = require("../models/SubscriptionModel");
const PaymentHistory = require("../models/PaymentHistoryModel");

// Get current subscription for a user or company
router.get("/current/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findOne({ 
      $or: [{ userId: id }, { companyId: id }],
      status: { $in: ["active", "pending", "expired"] }
    }).sort({ createdAt: -1 });
    
    if (!subscription) {
      return res.json({ 
        hasSubscription: false,
        message: "No subscription found" 
      });
    }
    
    res.json({
      hasSubscription: true,
      subscription
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subscription by email
router.get("/by-email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const subscription = await Subscription.findOne({ 
      userEmail: email,
      status: { $in: ["active", "pending"] }
    }).sort({ createdAt: -1 });
    
    if (!subscription) {
      return res.json({ 
        hasSubscription: false,
        message: "No active subscription found" 
      });
    }
    
    res.json({
      hasSubscription: true,
      subscription
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update subscription
router.post("/create", async (req, res) => {
  try {
    const subscriptionData = req.body;
    
    // Deactivate any existing active subscription for this user
    await Subscription.updateMany(
      { userId: subscriptionData.userId, status: "active" },
      { status: "cancelled", updatedAt: new Date() }
    );
    
    const subscription = new Subscription(subscriptionData);
    await subscription.save();
    
    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      subscription
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subscription
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    updateData.updatedAt = new Date();
    
    const subscription = await Subscription.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    
    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all subscriptions for admin
router.get("/all", async (req, res) => {
  try {
    const subscriptions = await Subscription.find().sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PAYMENT HISTORY ROUTES ============

// Get payment history for a user
router.get("/payments/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await PaymentHistory.find({ userId })
      .sort({ paymentDate: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment history by email
router.get("/payments/by-email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const payments = await PaymentHistory.find({ userEmail: email })
      .sort({ paymentDate: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create payment record
router.post("/payments/create", async (req, res) => {
  try {
    const paymentData = req.body;
    
    // Generate payment ID if not provided
    if (!paymentData.paymentId) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      paymentData.paymentId = `PAY-${timestamp}-${random}`;
    }
    
    const payment = new PaymentHistory(paymentData);
    await payment.save();
    
    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment status
router.put("/payments/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const payment = await PaymentHistory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    
    res.json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoices for a user
router.get("/invoices/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await PaymentHistory.find({ 
      userId, 
      invoiceNo: { $exists: true, $ne: null }
    }).sort({ paymentDate: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quotations for a user
router.get("/quotations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await PaymentHistory.find({ 
      userId, 
      quotationNo: { $exists: true, $ne: null }
    }).sort({ paymentDate: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed sample data for a user (for testing/demo)
router.post("/seed/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, name } = req.body;
    
    // Create sample subscription
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    
    const subscription = new Subscription({
      userId,
      companyId: userId, // Assuming userId is companyId for subadmins
      userEmail: email,
      userName: name,
      planName: "Professional",
      planPrice: 2999,
      billingCycle: "monthly",
      status: "active",
      isFullyPaid: true,
      startDate: new Date(),
      endDate: endDate,
      nextBillingDate: nextBilling,
      features: [
        "Unlimited Clients",
        "Unlimited Projects",
        "Invoice Generation",
        "Quotation Management",
        "Priority Support",
        "Cloud Storage 50GB"
      ],
      paymentMethod: "card",
      providerCompany: "M Business",
      providerEmail: "billing@mbusiness.com",
      providerPhone: "+91-9876543210",
      invoiceRefs: ["INV-SUB-001"],
      quotationRefs: ["QUO-SUB-001"]
    });
    
    await subscription.save();
    
    // Create sample payment history
    const timestamp = Date.now();
    const payment1 = new PaymentHistory({
      userId,
      userEmail: email,
      subscriptionId: subscription._id,
      paymentId: `PAY-${timestamp}-001`,
      amount: 2999,
      currency: "INR",
      type: "subscription",
      invoiceNo: `INV-SUB-${timestamp}-001`,
      quotationNo: `QUO-SUB-${timestamp}-001`,
      description: "Professional Plan - Monthly Subscription",
      status: "completed",
      paymentMethod: "card",
      paymentDetails: {
        cardLast4: "4242"
      },
      providerCompany: "M Business",
      providerGst: "GSTIN-33AABCM1234Z1Z1",
      providerAddress: "M Business Pvt Ltd, 123 Tech Park, Chennai - 600001, Tamil Nadu, India",
      paymentDate: new Date(),
      planName: "Professional",
      planDuration: "monthly"
    });
    
    await payment1.save();
    
    // Add another historical payment
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 1);
    
    const payment2 = new PaymentHistory({
      userId,
      userEmail: email,
      paymentId: `PAY-${timestamp}-000`,
      amount: 1999,
      currency: "INR",
      type: "subscription",
      invoiceNo: `INV-SUB-${timestamp}-000`,
      description: "Starter Plan - Monthly Subscription",
      status: "completed",
      paymentMethod: "upi",
      paymentDetails: {
        upiId: "user@okaxis"
      },
      providerCompany: "M Business",
      providerGst: "GSTIN-33AABCM1234Z1Z1",
      providerAddress: "M Business Pvt Ltd, 123 Tech Park, Chennai - 600001, Tamil Nadu, India",
      paymentDate: pastDate,
      planName: "Starter",
      planDuration: "monthly"
    });
    
    await payment2.save();
    
    res.json({
      success: true,
      message: "Sample subscription data seeded successfully",
      subscription,
      payments: [payment1, payment2]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subscription status for employee dashboard
router.get("/employee-status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();

    const subscription = await Subscription.findOne({
      $or: [{ userId }, { companyId: userId }],
      status: { $in: ["active", "expired", "grace_period", "hidden"] }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.json({
        hasSubscription: false,
        message: "No subscription found"
      });
    }

    const daysUntilExpiry = subscription.endDate
      ? Math.ceil((new Date(subscription.endDate) - now) / (1000 * 60 * 60 * 24))
      : null;

    const daysSinceExpiry = daysUntilExpiry < 0 ? Math.abs(daysUntilExpiry) : 0;
    const inGracePeriod = subscription.status === "expired" || subscription.status === "grace_period";
    const isHidden = subscription.status === "hidden";
    
    // 60-day restriction: hide subscription details if expired for more than 60 days
    const shouldHideSubscription = daysSinceExpiry > 60;
    
    if (shouldHideSubscription && subscription.status !== "hidden") {
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "hidden"
      });
    }

    res.json({
      hasSubscription: subscription.status === "active" || inGracePeriod,
      subscription: shouldHideSubscription ? null : {
        planName: subscription.planName,
        status: subscription.status,
        endDate: subscription.endDate,
        daysUntilExpiry,
        inGracePeriod,
        isHidden: shouldHideSubscription || isHidden,
        reminderSent: subscription.reminderSent,
        reminderSentAt: subscription.reminderSentAt
      },
      notification: subscription.reminderSent && daysUntilExpiry <= 10 && daysUntilExpiry > 0
        ? {
            type: "renewal",
            message: `Your ${subscription.planName} subscription expires in ${daysUntilExpiry} days. Please renew soon.`,
            daysLeft: daysUntilExpiry
          }
        : inGracePeriod && daysSinceExpiry <= 60
        ? {
            type: "expired",
            message: `Your ${subscription.planName} subscription has expired. Please contact your administrator to renew.`,
            daysSinceExpiry
          }
        : shouldHideSubscription || isHidden
        ? {
            type: "hidden",
            message: "Your subscription has expired and is no longer accessible. Please contact your administrator."
          }
        : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle mysubscriptions visibility for subadmin
router.put("/toggle-visibility/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { showSubscriptions } = req.body;

    await Subscription.updateMany(
      { $or: [{ userId }, { companyId: userId }] },
      { showInDashboard: showSubscriptions }
    );

    res.json({
      success: true,
      showSubscriptions,
      message: `Subscriptions ${showSubscriptions ? 'visible' : 'hidden'} in dashboard`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subscription count for subadmin (when showSubscriptions is false)
router.get("/count/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Subscription.countDocuments({
      $or: [{ userId }, { companyId: userId }]
    });

    const activeCount = await Subscription.countDocuments({
      $or: [{ userId }, { companyId: userId }],
      status: "active"
    });

    res.json({
      total: count,
      active: activeCount,
      expired: count - activeCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN ASSIGN PACKAGE TO SUBADMIN ============

// Get all packages assigned to subadmins
router.get("/subadmin-packages", async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ 
      planName: { $in: ["Starter", "Professional", "Enterprise", "Custom"] }
    }).sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign a package to a subadmin
router.post("/assign-to-subadmin", async (req, res) => {
  try {
    const { subadminId, subadminEmail, subadminName, packageId, packageTitle, planPrice, billingCycle, durationDays, notes } = req.body;

    // Calculate end date based on duration
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (durationDays || 30));

    // Create subscription for subadmin
    const subscription = new Subscription({
      userId: subadminId,
      userEmail: subadminEmail,
      userName: subadminName,
      planName: packageTitle || "Custom",
      planPrice: planPrice || 0,
      billingCycle: billingCycle || "monthly",
      status: "active",
      isFullyPaid: true,
      startDate,
      endDate,
      nextBillingDate: endDate,
      features: ["Subadmin Package"],
      paymentMethod: "other",
      notes: notes || `Package assigned by admin`
    });

    await subscription.save();

    res.status(201).json({
      success: true,
      message: `Package assigned to ${subadminName} successfully`,
      subscription
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subadmin's assigned packages
router.get("/subadmin/:subadminId", async (req, res) => {
  try {
    const { subadminId } = req.params;
    const subscriptions = await Subscription.find({ 
      userId: subadminId,
      status: { $in: ["active", "pending", "expired"] }
    }).sort({ createdAt: -1 });
    
    res.json({
      hasSubscription: subscriptions.length > 0,
      subscriptions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
