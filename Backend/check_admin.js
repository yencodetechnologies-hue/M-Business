const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/UserModels');
require('dotenv').config();

async function seedAdmin() {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  await mongoose.connect(process.env.MONGO_URI);
  const email = 'admin';
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role === 'admin') {
      console.log("Admin already exists!");
    } else {
      existing.role = 'admin';
      existing.password = await bcrypt.hash('admin123', 10);
      await existing.save();
      console.log("Updated existing account to admin!");
    }
    await mongoose.disconnect();
    return;
  }
  const password = 'admin1234';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await User.create({
    name: 'Super Admin',
    email: email,
    password: hashedPassword,
    role: 'admin',
    phone: '',
    status: 'Active'
  });
  console.log("Admin created successfully!");
  await mongoose.disconnect();
}
seedAdmin();
