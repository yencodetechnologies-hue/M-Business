const cron = require('node-cron');
const Subscription = require('../models/SubscriptionModel');
const { sendRenewalReminder, sendExpiryNotification } = require('../config/email');

const DAYS_BEFORE_REMINDER = 10;
const GRACE_PERIOD_DAYS = 60;

const subscriptionCron = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running subscription reminder cron job...');
    await sendRenewalReminders();
    await handleExpiredSubscriptions();
  });

  console.log('Subscription cron jobs scheduled');
};

const sendRenewalReminders = async () => {
  try {
    const now = new Date();
    const reminderDate = new Date(now);
    reminderDate.setDate(reminderDate.getDate() + DAYS_BEFORE_REMINDER);

    const subscriptions = await Subscription.find({
      status: 'active',
      endDate: { $lte: reminderDate, $gt: now },
      reminderSent: false
    });

    for (const sub of subscriptions) {
      const daysLeft = Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24));

      if (daysLeft <= DAYS_BEFORE_REMINDER) {
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
          console.log(`Renewal reminder sent to ${sub.userEmail}`);
        }
      }
    }
  } catch (error) {
    console.error('Error sending renewal reminders:', error);
  }
};

const handleExpiredSubscriptions = async () => {
  try {
    const now = new Date();

    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      endDate: { $lt: now }
    });

    for (const sub of expiredSubscriptions) {
      sub.status = 'expired';
      sub.expiredAt = now;
      await sub.save();

      if (!sub.expiryNotificationSent) {
        const result = await sendExpiryNotification(
          sub.userEmail,
          sub.userName || 'User',
          sub.planName
        );

        if (result.success) {
          sub.expiryNotificationSent = true;
          await sub.save();
        }
      }

      console.log(`Subscription ${sub._id} marked as expired`);
    }

    const gracePeriodEnd = new Date(now);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() - GRACE_PERIOD_DAYS);

    const hiddenSubscriptions = await Subscription.find({
      status: 'expired',
      expiredAt: { $lt: gracePeriodEnd },
      hiddenAt: null
    });

    for (const sub of hiddenSubscriptions) {
      sub.status = 'hidden';
      sub.hiddenAt = now;
      await sub.save();
      console.log(`Subscription ${sub._id} hidden after grace period`);
    }
  } catch (error) {
    console.error('Error handling expired subscriptions:', error);
  }
};

module.exports = subscriptionCron;
