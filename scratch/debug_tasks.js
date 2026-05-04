const mongoose = require('mongoose');
const Task = require('./models/TaskModels');
const Employee = require('./models/EmployeeModel');
const User = require('./models/UserModels');

async function debug() {
  try {
    await mongoose.connect('mongodb+srv://yencodembusiness:yencodembusiness@yencodembusiness.ivmcxzm.mongodb.net/?appName=yencodembusiness'); 
    console.log('Connected to DB');

    const name = 'ss';
    const nameRegex = new RegExp(`^\\s*${name}\\s*$`, 'i');

    const [user, employee, tasks] = await Promise.all([
      User.findOne({ name: nameRegex }),
      Employee.findOne({ name: nameRegex }),
      Task.find({ isDeleted: false }).limit(20)
    ]);

    console.log('User found:', user ? user.name : 'No');
    console.log('Employee found:', employee ? employee.name : 'No');
    console.log('Total Tasks (first 20):', tasks.length);

    const assignedTasks = await Task.find({
      $or: [
        { assignTo: nameRegex },
        { assignedTo: nameRegex },
        ...(user ? [{ assignedTo: user._id }] : []),
        ...(employee ? [{ assignedTo: employee._id }] : [])
      ]
    });

    console.log('Tasks assigned to SS:', assignedTasks.length);
    if (assignedTasks.length > 0) {
      console.log('First assigned task companyId:', assignedTasks[0].companyId);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
