const express = require("express");
const router = express.Router();
const Invoice = require("../models/InvoiceModels");

// Save invoice
router.post("/", async (req, res) => {
  try {
    const { inv, items } = req.body;
    
    const subtotal = items.reduce((s, i) => 
      s + (parseFloat(i.rate)||0) * (parseFloat(i.quantity)||0), 0);
    const gstAmt = subtotal * (inv.gstRate / 100);
    const total = subtotal + gstAmt;

    const invoice = new Invoice({
      invoiceNo: inv.invoiceNo,
      orderNo: inv.orderNo,
      date: inv.date,
      dueDate: inv.dueDate,
      client: inv.client,
      project: inv.project,
      gstRate: inv.gstRate,
      notes: inv.notes,
      terms: inv.terms,
      companyName: inv.companyName,
      companyEmail: inv.companyEmail,
      companyPhone: inv.companyPhone,
      companyAddress: inv.companyAddress,
      items,
      subtotal,
      gstAmt,
      total,
      status: "draft"
    });

    await invoice.save();
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

// Get all invoices
router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get single invoice
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ msg: "Not found" });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Update invoice
router.put("/:id", async (req, res) => {
  try {
    const { inv, items } = req.body;
    const subtotal = items.reduce((s, i) => 
      s + (parseFloat(i.rate)||0) * (parseFloat(i.quantity)||0), 0);
    const updated = await Invoice.findByIdAndUpdate(
      req.params.id,
      { ...inv, items, subtotal, gstAmt: subtotal*(inv.gstRate/100), total: subtotal*(1+inv.gstRate/100) },
      { new: true }
    );
    res.json({ success: true, invoice: updated });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Delete invoice
router.delete("/:id", async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;