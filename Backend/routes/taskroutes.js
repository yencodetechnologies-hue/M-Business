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
} = require("../controllers/taskController");

router.get("/board",          getBoardData);

router.get("/",               getAllTasks);
router.get("/:id",            getTask);
router.post("/",              createTask);
router.put("/:id",            updateTask);
router.patch("/:id/toggle",   toggleChecked);
router.patch("/:id/move",     moveTask);
router.delete("/:id",         deleteTask);

module.exports = router;
