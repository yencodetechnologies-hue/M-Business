const mongoose = require('mongoose');
const Package = require('./models/PackageModel');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

async function checkPackages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const pkgs = await Package.find({});
    console.log('Total Packages:', pkgs.length);
    pkgs.forEach(p => {
      console.log(`Title: ${p.title}, Status: ${p.status}, Role: ${p.targetRole}, Assigned: ${p.assignedSubadmins.length}`);
    });
    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkPackages();
