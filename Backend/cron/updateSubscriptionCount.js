const cron = require("node-cron");
const User = require("../models/UserModels");
const Subscription = require("../models/SubscriptionModel");
const { sendRenewalReminder, sendExpiryNotification } = require("../config/email");

cron.schedule("* * * * *", async () => {
  console.log(" Running subscription count cron job...");

  try {
    // Find only users with role="subadmin" or role="admin"
    const subAdmins = await User.find({
      role: { $in: ["subadmin", "admin"] }
    });
    console.log(` Total SubAdmins found: ${subAdmins.length}`);

    for (const subAdmin of subAdmins) {
      // Count subscriptions for this subadmin (using userId field)
      const count = await Subscription.countDocuments({
        userId: subAdmin._id.toString(),
        status: "active"
      });

      console.log(` SubAdmin: ${subAdmin.name} → Active Subscriptions: ${count}`);

      // Update the user with subscription count
      await User.findByIdAndUpdate(subAdmin._id, {
        mySubscriptions: count > 0,
        numberOfSubscriptions: count
      });
    }

    console.log(" Subscription counts updated successfully.");
  } catch (err) {
    console.error(" Cron job error:", err);
  }
});

// Check for subscription expiry and send reminders
cron.schedule("0 9 * * *", async () => {
  console.log(" Running subscription reminder check...");
  
  try {
    const now = new Date();
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    
    // Find subscriptions expiring in 10 days
    const expiringSoon = await Subscription.find({
      status: "active",
      endDate: { $lte: tenDaysFromNow, $gte: now },
      reminderSent: { $ne: true }
    });
    
    for (const subscription of expiringSoon) {
      const daysLeft = Math.ceil((new Date(subscription.endDate) - now) / (1000 * 60 * 60 * 24));
      
      // Send renewal reminder email
      await sendRenewalReminder(
        subscription.userEmail,
        subscription.userName,
        subscription.planName,
        subscription.endDate,
        daysLeft
      );
      
      // Mark reminder as sent
      await Subscription.findByIdAndUpdate(subscription._id, {
        reminderSent: true,
        reminderSentAt: now
      });
      
      console.log(` Renewal reminder sent to ${subscription.userEmail} (${daysLeft} days left)`);
    }
    
    // Find expired subscriptions
    const expired = await Subscription.find({
      status: "active",
      endDate: { $lt: now }
    });
    
    for (const subscription of expired) {
      // Send expiry notification
      await sendExpiryNotification(
        subscription.userEmail,
        subscription.userName,
        subscription.planName
      );
      
      // Update subscription status to expired
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "expired"
      });
      
      console.log(` Expiry notification sent to ${subscription.userEmail}`);
    }
    
    console.log(" Subscription reminder check completed.");
  } catch (err) {
    console.error(" Reminder check error:", err);
  }
});