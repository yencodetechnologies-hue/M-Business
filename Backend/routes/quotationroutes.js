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

      // Automatic Income Tracking for updates
      if (qt.amountPaid > 0) {
        const Income = require("../models/IncomeModel");
        const subtotalRaw = items.reduce((s, i) => s + (parseFloat(i.rate)||0)*(parseFloat(i.quantity)||0), 0);
        const gstRate = parseFloat(qt.gstRate) || 0;
        const total = qt.isGstIncluded ? subtotalRaw : subtotalRaw * (1 + gstRate / 100);

        const query = { invoiceNo: qt.quoteNo };
        if (qt.transactionId) query.transactionId = qt.transactionId;

        const isPartial = qt.amountPaid < total;
        const incomeTitle = isPartial 
          ? `Advance/Part Payment for Quotation ${qt.quoteNo}` 
          : `Full Payment for Quotation ${qt.quoteNo}`;
        
        await Income.findOneAndUpdate(
          query,
          {
            title: incomeTitle,
            category: "Advance",
            paymentMode: qt.paymentMode || "GPay",
            amount: parseFloat(qt.amountPaid),
            client: qt.client,
            invoiceNo: qt.quoteNo,
            transactionId: qt.transactionId || "",
            date: qt.paymentDate || qt.date,
            status: "Received",
            currency: qt.currency || "₹",
            companyId: req.companyId || "",
          },
          { upsert: true, returnDocument: "after" }
        );
      }

      return res.json({ success: true, quotation: existing });
    }
    const doc = new Quotation({ qt, items, status: status || "draft", companyId: req.companyId || "" });
    await doc.save();

    // Automatic Income Tracking
    if (qt.amountPaid > 0) {
      const Income = require("../models/IncomeModel");
      const subtotalRaw = items.reduce((s, i) => s + (parseFloat(i.rate)||0)*(parseFloat(i.quantity)||0), 0);
      const gstRate = parseFloat(qt.gstRate) || 0;
      const total = qt.isGstIncluded ? subtotalRaw : subtotalRaw * (1 + gstRate / 100);

      const query = { invoiceNo: qt.quoteNo };
      if (qt.transactionId) query.transactionId = qt.transactionId;

      const isPartial = qt.amountPaid < total;
      const incomeTitle = isPartial 
        ? `Advance/Part Payment for Quotation ${qt.quoteNo}` 
        : `Full Payment for Quotation ${qt.quoteNo}`;
      
      await Income.findOneAndUpdate(
        query,
        {
          title: incomeTitle,
          category: "Advance",
          paymentMode: qt.paymentMode || "GPay",
          amount: parseFloat(qt.amountPaid),
          client: qt.client,
          invoiceNo: qt.quoteNo, // using quoteNo as reference if no invoice yet
          transactionId: qt.transactionId || "",
          date: qt.paymentDate || qt.date,
          status: "Received",
          currency: qt.currency || "₹",
          companyId: req.companyId || "",
        },
        { upsert: true, returnDocument: "after" }
      );
    }

    return res.json({ success: true, quotation: doc });
  } catch (err) {
    console.error("POST /api/quotations error:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
});

// ── PUT update by ID ──────────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { qt, items, status } = req.body;
    if (!qt || !items) return res.status(400).json({ success: false, msg: "qt and items required" });

    const subtotalRaw = items.reduce((s, i) => s + (parseFloat(i.rate)||0)*(parseFloat(i.quantity)||0), 0);
    const gstRate = parseFloat(qt.gstRate) || 0;
    const total = qt.isGstIncluded ? subtotalRaw : subtotalRaw * (1 + gstRate / 100);

    const doc = await Quotation.findByIdAndUpdate(
      req.params.id,
      { qt, items, status: status || "draft" },
      { returnDocument: "after" }
    ).lean();

    if (!doc) return res.status(404).json({ success: false, msg: "Quotation not found" });

    // Sync Income
    if (qt.amountPaid > 0) {
      const Income = require("../models/IncomeModel");
      const query = { invoiceNo: qt.quoteNo }; // using quoteNo as reference
      if (qt.transactionId) query.transactionId = qt.transactionId;

      await Income.findOneAndUpdate(
        query,
        {
          title: qt.amountPaid < total ? `Part Payment for Quotation ${qt.quoteNo}` : `Full Payment for Quotation ${qt.quoteNo}`,
          category: "Advance",
          paymentMode: qt.paymentMode || "GPay",
          amount: parseFloat(qt.amountPaid),
          client: qt.client,
          invoiceNo: qt.quoteNo,
          transactionId: qt.transactionId || "",
          date: qt.paymentDate || qt.date,
          status: "Received",
          currency: qt.currency || "₹",
          companyId: req.companyId || "",
        },
        { upsert: true }
      );
    }

    return res.json({ success: true, quotation: doc });
  } catch (err) {
    console.error("PUT /api/quotations error:", err);
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
      { returnDocument: "after" }
    );
    if (!doc) return res.status(404).json({ success: false, msg: "Not found or unauthorized" });

    // Sync Income if status is Approved (effectively paid/confirmed for some users)
    if (status === "approved" && doc.qt?.amountPaid > 0) {
      const Income = require("../models/IncomeModel");
      const query = { invoiceNo: doc.qt.quoteNo };
      if (doc.qt.transactionId) query.transactionId = doc.qt.transactionId;

      await Income.findOneAndUpdate(
        query,
        {
          title: `Advance for Quotation ${doc.qt.quoteNo}`,
          category: "Advance",
          paymentMode: doc.qt.paymentMode || "GPay",
          amount: parseFloat(doc.qt.amountPaid),
          client: doc.qt.client,
          invoiceNo: doc.qt.quoteNo,
          transactionId: doc.qt.transactionId || "",
          date: doc.qt.paymentDate || doc.qt.date,
          status: "Received",
          currency: doc.qt.currency || "₹",
          companyId: doc.companyId || req.companyId || "",
        },
        { upsert: true, returnDocument: "after" }
      );
    }

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

    const subtotalRaw = items.reduce((s, i) => s + (parseFloat(i.rate)||0)*(parseFloat(i.quantity)||0), 0);
    const gstRate = parseFloat(qt.gstRate) || 0;
    const isGstIncluded = qt.isGstIncluded || false;
    let subtotal, gstAmt, total;
    if (isGstIncluded) {
      total    = subtotalRaw;
      subtotal = total / (1 + gstRate / 100);
      gstAmt   = total - subtotal;
    } else {
      subtotal = subtotalRaw;
      gstAmt   = subtotal * (gstRate / 100);
      total    = subtotal + gstAmt;
    }

    // 1. Check if an invoice was ALREADY created for this specific Quotation
    const existingForThis = await Invoice.findOne({ quotationId: req.params.id });
    if (existingForThis) {
      await Quotation.findByIdAndUpdate(req.params.id, { status: "converted" }, { returnDocument: "after" });
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
      isGstIncluded:  qt.isGstIncluded || false,
      notes:          qt.notes         || "",
      terms:          "Payment due within 30 days. Thank you for your business!",
      companyName:    qt.companyName   || "",
      companyEmail:   qt.companyEmail  || "",
      companyPhone:   qt.companyPhone  || "",
      companyAddress: qt.companyAddress|| "",
      currency:       qt.currency      || "₹",
      upiId:          qt.upiId         || "",
      items: items.map((i) => ({ description: i.description, quantity: parseFloat(i.quantity)||0, rate: parseFloat(i.rate)||0 })),
      subtotal, gstAmt, total,
      amountPaid:     parseFloat(qt.amountPaid) || 0,
      paymentDate:    qt.paymentDate            || today,
      paymentMode:    qt.paymentMode            || "GPay",
      transactionId:  qt.transactionId          || "",
      status: "draft",
      companyId: qtDoc.companyId || req.companyId || "",
    });
    await invoice.save();

    // Automatic Income Tracking for advance/part payment on converted invoice
    if (invoice.amountPaid > 0) {
      const Income = require("../models/IncomeModel");
      const isPartial = invoice.amountPaid < invoice.total;
      const incomeTitle = isPartial
        ? `Advance/Part Payment for Invoice ${invoice.invoiceNo}`
        : `Full Payment for Invoice ${invoice.invoiceNo}`;
      const query = { invoiceNo: invoice.invoiceNo };
      if (invoice.transactionId) query.transactionId = invoice.transactionId;

      await Income.findOneAndUpdate(
        query,
        {
          title: incomeTitle,
          category: isPartial ? "Advance" : "Project Payment",
          paymentMode: invoice.paymentMode,
          amount: invoice.amountPaid,
          client: invoice.client,
          invoiceNo: invoice.invoiceNo,
          transactionId: invoice.transactionId || "",
          date: invoice.paymentDate || invoice.date,
          status: "Received",
          currency: invoice.currency || "₹",
          companyId: invoice.companyId || req.companyId || "",
        },
        { upsert: true, returnDocument: "after" }
      );
    }

    // Mark quotation as converted
    await Quotation.findByIdAndUpdate(req.params.id, { status: "converted" }, { returnDocument: "after" });

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
