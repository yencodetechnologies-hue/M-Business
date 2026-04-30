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
    const companyId = req.companyId || "";
    const name = decodeURIComponent(req.params.clientName).trim();
    
    // 1. Find all projects belonging to this client
    const projectFilter = { client: { $regex: new RegExp(`^\\s*${name}\\s*$`, "i") } };
    if (companyId) projectFilter.companyId = companyId;
    const projects = await Project.find(projectFilter);
    const projectIds = projects.map(p => p._id);
    
    // 2. Find all tasks for those projects OR directly assigned to the client
    const taskFilter = {
      $or: [
        { projectId: { $in: projectIds } },
        { assignTo: { $regex: new RegExp(`^\\s*${name}\\s*$`, "i") } }
      ],
      isDeleted: false,
    };
    if (companyId) taskFilter.companyId = companyId;

    const tasks = await Task.find(taskFilter).sort({ createdAt: -1 });
    
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
