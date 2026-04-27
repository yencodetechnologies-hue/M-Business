const cron = require('node-cron');
const Subscription = require('../models/SubscriptionModel');
const User = require('../models/UserModels');
const { sendRenewalReminder, sendExpiryNotification, sendUsageLimitAlert } = require('../config/email');

const DAYS_BEFORE_REMINDER = 10;
const GRACE_PERIOD_DAYS = 60;
const USAGE_ALERT_PERCENT = 80; // alert when 80% of limit used

const subscriptionCron = () => {
  // Every day at 9 AM — check expiry / reminders
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ [Cron] Running daily subscription checks...');
    await sendRenewalReminders();
    await handleExpiredSubscriptions();
    await sendUsageAlerts();
    console.log('✅ [Cron] Daily subscription checks done.');
  });

  // Every minute — update mySubscriptions count on User model
  cron.schedule('* * * * *', async () => {
    await updateSubscriptionCounts();
  });

  console.log('🔁 Subscription cron jobs scheduled.');
};

// ─── Send renewal reminders (10 days before expiry) ────────────────────────
const sendRenewalReminders = async () => {
  try {
    const now = new Date();
    const reminderDate = new Date(now.getTime() + DAYS_BEFORE_REMINDER * 24 * 60 * 60 * 1000);

    const expiringSoon = await Subscription.find({
      status: 'active',
      endDate: { $lte: reminderDate, $gt: now },
      reminderSent: false
    });

    for (const sub of expiringSoon) {
      const daysLeft = Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24));
      const result = await sendRenewalReminder(
        sub.userEmail,
        sub.userName || 'User',
        sub.planName,
        sub.endDate,
        daysLeft
      );
      if (result.success) {
        sub.reminderSent = true;
        sub.reminderSentAt = new Date();
        await sub.save();
        console.log(`📧 [Cron] Renewal reminder → ${sub.userEmail} (${daysLeft} days left)`);
      }
    }
  } catch (err) {
    console.error('❌ [Cron] sendRenewalReminders error:', err.message);
  }
};

// ─── Mark expired & send notifications; hide after 60-day grace ────────────
const handleExpiredSubscriptions = async () => {
  try {
    const now = new Date();

    // 1. Mark active subscriptions that have passed their end date as expired
    const justExpired = await Subscription.find({
      status: 'active',
      endDate: { $lt: now }
    });

    for (const sub of justExpired) {
      sub.status = 'expired';
      sub.expiredAt = now;
      await sub.save();

      if (!sub.expiryNotificationSent) {
        const result = await sendExpiryNotification(sub.userEmail, sub.userName || 'User', sub.planName);
        if (result.success) {
          sub.expiryNotificationSent = true;
          await sub.save();
          console.log(`📧 [Cron] Expiry notice → ${sub.userEmail}`);
        }
      }
    }

    // 2. Hide subscriptions that have been expired for 60+ days
    const graceCutoff = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const toHide = await Subscription.find({
      status: 'expired',
      expiredAt: { $lt: graceCutoff },
      hiddenAt: null
    });

    for (const sub of toHide) {
      sub.status = 'hidden';
      sub.hiddenAt = now;
      await sub.save();
      console.log(`🔒 [Cron] Subscription hidden (60-day grace expired) → ${sub.userEmail}`);
    }
  } catch (err) {
    console.error('❌ [Cron] handleExpiredSubscriptions error:', err.message);
  }
};

// ─── Send usage limit alerts when ≥80% of limit is used ────────────────────
const sendUsageAlerts = async () => {
  try {
    const allActive = await Subscription.find({
      status: 'active',
      usageLimitAlertSent: false
    });

    for (const sub of allActive) {
      const limit = sub.usageLimit || 999;
      const used = sub.usageCount || 0;
      const percent = (used / limit) * 100;

      if (percent >= USAGE_ALERT_PERCENT) {
        const result = await sendUsageLimitAlert(
          sub.userEmail,
          sub.userName || 'User',
          sub.planName,
          used,
          limit
        );
        if (result.success) {
          sub.usageLimitAlertSent = true;
          await sub.save();
          console.log(`📧 [Cron] Usage alert → ${sub.userEmail} (${Math.round(percent)}% used)`);
        }
      }
    }
  } catch (err) {
    console.error('❌ [Cron] sendUsageAlerts error:', err.message);
  }
};

// ─── Update User.mySubscriptions & numberOfSubscriptions every minute ───────
const updateSubscriptionCounts = async () => {
  try {
    const subAdmins = await User.find({ role: { $in: ['subadmin', 'admin'] } });

    for (const admin of subAdmins) {
      const activeCount = await Subscription.countDocuments({
        userId: admin._id.toString(),
        status: 'active'
      });
      const totalCount = await Subscription.countDocuments({
        userId: admin._id.toString()
      });

      await User.findByIdAndUpdate(admin._id, {
        mySubscriptions: activeCount > 0,
        numberOfSubscriptions: totalCount
      });
    }
  } catch (err) {
    console.error('❌ [Cron] updateSubscriptionCounts error:', err.message);
  }
};

module.exports = subscriptionCron;
