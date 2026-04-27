// Verify employee login credentials
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Employee = require("./Backend/models/EmployeeModel");
require("dotenv").config();

async function verifyEmployee(email, password) {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mbusiness");
    
    const employee = await Employee.findOne({ email: email.toLowerCase().trim() });
    
    if (!employee) {
      console.log("❌ Employee not found:", email);
      return;
    }
    
    console.log("✅ Employee found:", employee.name);
    console.log("📧 Email:", employee.email);
    console.log("🔑 Password hash exists:", !!employee.password);
    console.log("🔑 Password length:", employee.password?.length);
    
    if (!employee.password || employee.password.length < 10) {
      console.log("❌ Password not set or not hashed properly");
      console.log("💡 Fix: Reset employee password from admin dashboard");
      return;
    }
    
    const isMatch = await bcrypt.compare(password, employee.password);
    console.log("🔓 Password match:", isMatch);
    
    if (isMatch) {
      console.log("✅ Login should work!");
    } else {
      console.log("❌ Password mismatch");
      console.log("💡 Fix: Check password or reset from admin");
    }
    
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Usage: node verifyEmployeeLogin.js "employee@email.com" "password"
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("Usage: node verifyEmployeeLogin.js <email> <password>");
  process.exit(1);
}

verifyEmployee(email, password);
