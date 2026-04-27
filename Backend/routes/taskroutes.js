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
} = require("../controllers/taskController");

router.get("/board",          getBoardData);

router.get("/",               getAllTasks);
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
router.delete("/:id",         deleteTask);

module.exports = router;
