const express = require("express");
const router = express.Router();
const {
  sendGmailNotification,
  postToSlack,
  syncWithGoogleCalendar,
  linkToGitHub,
  sendToZapier,
  handleTaskUpdate,
  handleTaskCreation
} = require("../controllers/integrationController");

router.post("/gmail/test", async (req, res) => {
  try {
    const { taskId } = req.body;
    const Task = require("../models/TaskModels");
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await sendGmailNotification(task, "Test notification");
    res.json({ message: "Gmail test notification sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/slack/test", async (req, res) => {
  try {
    const { taskId } = req.body;
    const Task = require("../models/TaskModels");
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await postToSlack(task, "Test notification");
    res.json({ message: "Slack test notification sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/calendar/test", async (req, res) => {
  try {
    const { taskId } = req.body;
    const Task = require("../models/TaskModels");
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const result = await syncWithGoogleCalendar(task);
    res.json({ message: "Google Calendar sync test completed", result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/github/test", async (req, res) => {
  try {
    const { taskId } = req.body;
    const Task = require("../models/TaskModels");
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const commitData = [
      { message: "Test commit", sha: "abc123" }
    ];
    
    const result = await linkToGitHub(task, commitData);
    res.json({ message: "GitHub link test completed", result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/zapier/test", async (req, res) => {
  try {
    const { taskId } = req.body;
    const Task = require("../models/TaskModels");
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await sendToZapier(task, "test");
    res.json({ message: "Zapier test notification sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
