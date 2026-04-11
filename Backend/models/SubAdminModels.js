// models/SubAdmin.js
const mongoose = require("mongoose");
const subAdminSchema = new mongoose.Schema({
  name: String,
  email: String,
  
  mySubscriptions: {
    type: Boolean,
    default: false
  },
  
  numberOfSubscriptions: {
    type: Number,
    default: 0
  },
  
  // other fields...
});

module.exports = mongoose.model("SubAdmin", subAdminSchema);