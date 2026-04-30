const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/M Business/Backend/.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mbusiness')
.then(async () => {
  const Task = require('c:/M Business/Backend/models/TaskModels.js');
  const tasks = await Task.find({ isDeleted: false, date: { $ne: "" } }).limit(5);
  console.log("Tasks with dates:");
  tasks.forEach(t => console.log(`Title: ${t.title}, Date: ${t.date}, AssignTo: ${t.assignTo}, Company: ${t.companyId}`));
  
  const clientTasks = await Task.find({ assignTo: { $regex: /client/i }, isDeleted: false }).limit(5);
  console.log("\nClient assigned tasks:");
  clientTasks.forEach(t => console.log(`Title: ${t.title}, Date: ${t.date}, AssignTo: ${t.assignTo}, Company: ${t.companyId}`));
  
  process.exit();
}).catch(console.error);
