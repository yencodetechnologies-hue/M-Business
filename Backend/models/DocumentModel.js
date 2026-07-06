const express = require('express');
const router = express.Router();
const Document = require('../models/DocumentModel');
const Notification = require('../models/NotificationModel');

router.post('/', async (req, res) => {
    try {
        const { docType, sendTo, client, recipientEmail, htmlContent, senderCompany, companyId, clientId, employeeId } = req.body;

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
            companyId,
            clientId: clientId || "",
            employeeId: employeeId || ""
        });

        const savedDoc = await newDoc.save();

        if (sendTo === "client" && clientId) {
            try {
                await new Notification({
                    userId: clientId,
                    type: "document",
                    icon: "ti-files",
                    text: `A new document has been shared with you`,
                }).save();
            } catch (notifErr) {
                console.error("Failed to create notification:", notifErr.message);
            }
        }

        res.status(201).json(savedDoc);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const { companyId, client, sendTo } = req.query;
        if (!companyId && !sendTo && !client) {
            return res.status(400).json({ msg: "Company ID or specific filter required" });
        }

        let query = {};
        if (companyId) query.companyId = companyId;

        const clientId = req.query.clientId || "";
        const employeeId = req.query.employeeId || "";

        if (employeeId) {
            query.employeeId = employeeId;
        } else if (clientId) {
            query.clientId = clientId;
        } else if (client) {
            query.client = new RegExp(`^${client}$`, 'i');
        }

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