const mongoose = require("mongoose");

/**
 * DeletedClient — permanently records every client that has been deleted.
 * Used to prevent re-login and re-registration with the same email / name.
 */
const DeletedClientSchema = new mongoose.Schema({
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  clientName: { type: String, default: "" },
  companyId:  { type: String, default: "" },
  deletedAt:  { type: Date, default: Date.now }
}, { timestamps: false });

module.exports =
  mongoose.models.DeletedClient ||
  mongoose.model("DeletedClient", DeletedClientSchema);
