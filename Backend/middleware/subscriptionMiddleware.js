const Subscription = require("../models/SubscriptionModel");

// Middleware to check if user has active subscription
const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.params.userId || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        message: "User ID required",
        restricted: true 
      });
    }

    const subscription = await Subscription.findOne({
      $or: [{ userId }, { companyId: userId }],
      status: { $in: ["active", "grace_period"] }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(403).json({ 
        message: "No active subscription found. Please contact your administrator.",
        restricted: true,
        needsSubscription: true
      });
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (endDate < now) {
      // Subscription expired
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "expired"
      });
      
      return res.status(403).json({ 
        message: "Subscription expired. Please contact your administrator to renew.",
        restricted: true,
        expired: true
      });
    }

    // Check if subscription expires in 10 days or less
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 10) {
      // Add warning to response headers
      res.set('X-Subscription-Warning', `Subscription expires in ${daysUntilExpiry} days`);
      req.subscriptionWarning = {
        daysLeft: daysUntilExpiry,
        message: `Your subscription expires in ${daysUntilExpiry} days`
      };
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ 
      message: "Error checking subscription",
      restricted: true 
    });
  }
};

// Middleware to check if subscription is expired (for hiding features)
const checkExpiredSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.params.userId || req.body.userId;
    
    if (!userId) {
      return next();
    }

    const subscription = await Subscription.findOne({
      $or: [{ userId }, { companyId: userId }],
      status: { $in: ["active", "grace_period", "expired"] }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      req.isExpired = true;
      return next();
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (endDate < now || subscription.status === "expired") {
      req.isExpired = true;
      req.subscription = subscription;
    } else {
      req.isExpired = false;
      req.subscription = subscription;
    }

    next();
  } catch (error) {
    console.error("Expired subscription check error:", error);
    req.isExpired = true; // Default to restricted on error
    next();
  }
};

// Middleware for admin routes (bypass subscription check)
const adminBypass = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'superadmin') {
    return next();
  }
  checkSubscription(req, res, next);
};

module.exports = {
  checkSubscription,
  checkExpiredSubscription,
  adminBypass
};
