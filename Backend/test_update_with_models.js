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

    // Load Project model
    const Project = require("./models/ProjectModel");
    
    // Require projectstatusroutes to register ProjectStatus model
    require("./routes/projectstatusroutes");

    console.log("Registered models:", mongoose.modelNames());

    const projectId = "6a31283257d9d207ad1b12e4";
    const companyId = "69ef6039d1b766254ec5051b";

    console.log("Finding and updating Project...");
    const project = await Project.findOneAndUpdate(
      { _id: projectId, companyId },
      { $set: { lastTestedWithModels: new Date() } },
      { new: true }
    );
    console.log("Project updated successfully!");

    console.log("Project details:", {
      name: project.name,
      companyId: project.companyId
    });

    console.log("Auto-updating ProjectStatus tracking entry...");
    const statusModel = mongoose.models.ProjectStatus;
    if (statusModel) {
      console.log("ProjectStatus model found. Executing query...");
      const statusRes = await statusModel.findOneAndUpdate(
        { name: project.name, companyId: project.companyId },
        { $set: {
            client: project.client,
            manager: project.manager || "",
            employee: (project.assignedTo && project.assignedTo.length) ? project.assignedTo.join(", ") : "",
            deadline: project.deadline || project.end || new Date().toISOString().split("T")[0],
            status: project.status || "Pending",
            progress: project.progress || 0,
          }
        }
      );
      console.log("ProjectStatus update finished! Result:", statusRes);
    } else {
      console.log("ProjectStatus model not registered.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error during execution:", err);
    process.exit(1);
  }
}

run();
