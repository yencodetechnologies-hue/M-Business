const cron = require("node-cron");
const User = require("../models/UserModels");
const Subscription = require("../models/SubscriptionModel");

cron.schedule("* * * * *", async () => {
  console.log("🔄 Running subscription count cron job...");

  try {
    // Find only users with role="subadmin" or role="admin"
    const subAdmins = await User.find({
      role: { $in: ["subadmin", "admin"] }
    });
    console.log(`📋 Total SubAdmins found: ${subAdmins.length}`);

    for (const subAdmin of subAdmins) {
      // Count subscriptions for this subadmin (using userId field)
      const count = await Subscription.countDocuments({
        userId: subAdmin._id.toString(),
        status: "active"
      });

      console.log(`👤 SubAdmin: ${subAdmin.name} → Active Subscriptions: ${count}`);

      // Update the user with subscription count
      await User.findByIdAndUpdate(subAdmin._id, {
        mySubscriptions: count > 0,
        numberOfSubscriptions: count
      });
    }

    console.log("✅ Subscription counts updated successfully.");
  } catch (err) {
    console.error("❌ Cron job error:", err);
  }
});