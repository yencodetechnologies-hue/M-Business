const express = require("express");
const router = express.Router();
const Approval = require("../models/ApprovalModel");
const Notification = require("../models/NotificationModel");

// ── GET pending approvals for a specific client (portal) ──────────────────
router.get("/client/:clientId", async (req, res) => {
    try {
        const companyId = req.headers['x-company-id'] || req.companyId || "";
        const clientId = String(req.params.clientId).trim();
        if (!companyId || !clientId) return res.json([]);

        const docs = await Approval.find({ companyId, clientId, status: "pending" })
            .sort({ createdAt: -1 })
            .lean();
        res.json(docs);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// ── POST create a new approval request (subadmin side) ────────────────────
router.post("/", async (req, res) => {
    try {
        const { companyId, clientId, title, desc, icon, approveLabel, rejectLabel, sourceType, sourceId, projectId } = req.body;
        if (!companyId || !clientId || !title) {
            return res.status(400).json({ msg: "companyId, clientId, and title are required" });
        }

        const approval = new Approval({
            companyId, clientId, title, desc: desc || "",
            icon: icon || "ti-file-text",
            approveLabel: approveLabel || "Approve",
            rejectLabel: rejectLabel || "Reject",
            sourceType: sourceType || "general",
            sourceId: sourceId || "",
            projectId: projectId || "",
        });
        await approval.save();

        try {
            await new Notification({
                userId: clientId,
                type: "approval",
                icon: "ti-clipboard-check",
                text: `${title} is awaiting your approval`,
                link: "dashboard",
                companyId,
            }).save();
        } catch (notifErr) {
            console.error("Failed to create approval notification:", notifErr.message);
        }

        res.status(201).json(approval);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// ── PATCH respond to an approval (approve / reject) ────────────────────────
router.patch("/:id/respond", async (req, res) => {
    try {
        const { status } = req.body;
        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ msg: "status must be 'approved' or 'rejected'" });
        }
        const doc = await Approval.findByIdAndUpdate(
            req.params.id,
            { status, respondedAt: new Date() },
            { new: true }
        );
        if (!doc) return res.status(404).json({ msg: "Approval not found" });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// ── GET all approvals for a company (subadmin dashboard view) ──────────────
router.get("/", async (req, res) => {
    try {
        const companyId = req.headers['x-company-id'] || req.companyId || "";
        if (!companyId) return res.json([]);
        const docs = await Approval.find({ companyId }).sort({ createdAt: -1 }).lean();
        res.json(docs);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

module.exports = router;