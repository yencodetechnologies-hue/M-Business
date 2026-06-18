const mongoose = require("mongoose");
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require("dotenv").config();

async function run() {
  const uri = process.env.MONGO_URI;
  try {
    await mongoose.connect(uri);
    const Project = require("./models/ProjectModel");
    const project = await Project.findById("6a31283257d9d207ad1b12e4");
    console.log("Milestones:", JSON.stringify(project.milestones, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
