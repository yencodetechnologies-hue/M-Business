const mongoose = require('mongoose');
const Package = require('./models/PackageModel');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const DEFAULT_PACKAGES = [
  {
    title: "Trial",
    price: 0,
    type: "free",
    no_of_days: 30,
    icon: "✨",
    targetRole: "subadmin",
    status: "Active",
    features: [
      "30 Days Free Trial",
      "5 Projects",
      "5 Invoices",
      "Basic Support"
    ],
    planDuration: "Monthly",
    clientLimit: "5",
    employeeLimit: "5",
    managerLimit: "2"
  },
  {
    title: "Starter",
    price: 999,
    type: "paid",
    no_of_days: 30,
    icon: "🌱",
    targetRole: "subadmin",
    status: "Active",
    features: [
      "5 Projects",
      "10 Invoices",
      "Basic Reports",
      "Email Support"
    ],
    planDuration: "Monthly",
    clientLimit: "10",
    employeeLimit: "15",
    managerLimit: "5"
  },
  {
    title: "Professional",
    price: 2999,
    type: "paid",
    no_of_days: 30,
    icon: "🚀",
    targetRole: "subadmin",
    status: "Active",
    features: [
      "Unlimited Projects",
      "Unlimited Invoices",
      "Advanced Reports",
      "Priority Support",
      "Team Management"
    ],
    planDuration: "Monthly",
    clientLimit: "50",
    employeeLimit: "Unlimited",
    managerLimit: "10"
  },
  {
    title: "Enterprise",
    price: 0,
    type: "paid",
    no_of_days: 365,
    icon: "🏢",
    targetRole: "subadmin",
    status: "Active",
    buttonName: "Contact Sales",
    features: [
      "Custom Branding",
      "API Access",
      "Dedicated Manager",
      "White-label Solution"
    ],
    planDuration: "Annual",
    clientLimit: "Unlimited",
    employeeLimit: "Unlimited",
    managerLimit: "Unlimited"
  }
];

async function seedPackages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    for (const pkgData of DEFAULT_PACKAGES) {
      // Find and update or create
      const updated = await Package.findOneAndUpdate(
        { title: pkgData.title },
        { $set: pkgData },
        { upsert: true, new: true }
      );
      console.log(`Synced package: ${updated.title}`);
    }
    
    console.log('Seeding complete');
    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

seedPackages();
