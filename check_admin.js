const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./Backend/models/UserModels');
require('dotenv').config({ path: './Backend/.env' });

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  const email = 'admin';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists!");
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
