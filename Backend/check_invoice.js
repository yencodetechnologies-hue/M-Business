const mongoose = require("mongoose");
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require("dotenv").config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/mbusiness";

const invoiceSchema = new mongoose.Schema({
  invoiceNo:      String,
  client:         String,
  signature:      String,
  signatureType:  String,
  template:       String,
  total:          Number
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

async function check() {
  console.log("Connecting to:", mongoUri);
  await mongoose.connect(mongoUri);
  console.log("Connected.");
  const doc = await Invoice.findOne({ invoiceNo: "INV-2026-9994" });
  if (doc) {
    console.log("FOUND INVOICE:", {
      invoiceNo: doc.invoiceNo,
      client: doc.client,
      template: doc.template,
      signatureExists: !!doc.signature,
      signatureLength: doc.signature ? doc.signature.length : 0,
      signatureType: doc.signatureType,
      signatureSnippet: doc.signature ? doc.signature.substring(0, 100) : "none"
    });
  } else {
    console.log("Invoice not found.");
  }
  await mongoose.connection.close();
}

check().catch(console.error);
