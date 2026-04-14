const mongoose = require("mongoose");
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const Quotation = require("./models/QuotationModel");
const Invoice = require("./models/InvoiceModels");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function debug() {
  await mongoose.connect(process.env.MONGO_URI);
  const id = "69d90209be02a5ae67799707";
  console.log("Checking Quotation:", id);
  const qtDoc = await Quotation.findById(id).lean();
  if (!qtDoc) {
    console.log("Quotation NOT FOUND");
    process.exit(0);
  }
  console.log("Quotation Data:", JSON.stringify(qtDoc, null, 2));

  const qt = qtDoc.qt || {};
  const invoiceNo = (qt.quoteNo || "QT").replace(/^QT/, "INV");
  console.log("Target Invoice No:", invoiceNo);

  const existingForThis = await Invoice.findOne({ quotationId: id });
  console.log("Existing for this ID:", existingForThis ? "YES" : "NO");

  const duplicateNo = await Invoice.findOne({ invoiceNo });
  console.log("Duplicate No exists:", duplicateNo ? "YES (ID: " + duplicateNo._id + ")" : "NO");

  process.exit(0);
}

debug().catch(err => {
  console.error(err);
  process.exit(1);
});
