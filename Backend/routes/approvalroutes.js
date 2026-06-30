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

        const docs = await Approval.find({ companyId, clientId, recipientType: "client", status: "pending" })
            .sort({ createdAt: -1 })
            .lean();
        res.json(docs);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// ── GET pending approvals for a specific team member (employee dashboard) ──
router.get("/team/:teamMemberId", async (req, res) => {
    try {
        const companyId = req.headers['x-company-id'] || req.companyId || "";
        const teamMemberId = String(req.params.teamMemberId).trim();
        if (!companyId || !teamMemberId) return res.json([]);

        const docs = await Approval.find({ companyId, teamMemberId, recipientType: "team", status: "pending" })
            .sort({ createdAt: -1 })
            .lean();
        res.json(docs);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// ── GET all approvals for a specific project (subadmin status view) ────────
router.get("/project/:projectId", async (req, res) => {
    try {
        const companyId = req.headers['x-company-id'] || req.companyId || "";
        const projectId = String(req.params.projectId).trim();
        if (!companyId || !projectId) return res.json([]);

        const docs = await Approval.find({ companyId, projectId }).sort({ createdAt: -1 }).lean();
        res.json(docs);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// ── POST create a new approval request (subadmin side) ────────────────────
router.post("/", async (req, res) => {
    try {
        const { companyId, clientId, recipientType, teamMemberId, senderName, title, desc, icon, approveLabel, rejectLabel, sourceType, sourceId, projectId, fileUrl, fileName } = req.body;
        if (!companyId || !title) {
            return res.status(400).json({ msg: "companyId and title are required" });
        }
        const isTeam = recipientType === "team";
        if (isTeam && !teamMemberId) return res.status(400).json({ msg: "teamMemberId is required when recipientType is 'team'" });
        if (!isTeam && !clientId) return res.status(400).json({ msg: "clientId is required when recipientType is 'client'" });

        const approval = new Approval({
            companyId,
            clientId: clientId || "",
            recipientType: isTeam ? "team" : "client",
            teamMemberId: teamMemberId || "",
            senderName: senderName || "",
            title, desc: desc || "",
            icon: icon || "ti-file-text",
            approveLabel: approveLabel || "Approve",
            rejectLabel: rejectLabel || "Reject",
            sourceType: sourceType || "general",
            sourceId: sourceId || "",
            projectId: projectId || "",
            fileUrl: fileUrl || "",
            fileName: fileName || "",
        });
        await approval.save();

        try {
            await new Notification({
                userId: isTeam ? teamMemberId : clientId,
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
        const { status, rejectReason } = req.body;
        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ msg: "status must be 'approved' or 'rejected'" });
        }
        if (status === "rejected" && (!rejectReason || !rejectReason.trim())) {
            return res.status(400).json({ msg: "rejectReason is required when rejecting" });
        }
        const doc = await Approval.findByIdAndUpdate(
            req.params.id,
            { status, rejectReason: status === "rejected" ? rejectReason.trim() : "", respondedAt: new Date() },
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