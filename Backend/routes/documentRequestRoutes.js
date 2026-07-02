const express = require('express');
const router = express.Router();
const DocumentRequest = require('../models/DocumentRequestModel');
const Notification = require('../models/NotificationModel');

// Sub Admin creates a new document request for an employee
router.post('/', async (req, res) => {
  try {
    const { employeeId, employeeName, documentName, documentType, companyId } = req.body;
    if (!employeeId || !documentName || !companyId) {
      return res.status(400).json({ msg: "employeeId, documentName, and companyId are required." });
    }
    const reqDoc = new DocumentRequest({ employeeId, employeeName, documentName, documentType, companyId });
    const saved = await reqDoc.save();

    try {
      await new Notification({
        userId: employeeId,
        type: "warning",
        icon: "ti-folder",
        text: `Please upload your ${documentName}`,
        link: "documents",
        companyId: companyId || "",
      }).save();
    } catch (notifErr) {
      console.error("Failed to create document request notification:", notifErr.message);
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Employee fetches their own document requests
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const requests = await DocumentRequest.find({ employeeId: req.params.employeeId }).sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Sub Admin fetches all document requests for their company (optionally filtered to one employee)
router.get('/company/:companyId', async (req, res) => {
  try {
    const query = { companyId: req.params.companyId };
    if (req.query.employeeId) query.employeeId = req.query.employeeId;
    const requests = await DocumentRequest.find(query).sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Employee uploads the file for a specific request
router.patch('/:id/upload', async (req, res) => {
  try {
    const { fileUrl, fileName } = req.body;
    if (!fileUrl) return res.status(400).json({ msg: "fileUrl is required." });
    const updated = await DocumentRequest.findByIdAndUpdate(
      req.params.id,
      { fileUrl, fileName, status: 'uploaded', uploadedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ msg: "Request not found." });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
