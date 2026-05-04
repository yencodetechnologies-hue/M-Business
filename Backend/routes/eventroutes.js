// routes/events.js
const express = require("express");
const router = express.Router();
const Event = require("../models/EventModels");

// GET all events
router.get("/", async (req, res) => {
  try {
    const { companyId, employeeName, projectNames } = req.query;
    const filter = {};
    
    if (companyId && companyId !== "admin-company-id" && companyId !== "default") {
      filter.companyId = companyId;
    }

    // If employeeName is provided, we filter to show:
    // 1. Events created by this employee
    // 2. Events linked to projects this employee is assigned to (passed via projectNames array/string)
    if (employeeName) {
      const nameRegex = new RegExp(`^${employeeName}$`, "i");
      const orConditions = [{ createdBy: { $regex: nameRegex } }];
      
      if (projectNames) {
        const pList = Array.isArray(projectNames) ? projectNames : projectNames.split(",");
        orConditions.push({ project: { $in: pList } });
      }
      
      filter.$or = orConditions;
    }

    const events = await Event.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// POST create event
router.post("/", async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    
    // Email notifications
    try {
      const { sendQuickEmail } = require("../config/email");
      const creatorRole = (event.createdByRole || "").toLowerCase();
      
      if (creatorRole === "subadmin" || creatorRole === "sub_admin" || creatorRole === "sub-admin") {
        if (event.client) {
          const Client = require("../models/ClientModel");
          const clientObj = await Client.findOne({ $or: [{ clientName: event.client }, { name: event.client }] });
          if (clientObj && clientObj.email) {
            const html = `Hello ${clientObj.contactPersonName || clientObj.clientName || clientObj.name},<br><br>A new ${event.type} has been scheduled with you by ${event.createdBy || "your provider"}.<br><br><b>Event:</b> ${event.name}<br><b>Date:</b> ${event.date}<br><b>Time:</b> ${event.start || "--"} to ${event.end || "--"}<br><br>Please check your client dashboard for more details.`;
            await sendQuickEmail(clientObj.email, `New ${event.type} Scheduled: ${event.name}`, html);
          }
        }
      } else if (creatorRole === "client") {
        if (event.companyId) {
          const User = require("../models/UserModels");
          const subadmins = await User.find({ companyId: event.companyId, role: { $in: ["subadmin", "sub_admin", "sub-admin"] } });
          for (const sa of subadmins) {
            if (sa.email) {
              const html = `Hello ${sa.name},<br><br>Your client ${event.createdBy || event.client} has scheduled a new ${event.type}.<br><br><b>Event:</b> ${event.name}<br><b>Date:</b> ${event.date}<br><b>Time:</b> ${event.start || "--"} to ${event.end || "--"}<br><br>Please check your dashboard for more details.`;
              await sendQuickEmail(sa.email, `New ${event.type} Requested by Client`, html);
            }
          }
        }
      }
    } catch (emailErr) {
      console.error("Email notification error:", emailErr);
    }

    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ msg: "Failed to create event", error: err.message });
  }
});

// PUT update event
router.put("/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!event) return res.status(404).json({ msg: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(400).json({ msg: "Failed to update event", error: err.message });
  }
});

// DELETE event
router.delete("/:id", async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ msg: "Event deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete event", error: err.message });
  }
});

module.exports = router;
