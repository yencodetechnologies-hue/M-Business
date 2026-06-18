const mongoose = require("mongoose");
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require("dotenv").config();

async function run() {
  const uri = process.env.MONGO_URI;
  console.log("Connecting to database...", uri);
  try {
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    const Project = require("./models/ProjectModel");
    console.log("Registered models:", mongoose.modelNames());

    const projects = await Project.find({});
    console.log(`Found ${projects.length} projects.`);
    for (const p of projects) {
      console.log("Project:", {
        id: p._id,
        name: p.name,
        client: p.client,
        companyId: p.companyId
      });
    }

    process.exit(0);
  } catch (err) {
    console.error("Error during execution:", err);
    process.exit(1);
  }
}

run();
