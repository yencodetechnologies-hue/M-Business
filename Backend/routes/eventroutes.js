// routes/events.js
const express = require("express");
const router = express.Router();
const Event = require("../models/EventModels");

// GET all events
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.companyId && req.query.companyId !== "admin-company-id" && req.query.companyId !== "default") {
      filter.companyId = req.query.companyId;
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
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ msg: "Failed to create event", error: err.message });
  }
});

// PUT update event
router.put("/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.id, req.body, { new: true });
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
