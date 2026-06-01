const mongoose = require("mongoose");
require("dotenv").config();
const Subscription = require("./models/SubscriptionModel");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await Subscription.updateMany({ status: 'pending' }, { status: 'active', isFullyPaid: true });
    console.log('Fixed pending subscriptions!');
    process.exit(0);
  })
  .catch(err => console.error(err));
