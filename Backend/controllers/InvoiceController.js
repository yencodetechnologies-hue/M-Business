
// const InvoiceModel = require("../models/InvoiceModels");
 
// const invoiceController = {
//   getAll(_req, res) {
//     res.json(InvoiceModel.getAll());
//   },
 
//   getOne(req, res) {
//     const invoice = InvoiceModel.getById(req.params.id);
//     if (!invoice) return res.status(404).json({ msg: "Invoice not found" });
//     res.json(invoice);
//   },
 
//   save(req, res) {
//     const { inv, items } = req.body;
//     if (!inv || !items)
//       return res.status(400).json({ msg: "inv and items are required" });
 
//     const record = InvoiceModel.save({ inv, items });
//     res.status(201).json(record);
//   },
 
//   remove(req, res) {
//     const deleted = InvoiceModel.delete(req.params.id);
//     if (!deleted) return res.status(404).json({ msg: "Invoice not found" });
//     res.json({ ok: true });
//   },
// };
 
// module.exports = invoiceController;
 

