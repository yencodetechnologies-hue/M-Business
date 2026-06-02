const express = require('express');
const router = express.Router();
const Document = require('../models/DocumentModel');
const Notification = require('../models/NotificationModel');

// Send a new document (from subadmin to client/employee)
router.post('/', async (req, res) => {
    try {
        const { docType, sendTo, client, recipientEmail, htmlContent, senderCompany, companyId } = req.body;
        
        if (!companyId || !client || !htmlContent) {
            return res.status(400).json({ msg: "companyId, client name, and htmlContent are required." });
        }

        const newDoc = new Document({
            docType,
            sendTo,
            client,
            recipientEmail,
            htmlContent,
            senderCompany,
            companyId
        });
        
        const savedDoc = await newDoc.save();

        res.status(201).json(savedDoc);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Get documents for a specific receiver or company
router.get('/', async (req, res) => {
    try {
        const { companyId, client, sendTo } = req.query;
        if (!companyId) {
            return res.status(400).json({ msg: "Company ID required" });
        }
        
        let query = { companyId };
        
        // If a client name is provided, filter by it (case-insensitive)
        if (client) {
            query.client = new RegExp(`^${client}$`, 'i');
        }

        // If sendTo is provided, filter by recipient type (client/employee)
        if (sendTo) {
            query.sendTo = sendTo;
        }

        const documents = await Document.find(query).sort({ dateSent: -1 });
        res.json(documents);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

module.exports = router;
