const express = require("express");
const router = express.Router();
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

router.get("/board", getBoardData);

router.get("/", getAllTasks);
router.get("/client/:clientName", async (req, res) => {
  try {
    const Project = require("../models/ProjectModel");
    const Task = require("../models/TaskModels");
    const name = decodeURIComponent(req.params.clientName).trim();
    const companyName = req.query.company ? decodeURIComponent(req.query.company).trim() : "";

    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const safeName = escapeRegExp(name);
    const safeCompany = escapeRegExp(companyName);

    const companyId = req.companyId || "";
    const clientId = req.query.clientId ? String(req.query.clientId).trim() : "";

    // If no companyId, return empty — prevents deleted client's old tasks showing
    if (!companyId) return res.json([]);

    // 1. Find all projects belonging to this client
    let projects;
    if (clientId) {
      // Strict match first
      projects = await Project.find({ companyId, clientId });
      if (projects.length === 0) {
        // Legacy fallback for projects saved before clientId existed
        const projectConditions = [];
        if (safeName) projectConditions.push({ client: { $regex: new RegExp(`^\\s*${safeName}\\s*$`, "i") } });
        if (safeCompany) projectConditions.push({ client: { $regex: new RegExp(`^\\s*${safeCompany}\\s*$`, "i") } });
        if (projectConditions.length) {
          projects = await Project.find({ companyId, $or: projectConditions });
        }
      }
    } else {
      const projectConditions = [];
      if (safeName) projectConditions.push({ client: { $regex: new RegExp(`^\\s*${safeName}\\s*$`, "i") } });
      if (safeCompany) projectConditions.push({ client: { $regex: new RegExp(`^\\s*${safeCompany}\\s*$`, "i") } });
      projects = await Project.find(projectConditions.length ? { companyId, $or: projectConditions } : { companyId });
    }
    const projectIds = projects.map(p => p._id);

    // Build a lookup: projectId string -> project name
    const projectNameMap = {};
    projects.forEach(p => { projectNameMap[String(p._id)] = p.name; });

    // 2. Find tasks linked to those projects OR directly assigned to the client
    const assignConditions = [];
    if (safeName) assignConditions.push({ assignTo: { $regex: new RegExp(`^\\s*${safeName}\\s*$`, "i") } });
    if (safeCompany) assignConditions.push({ assignTo: { $regex: new RegExp(`^\\s*${safeCompany}\\s*$`, "i") } });

    const taskFilter = {
      $or: [{ projectId: { $in: projectIds } }, ...assignConditions],
      isDeleted: false,
      ...(companyId ? { companyId } : {}),
    };

    const tasks = await Task.find(taskFilter).sort({ createdAt: -1 });

    // 3. Attach project name to every task so the frontend can match on it
    const tasksWithProject = tasks.map(t => {
      const obj = t.toObject();
      const pid = obj.projectId ? String(obj.projectId) : null;
      obj.project = pid ? (projectNameMap[pid] || "") : "";
      obj.projectRef = pid || "";
      return obj;
    });

    res.json(tasksWithProject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/:id", getTask);
router.get("/:id/members", getTaskMembers);
router.post("/", createTask);
router.post("/invite", inviteMember);
router.post("/respond", respondToInvitation);
router.put("/:id", updateTask);
router.patch("/:id/toggle", toggleChecked);
router.patch("/:id/move", moveTask);
router.patch("/:id/auto-assign", autoAssignTask);
router.patch("/:id/integrations", updateIntegrations);
router.post("/:id/comment", addComment);
router.delete("/:id", deleteTask);

module.exports = router;