// routes/quotationRoutes.js
const express  = require("express");
const router   = express.Router();
const Quotation = require("../models/QuotationModel");
const Invoice   = require("../models/InvoiceModels");

// ── GET all ──────────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const docs = await Quotation.find({ companyId }).sort({ createdAt: -1 }).lean();
    const quotations = docs.map((doc) => {
      const qt = doc.qt || {};
      const items = doc.items || [];
      const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate)||0)*(parseFloat(i.quantity)||0), 0);
      const total    = subtotal * (1 + (parseFloat(qt.gstRate)||0) / 100);
      return {
        id:          doc._id.toString(),
        quoteNo:     qt.quoteNo     || doc.quoteNo || "—",
        client:      qt.client      || doc.client  || "—",
        project:     qt.project     || "",
        date:        qt.date        || null,
        expiryDate:  qt.expiryDate  || null,
        status:      doc.status     || "draft",
        total,
        savedAt:     doc.createdAt  || Date.now(),
        qt,
        items,
      };
    });
    return res.json({ success: true, quotations });
  } catch (err) {
    console.error("GET /api/quotations error:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
});

// ── POST create / update ──────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { qt, items, status } = req.body;
    if (!qt || !items) return res.status(400).json({ success: false, msg: "qt and items required" });

    const existing = await Quotation.findOne({ "qt.quoteNo": qt.quoteNo });
    if (existing) {
      existing.qt     = qt;
      existing.items  = items;
      existing.status = status || existing.status;
      await existing.save();
      return res.json({ success: true, quotation: existing });
    }
    const doc = new Quotation({ qt, items, status: status || "draft", companyId: req.companyId || "" });
    await doc.save();
    return res.json({ success: true, quotation: doc });
  } catch (err) {
    console.error("POST /api/quotations error:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
});

// ── PATCH status ──────────────────────────────────────────────────────────────
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["draft","sent","approved","rejected","expired","converted"];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, msg: "Invalid status" });
    
    const companyId = req.companyId || "NONE";
    const doc = await Quotation.findOneAndUpdate(
      { _id: req.params.id, companyId },
      { status },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, msg: "Not found or unauthorized" });
    return res.json({ success: true, quotation: doc });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
});

// ── POST convert to Invoice ───────────────────────────────────────────────────
router.post("/:id/convert", async (req, res) => {
  try {
    const qtDoc = await Quotation.findById(req.params.id).lean();
    if (!qtDoc) return res.status(404).json({ success: false, msg: "Quotation not found" });

    const qt    = qtDoc.qt || {};
    const items = qtDoc.items || [];

    // Generate Invoice number from Quote number
    const invoiceNo = (qt.quoteNo || "QT").replace(/^QT/, "INV");

    const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate)||0)*(parseFloat(i.quantity)||0), 0);
    const gstAmt   = subtotal * ((parseFloat(qt.gstRate)||0) / 100);
    const total    = subtotal + gstAmt;

    // 1. Check if an invoice was ALREADY created for this specific Quotation
    const existingForThis = await Invoice.findOne({ quotationId: req.params.id });
    if (existingForThis) {
      await Quotation.findByIdAndUpdate(req.params.id, { status: "converted" });
      return res.json({ success: true, message: "Already converted", invoiceNo: existingForThis.invoiceNo, invoice: existingForThis });
    }

    // 2. Check if the generated Invoice number is used, and resolve collisions by adding a suffix
    let finalInvoiceNo = (qt.quoteNo || "QT").replace(/^QT/, "INV");
    let count = 0;
    while (await Invoice.findOne({ invoiceNo: finalInvoiceNo })) {
      count++;
      finalInvoiceNo = `${(qt.quoteNo || "QT").replace(/^QT/, "INV")}-${count}`;
    }

    const today = new Date().toISOString().split("T")[0];
    const due   = new Date(Date.now() + 30*86400000).toISOString().split("T")[0];

    const invoice = new Invoice({
      invoiceNo:      finalInvoiceNo,
      quotationId:    req.params.id,
      orderNo:        qt.refNo        || "",
      date:           today,
      dueDate:        due,
      client:         qt.client,
      project:        qt.project       || "",
      gstRate:        qt.gstRate       ?? 18,
      notes:          qt.notes         || "",
      terms:          "Payment due within 30 days. Thank you for your business!",
      companyName:    qt.companyName   || "",
      companyEmail:   qt.companyEmail  || "",
      companyPhone:   qt.companyPhone  || "",
      companyAddress: qt.companyAddress|| "",
      items: items.map((i) => ({ description: i.description, quantity: parseFloat(i.quantity)||0, rate: parseFloat(i.rate)||0 })),
      subtotal, gstAmt, total,
      status: "draft",
      companyId: qtDoc.companyId || req.companyId || "",
    });
    await invoice.save();

    // Mark quotation as converted
    await Quotation.findByIdAndUpdate(req.params.id, { status: "converted" });

    return res.json({ success: true, invoiceNo, invoice });
  } catch (err) {
    console.error("Convert error:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
});

// ── DELETE ─────────────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const doc = await Quotation.findOneAndDelete({ _id: req.params.id, companyId });
    if (!doc) return res.status(404).json({ success: false, msg: "Not found or unauthorized" });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
});

module.exports = router;
