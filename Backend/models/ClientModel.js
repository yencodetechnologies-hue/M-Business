const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ClientSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  companyName: { type: String, default: "" },
  email: { type: String, required: true },
  phone: { type: String, default: "" },
  contactPersonName: { type: String, default: "" },
  contactPersonNo: { type: String, default: "" },
  address: { type: String, default: "" },
  password: { type: String, default: "" },
  status: { type: String, default: "Active" },
  role: { type: String, default: "client" },
  gstNumber: { type: String, default: "" },
  category: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  companyId: { type: String, default: "" },
  otp: { type: String, default: "" },
  otpExpires: { type: Date },
  // New fields
  clientType: { type: String, default: "b2b" },
  clientSource: { type: String, default: "" },
  onboardedOn: { type: String, default: "" },
  designation: { type: String, default: "" },
  altEmail: { type: String, default: "" },
  officePhone: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  pincode: { type: String, default: "" },
  country: { type: String, default: "India" },
  websiteUrl: { type: String, default: "" },
  linkedinUrl: { type: String, default: "" },
  billingCurrency: { type: String, default: "INR — Indian Rupee" },
  paymentTerms: { type: String, default: "" },
  creditLimit: { type: String, default: "" },
  preferredPaymentMode: { type: String, default: "" },
  internalNotes: { type: String, default: "" },
  documents: {
    type: [{
      name: { type: String, default: "" },
      fileName: { type: String, default: "" },
      type: { type: String, default: "" },
      size: { type: String, default: "" },
      url: { type: String, default: "" },
      uploadedAt: { type: Date, default: Date.now }
    }],
    default: []
  },
}, { timestamps: true });

ClientSchema.index({ email: 1, companyId: 1 }, { unique: true });

// Safety net: if a client is ever saved with no password (blank or missing),
// automatically assign the hashed default password "123456" instead of
// leaving it blank, so the client can always log in.
ClientSchema.pre("save", async function () {
  if (!this.password || !this.password.trim()) {
    this.password = await bcrypt.hash("123456", 10);
  }
});

module.exports = mongoose.model("Client", ClientSchema);