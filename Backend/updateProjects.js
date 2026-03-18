// உங்கள் backend terminal-ல் இந்த script run பண்ணுங்க
// node updateProjects.js

const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("✅ Connected");

  const result = await mongoose.connection.collection("projects").updateMany(
    {}, // எல்லா projects-க்கும்
    { $set: { assignedTo: "A Irin Amal Felshiya" } }
  );

  console.log(`✅ Updated ${result.modifiedCount} projects`);
  process.exit(0);
}).catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
