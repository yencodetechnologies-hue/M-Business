const mongoose = require("mongoose");
const Employee = require("./Backend/models/EmployeeModel");
const User = require("./Backend/models/UserModels");
const Client = require("./Backend/models/ClientModel");
require("dotenv").config({ path: "./Backend/.env" });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://mbusiness:mbusiness@cluster0.n1nt2.mongodb.net/your_db");
  const emps = await Employee.find({}, "email password role").lean();
  console.log("Employees:", emps);

  const users = await User.find({}, "email password role").lean();
  console.log("Users:", users);
  
  const clients = await Client.find({}, "email password role").lean();
  console.log("Clients:", clients);
  
  process.exit(0);
}
check();
