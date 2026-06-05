const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("✅ Connected to MongoDB");

  const projects = await mongoose.connection.collection("projects").find({}).toArray();
  console.log("=== Projects in Database ===");
  projects.forEach(p => {
    console.log(`Name: "${p.name}", Status: "${p.status}", Progress: ${p.progress}`);
  });

  process.exit(0);
}).catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
