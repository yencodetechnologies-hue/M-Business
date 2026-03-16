const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone:    { type: String, default: "" },
  role:     { type: String, default: "user" },
  logoUrl:  { type: String, default: "" },   // ✅ logo Cloudinary URL save ஆகும்
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
