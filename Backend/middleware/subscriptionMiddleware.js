const Subscription = require("../models/SubscriptionModel");
const Client = require("../models/ClientModel");
const Employee = require("../models/EmployeeModel");
const Manager = require("../models/ManagerModel");
const User = require("../models/UserModels");

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

// Helper to parse limit strings (e.g., "10 Employees" -> 10, "Unlimited" -> Infinity)
const parseLimit = (limitStr) => {
  if (!limitStr || limitStr.trim() === "") return Infinity; // Default to unlimited if not set, or change to 1/0 based on requirements
  if (limitStr.toLowerCase().includes("unlimited")) return Infinity;
  const match = limitStr.match(/\d+/);
  return match ? parseInt(match[0]) : Infinity;
};

// Middleware to check specific resource limits (Employee, Client, Manager)
const checkResourceLimit = (resourceType) => async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] || req.companyId || req.body.companyId;

    if (!companyId) {
      return next(); // If no company context, skip check (might be admin)
    }

    // Bypass for superadmin
    if (req.user?.role === 'admin') {
      return next();
    }

    // Find active subscription
    const subscription = await Subscription.findOne({
      companyId: companyId,
      status: { $in: ["active", "grace_period", "trial"] }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      // If no subscription, strictly block resource creation
      return res.status(403).json({
        message: "No active subscription found. Please contact your administrator to assign a package.",
        limitReached: true,
        limit: 0,
        currentCount: 0
      });
    }

    let limit = Infinity;
    let currentCount = 0;
    let errorMessage = "";

    if (resourceType === 'employee') {
      limit = parseLimit(subscription.employeeLimit);
      currentCount = await Employee.countDocuments({ companyId: companyId });
      errorMessage = `Employee limit reached (${limit}). Please upgrade your package.`;
    } else if (resourceType === 'client') {
      limit = parseLimit(subscription.clientLimit);
      currentCount = await Client.countDocuments({ companyId: companyId });
      errorMessage = `Client limit reached (${limit}). Please upgrade your package.`;
    } else if (resourceType === 'manager') {
      limit = parseLimit(subscription.managerLimit);
      currentCount = await Manager.countDocuments({ companyId: companyId });
      errorMessage = `Manager limit reached (${limit}). Please upgrade your package.`;
    }

    // Check if limit is reached
    if (currentCount >= limit) {
      return res.status(403).json({
        message: errorMessage,
        limitReached: true,
        limit,
        currentCount
      });
    }

    next();
  } catch (error) {
    console.error("Resource limit check error:", error);
    next(); 
  }
};

module.exports = {
  checkSubscription,
  checkExpiredSubscription,
  adminBypass,
  checkResourceLimit
};
