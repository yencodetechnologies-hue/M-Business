const express = require("express");
const router  = express.Router();
const {
  getAllTasks,
  getBoardData,
  getTask,
  createTask,
  updateTask,
  toggleChecked,
  deleteTask,
  moveTask,
  inviteMember,
  respondToInvitation,
  autoAssignTask,
  updateIntegrations,
  getTaskMembers,
  addComment,
} = require("../controllers/taskController");

router.get("/board",          getBoardData);

router.get("/",               getAllTasks);
router.get("/client/:clientName", async (req, res) => {
  try {
    const Project = require("../models/ProjectModel");
    const Task = require("../models/TaskModels");
    const companyId = req.companyId || "NONE";
    const name = decodeURIComponent(req.params.clientName).trim();
    
    // 1. Find all projects belonging to this client
    const projects = await Project.find({
      client: { $regex: new RegExp(`^\\s*${name}\\s*$`, "i") },
      companyId
    });
    const projectIds = projects.map(p => p._id);
    
    // 2. Find all tasks for those projects
    const tasks = await Task.find({
      projectId: { $in: projectIds },
      isDeleted: false,
      companyId
    }).sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/:id",            getTask);
router.get("/:id/members",    getTaskMembers);
router.post("/",              createTask);
router.post("/invite",        inviteMember);
router.post("/respond",       respondToInvitation);
router.put("/:id",            updateTask);
router.patch("/:id/toggle",   toggleChecked);
router.patch("/:id/move",     moveTask);
router.patch("/:id/auto-assign", autoAssignTask);
router.patch("/:id/integrations", updateIntegrations);
router.post("/:id/comment", addComment);
router.delete("/:id",         deleteTask);

module.exports = router;
