// routes/invoiceRoutes.js  ← FLAT SCHEMA VERSION (matches your InvoiceModels.js)
const express = require("express");
const router  = express.Router();
const Invoice = require("../models/InvoiceModels");
const Income = require("../models/IncomeModel");


// ── GET all invoices ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const filter = req.companyId ? { companyId: req.companyId } : {};
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean();

    const normalised = await Promise.all(invoices.map(async (doc) => {
      const subtotal = (doc.items || []).reduce(
        (s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0),
        0
      );
      const gstRate = parseFloat(doc.gstRate) || 0;
      const total   = doc.total || subtotal * (1 + gstRate / 100);

      // Fetch payment history for this invoice
      const history = await Income.find({ invoiceNo: doc.invoiceNo }).sort({ date: 1 }).lean();

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
        currency:       doc.currency       || "₹",
        upiId:          doc.upiId          || "",
        paymentHistory: history,
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
        amountPaid: doc.amountPaid || 0,
        currency:   doc.currency   || "₹",
        savedAt:   doc.createdAt || Date.now(),
        inv,
        items:     doc.items || [],
        paymentHistory: history,
      };
    }));

    return res.json({ success: true, invoices: normalised });
  } catch (err) {
    console.error("GET /api/invoices error:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
});

router.get("/client/:clientName", async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.companyId || "";
    const name = decodeURIComponent(req.params.clientName).trim();
    const companyName = req.query.company ? decodeURIComponent(req.query.company).trim() : "";
    
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeName = escapeRegExp(name);
    const safeCompany = escapeRegExp(companyName);
    
    const conditions = [];
    if (safeName) {
      conditions.push({ client: { $regex: new RegExp(safeName, "i") } });
    }
    if (safeCompany) {
      conditions.push({ client: { $regex: new RegExp(safeCompany, "i") } });
    }
    
    let filter = conditions.length > 0 ? { $or: conditions } : {};

    // Isolation: Filter by companyId if provided
    if (companyId) {
      filter = {
        $and: [
          filter,
          { $or: [{ companyId: companyId }, { companyId: "" }, { companyId: { $exists: false } }] }
        ]
      };
    }
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean();

    const normalised = await Promise.all(invoices.map(async (doc) => {
      const subtotal = (doc.items || []).reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0), 0);
      const gstRate = parseFloat(doc.gstRate) || 0;
      const total = doc.total || subtotal * (1 + gstRate / 100);
      
      const history = await Income.find({ invoiceNo: doc.invoiceNo }).sort({ date: 1 }).lean();

      return {
        id: doc._id.toString(),
        invoiceNo: doc.invoiceNo || "—",
        client: doc.client || "—",
        project: doc.project || "",
        date: doc.date || null,
        dueDate: doc.dueDate || null,
        status: doc.status || "draft",
        total,
        amountPaid: doc.amountPaid || 0,
        currency: doc.currency || "₹",
        savedAt: doc.createdAt || Date.now(),
        items: doc.items || [],
        paymentHistory: history,
        companyName: doc.companyName,
        companyEmail: doc.companyEmail,
        companyPhone: doc.companyPhone,
        companyAddress: doc.companyAddress,
        notes: doc.notes,
        terms: doc.terms,
        isGstIncluded: doc.isGstIncluded,
        gstRate: doc.gstRate,
        upiId: doc.upiId,
      };
    }));
    res.json(normalised);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ── POST create / update invoice ─────────────────────────────────────────────
// Frontend sends { inv, items } — flatten to match your flat model schema
router.post("/", async (req, res) => {
  try {
    const { inv, items, status } = req.body;

    if (!inv || !items) {
      return res
        .status(400)
        .json({ success: false, msg: "inv and items are required" });
    }

    // Calculate totals server-side
    const subtotalRaw = items.reduce(
      (s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0),
      0
    );
    const gstRate = parseFloat(inv.gstRate) || 0;
    const isGstIncluded = inv.isGstIncluded || false;
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

    // Flat payload — matches invoiceSchema exactly
    const flatData = {
      invoiceNo:      inv.invoiceNo,
      orderNo:        inv.orderNo        || "",
      date:           inv.date           || "",
      dueDate:        inv.dueDate        || "",
      client:         inv.client,
      project:        inv.project        || "",
      gstRate:        inv.gstRate        ?? 18,
      isGstIncluded:  inv.isGstIncluded  || false,
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
      paymentDate:    inv.paymentDate            || "",
      currency:       inv.currency               || "₹",
      upiId:          inv.upiId                  || "",
      companyId: req.companyId || "",
    };

    // Upsert — same invoiceNo won't create duplicate
    let savedInvoice;
    const existing = await Invoice.findOne({ invoiceNo: inv.invoiceNo });

    if (existing) {
      // If updating, preserve existing status if not provided
      const updateData = { ...flatData };
      let newStatus = status || existing.status || "draft";
      
      // Auto-transition from draft to part_paid if money is paid
      if (newStatus === "draft" && flatData.amountPaid > 0) {
        newStatus = flatData.amountPaid < total ? "part_paid" : "paid";
      }
      
      updateData.status = newStatus;
      await Invoice.updateOne({ _id: existing._id }, { $set: updateData });
      savedInvoice = await Invoice.findById(existing._id).lean();
    } else {
      let newStatus = status || "draft";
      if (newStatus === "draft" && flatData.amountPaid > 0) {
        newStatus = flatData.amountPaid < total ? "part_paid" : "paid";
      }
      const newInvoice = new Invoice({ ...flatData, status: newStatus });
      await newInvoice.save();
      savedInvoice = newInvoice.toObject();
    }

    // Automatic Income Tracking
    if (flatData.amountPaid > 0) {
      const query = { invoiceNo: flatData.invoiceNo };
      if (flatData.transactionId) query.transactionId = flatData.transactionId;

      const isPartial = flatData.amountPaid < flatData.total;
      const incomeTitle = isPartial 
        ? `Advance/Part Payment for Invoice ${flatData.invoiceNo}` 
        : `Full Payment for Invoice ${flatData.invoiceNo}`;
      const incomeCategory = isPartial ? "Advance" : "Project Payment";

      await Income.findOneAndUpdate(
        query,
        {
          title: incomeTitle,
          category: incomeCategory,
          paymentMode: flatData.paymentMode,
          amount: flatData.amountPaid,
          client: flatData.client,
          invoiceNo: flatData.invoiceNo,
          transactionId: flatData.transactionId,
          date: flatData.paymentDate || flatData.date, 
          status: "Received",
          currency: flatData.currency,
          companyId: flatData.companyId,
        },
        { upsert: true, returnDocument: "after" }
      );
    }

    return res.json({ success: true, invoice: savedInvoice });
  } catch (err) {
    console.error("POST /api/invoices error:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
});

// ── PUT update by ID ──────────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { inv, items, status } = req.body;
    if (!inv || !items) return res.status(400).json({ success: false, msg: "inv and items required" });

    const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate)||0) * (parseFloat(i.quantity)||0), 0);
    const gstRate = parseFloat(inv.gstRate) || 0;
    const gstAmt = inv.isGstIncluded ? (subtotal - (subtotal / (1 + gstRate / 100))) : (subtotal * (gstRate / 100));
    const total = inv.isGstIncluded ? subtotal : (subtotal + gstAmt);

    const flatData = {
      ...inv,
      items: items.map(i => ({
        description: i.description || "",
        quantity: parseFloat(i.quantity) || 0,
        rate: parseFloat(i.rate) || 0,
      })),
      subtotal,
      gstAmt,
      total,
      status: status || "draft",
      amountPaid: parseFloat(inv.amountPaid) || 0,
      paymentDate: inv.paymentDate || "",
      currency: inv.currency || "₹",
      upiId: inv.upiId || "",
      companyId: req.companyId || "",
    };

    const updated = await Invoice.findByIdAndUpdate(req.params.id, flatData, { returnDocument: "after" }).lean();
    if (!updated) return res.status(404).json({ success: false, msg: "Invoice not found" });

    // Sync Income
    if (flatData.amountPaid > 0) {
      const query = { invoiceNo: updated.invoiceNo };
      if (updated.transactionId) query.transactionId = updated.transactionId;

      await Income.findOneAndUpdate(
        query,
        {
          title: flatData.amountPaid < total ? `Part Payment for ${updated.invoiceNo}` : `Full Payment for ${updated.invoiceNo}`,
          category: flatData.amountPaid < total ? "Advance" : "Project Payment",
          paymentMode: updated.paymentMode,
          amount: flatData.amountPaid,
          client: updated.client,
          invoiceNo: updated.invoiceNo,
          transactionId: updated.transactionId,
          date: updated.paymentDate || updated.date,
          status: "Received",
          currency: updated.currency || "₹",
          companyId: req.companyId || "",
        },
        { upsert: true }
      );
    }

    return res.json({ success: true, invoice: updated });
  } catch (err) {
    console.error("PUT /api/invoices error:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
});

// ── PATCH update status ───────────────────────────────────────────────────────
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, amountPaid, paymentMode, paymentDate, transactionId } = req.body;
    const allowed = ["draft", "sent", "paid", "unpaid", "overdue", "part_paid"]; 

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, msg: "Invalid status" });
    }

    const updateData = { status };
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
    if (paymentDate !== undefined) updateData.paymentDate = paymentDate;
    if (transactionId !== undefined) updateData.transactionId = transactionId;

    let invoice;
    if (amountPaid !== undefined && (status === "paid" || status === "part_paid")) {
      // Use $inc to add the new payment to the existing total
      invoice = await Invoice.findByIdAndUpdate(
        req.params.id,
        { ...updateData, $inc: { amountPaid: parseFloat(amountPaid) || 0 } },
        { returnDocument: "after" }
      );
    } else {
      // Standard status update
      if (amountPaid !== undefined) updateData.amountPaid = parseFloat(amountPaid) || 0;
      invoice = await Invoice.findByIdAndUpdate(
        req.params.id,
        updateData,
        { returnDocument: "after" }
      );
    }

    if (!invoice) {
      return res.status(404).json({ success: false, msg: "Invoice not found" });
    }

    // Sync Income if status is Paid or Part Paid
    if ((status === "paid" || status === "part_paid") && amountPaid !== undefined && parseFloat(amountPaid) > 0) {
      const syncAmount = parseFloat(amountPaid);
      
      // Always create a NEW Income record for each payment action to maintain history
      const newIncome = new Income({
        title: syncAmount < invoice.total ? `Part Payment for Invoice ${invoice.invoiceNo}` : `Full Payment for Invoice ${invoice.invoiceNo}`,
        category: syncAmount < invoice.total ? "Advance" : "Project Payment",
        paymentMode: invoice.paymentMode || "GPay",
        amount: syncAmount,
        client: invoice.client,
        invoiceNo: invoice.invoiceNo,
        transactionId: invoice.transactionId || "",
        date: invoice.paymentDate || invoice.date || new Date().toISOString().split("T")[0],
        status: "Received",
        currency: invoice.currency || "₹",
        companyId: invoice.companyId || req.companyId || "",
      });
      await newIncome.save();
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
