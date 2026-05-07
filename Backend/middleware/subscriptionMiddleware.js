const Subscription = require("../models/SubscriptionModel");
const Client = require("../models/ClientModel");
const Employee = require("../models/EmployeeModel");
const Manager = require("../models/ManagerModel");
const User = require("../models/UserModels");

// "3" → 3, "10 Employees" → 10, "Unlimited" → Infinity, "" → 10
const parseLimit = (limitStr) => {
  if (limitStr === undefined || limitStr === null || limitStr === "") return 10;
  const s = String(limitStr).toLowerCase().trim();
  if (s.includes("unlimited") || s.includes("infinity")) return Infinity;
  const m = s.match(/\d+/);
  const num = m ? parseInt(m[0]) : 10;
  return num <= 0 ? 10 : num;
};

const getSubscriptionLimit = (type, sub) => {
  if (!sub) return 10;
  const map = {
    client: sub.clientLimit,
    employee: sub.employeeLimit,
    manager: sub.managerLimit,
  };
  let val = map[type];
  if ((!val || val === "") && sub.features && Array.isArray(sub.features)) {
    const label = type === "client" ? "client" : type === "employee" ? "employee" : "manager";
    const feat = sub.features.find(f => f.toLowerCase().includes(label));
    if (feat) {
      const match = feat.match(/\d+/);
      if (match) val = match[0];
    }
  }
  return parseLimit(val);
};


// Active subscription check
const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.params.userId || req.body.userId;
    if (!userId) {
      return res.status(401).json({ message: "User ID required", restricted: true });
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
      await Subscription.findByIdAndUpdate(subscription._id, { status: "expired" });
      return res.status(403).json({
        message: "Subscription expired. Please contact your administrator to renew.",
        restricted: true,
        expired: true
      });
    }

    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 10) {
      res.set('X-Subscription-Warning', `Subscription expires in ${daysUntilExpiry} days`);
      req.subscriptionWarning = { daysLeft: daysUntilExpiry };
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ message: "Error checking subscription", restricted: true });
  }
};

// Expired subscription check
const checkExpiredSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.params.userId || req.body.userId;
    if (!userId) return next();

    const subscription = await Subscription.findOne({
      $or: [{ userId }, { companyId: userId }],
      status: { $in: ["active", "grace_period", "expired"] }
    }).sort({ createdAt: -1 });

    if (!subscription) { req.isExpired = true; return next(); }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    req.isExpired = endDate < now || subscription.status === "expired";
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("Expired subscription check error:", error);
    req.isExpired = true;
    next();
  }
};

// Admin bypass
const adminBypass = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'superadmin') return next();
  checkSubscription(req, res, next);
};

// Resource limit check - client / employee / manager
const checkResourceLimit = (resourceType) => async (req, res, next) => {
  try {
    // companyId-ஐ எல்லா இடத்திலும் தேடு
    const companyId =
      req.body.companyId ||
      req.headers['x-company-id'] ||
      req.user?.companyId ||
      req.user?.id;

    if (!companyId) return next();
    if (req.user?.role === 'admin') return next();

    // Active subscription fetch
    const subscription = await Subscription.findOne({
      $or: [{ userId: companyId }, { companyId: companyId }],
      status: { $in: ["active", "grace_period", "trial"] }
    }).sort({ createdAt: -1 });

    let limit = getSubscriptionLimit(resourceType, subscription);
    let currentCount = 0;
    let errorMessage = "";

    if (resourceType === 'client') {
      currentCount = await Client.countDocuments({ companyId });
      errorMessage = `Client limit reached (${limit === Infinity ? "Unlimited" : limit}). Please upgrade.`;
    } else if (resourceType === 'employee') {
      currentCount = await Employee.countDocuments({ companyId });
      errorMessage = `Employee limit reached (${limit === Infinity ? "Unlimited" : limit}). Please upgrade.`;
    } else if (resourceType === 'manager') {
      currentCount = await Manager.countDocuments({ companyId });
      errorMessage = `Manager limit reached (${limit === Infinity ? "Unlimited" : limit}). Please upgrade.`;
    }

    if (limit !== Infinity && currentCount >= limit) {
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
