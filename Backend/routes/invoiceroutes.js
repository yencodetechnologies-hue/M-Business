// routes/invoiceRoutes.js  ← FLAT SCHEMA VERSION (matches your InvoiceModels.js)
const express = require("express");
const router  = express.Router();
const Invoice = require("../models/InvoiceModels");
const Income  = require("../models/IncomeModels");

// ── GET all invoices ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const filter = req.companyId ? { companyId: req.companyId } : {};
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean();

    const normalised = invoices.map((doc) => {
      const subtotal = (doc.items || []).reduce(
        (s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0),
        0
      );
      const gstRate = parseFloat(doc.gstRate) || 0;
      const total   = doc.total || subtotal * (1 + gstRate / 100);

      // Rebuild nested `inv` object that the frontend InvoiceCreator expects
      const inv = {
        invoiceNo:      doc.invoiceNo      || "",
        orderNo:        doc.orderNo        || "",
        date:           doc.date           || "",
        dueDate:        doc.dueDate        || "",
        client:         doc.client         || "",
        project:        doc.project        || "",
        gstRate:        doc.gstRate        ?? 18,
        notes:          doc.notes          || "",
        terms:          doc.terms          || "",
        companyName:    doc.companyName    || "",
        companyEmail:   doc.companyEmail   || "",
        companyPhone:   doc.companyPhone   || "",
        companyAddress: doc.companyAddress || "",
        amountPaid:     doc.amountPaid     || 0,
        paymentMode:    doc.paymentMode    || "GPay",
        transactionId:  doc.transactionId  || "",
      };

      return {
        id:        doc._id.toString(),
        invoiceNo: doc.invoiceNo || "—",
        client:    doc.client    || "—",
        project:   doc.project   || "",
        date:      doc.date      || null,
        dueDate:   doc.dueDate   || null,
        status:    doc.status    || "draft",
        total,
        savedAt:   doc.createdAt || Date.now(),
        inv,
        items:     doc.items || [],
      };
    });

    return res.json({ success: true, invoices: normalised });
  } catch (err) {
    console.error("GET /api/invoices error:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
});

// ── POST create / update invoice ─────────────────────────────────────────────
// Frontend sends { inv, items } — flatten to match your flat model schema
router.post("/", async (req, res) => {
  try {
    const { inv, items } = req.body;

    if (!inv || !items) {
      return res
        .status(400)
        .json({ success: false, msg: "inv and items are required" });
    }

    // Calculate totals server-side
    const subtotal = items.reduce(
      (s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0),
      0
    );
    const gstAmt = subtotal * ((parseFloat(inv.gstRate) || 0) / 100);
    const total  = subtotal + gstAmt;

    // Flat payload — matches invoiceSchema exactly
    const flatData = {
      invoiceNo:      inv.invoiceNo,
      orderNo:        inv.orderNo        || "",
      date:           inv.date           || "",
      dueDate:        inv.dueDate        || "",
      client:         inv.client,
      project:        inv.project        || "",
      gstRate:        inv.gstRate        ?? 18,
      notes:          inv.notes          || "",
      terms:          inv.terms          || "",
      companyName:    inv.companyName    || "",
      companyEmail:   inv.companyEmail   || "",
      companyPhone:   inv.companyPhone   || "",
      companyAddress: inv.companyAddress || "",
      items: items.map((i) => ({
        description: i.description || "",
        quantity:    parseFloat(i.quantity) || 0,
        rate:        parseFloat(i.rate)     || 0,
      })),
      subtotal,
      gstAmt,
      total,
      status: "draft",
      amountPaid:     parseFloat(inv.amountPaid) || 0,
      paymentMode:    inv.paymentMode            || "GPay",
      transactionId:  inv.transactionId          || "",
      companyId: req.companyId || "",
    };

    // Upsert — same invoiceNo won't create duplicate
    const existing = await Invoice.findOne({ invoiceNo: inv.invoiceNo });

    if (existing) {
      await Invoice.updateOne({ _id: existing._id }, { $set: flatData });
      const updated = await Invoice.findById(existing._id).lean();
      return res.json({ success: true, invoice: updated });
    }

    const newInvoice = new Invoice(flatData);
    await newInvoice.save();

    // Automatic Income Tracking
    if (flatData.amountPaid > 0) {
      await Income.findOneAndUpdate(
        { invoiceNo: flatData.invoiceNo, transactionId: flatData.transactionId },
        {
          title: `Payment for Invoice ${flatData.invoiceNo}`,
          category: "Project Payment",
          paymentMode: flatData.paymentMode,
          amount: flatData.amountPaid,
          client: flatData.client,
          invoiceNo: flatData.invoiceNo,
          transactionId: flatData.transactionId,
          status: "Received",
          companyId: flatData.companyId,
        },
        { upsert: true, new: true }
      );
    }

    return res.json({ success: true, invoice: newInvoice });
  } catch (err) {
    console.error("POST /api/invoices error:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
});

// ── PATCH update status ───────────────────────────────────────────────────────
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["draft", "sent", "paid"]; // your schema enum

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, msg: "Invalid status" });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ success: false, msg: "Invoice not found" });
    }

    return res.json({ success: true, invoice });
  } catch (err) {
    console.error("PATCH status error:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
});

// ── DELETE invoice ────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
});

module.exports = router;
