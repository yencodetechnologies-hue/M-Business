const Task  = require("../models/TaskModels");
const Group = require("../models/GroupModels");

exports.getAllTasks = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    if (req.query.groupId)  filter.groupId  = req.query.groupId;
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.assignTo) filter.assignTo = req.query.assignTo;

    const tasks = await Task.find(filter)
      .populate("projectId", "name color")
      .sort({ order: 1, createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBoardData = async (req, res) => {
  try {
    const groups = await Group.find({ isDeleted: false }).sort({ order: 1, createdAt: 1 });

    const board = await Promise.all(
      groups.map(async (g) => {
        const tasks = await Task.find({ groupId: g._id, isDeleted: false })
          .populate("projectId", "name color")
          .sort({ order: 1, createdAt: 1 });

        return {
          id:    g._id,
          _id:   g._id,
          label: g.label,
          color: g.color,
          open:  g.open,
          tasks: tasks.map((t) => ({
            id:            t._id,
            _id:           t._id,
            title:         t.title,
            description:   t.description,
            notes:         t.notes,
            status:        t.status,
            priority:      t.priority,
            assignTo:      t.assignTo,
            date:          t.date,
            time:          t.time,
            estimatedTime: t.estimatedTime,
            checked:       t.checked,
            groupId:       t.groupId,
            projectId:     t.projectId,
            createdAt:     t.createdAt,
          })),
        };
      })
    );

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false })
      .populate("projectId", "name color")
      .populate("groupId", "label color");
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const {
      title, description, notes, status, priority,
      assignTo, date, time, estimatedTime,
      groupId, projectId,
    } = req.body;

    const group = await Group.findOne({ _id: groupId, isDeleted: false });
    if (!group) return res.status(400).json({ message: "Group not found" });

    const lastTask = await Task.findOne({ groupId, isDeleted: false }).sort({ order: -1 });
    const order    = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      title, description, notes, status, priority,
      assignTo, date, time, estimatedTime,
      groupId,
      projectId: projectId || null,
      order,
    });

    const populated = await task.populate("projectId", "name color");
    res.status(201).json(populated);
  } catch (err) {
    if (err.name === "ValidationError")
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(", ") });
    res.status(500).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const allowed = [
      "title","description","notes","status","priority",
      "assignTo","date","time","estimatedTime",
      "checked","groupId","projectId","order",
    ];

    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.groupId) {
      const group = await Group.findOne({ _id: updates.groupId, isDeleted: false });
      if (!group) return res.status(400).json({ message: "Target group not found" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("projectId", "name color");

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    if (err.name === "ValidationError")
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(", ") });
    res.status(500).json({ message: err.message });
  }
};

exports.toggleChecked = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) return res.status(404).json({ message: "Task not found" });
    task.checked = !task.checked;
    await task.save();
    res.json({ _id: task._id, checked: task.checked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted", _id: task._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.moveTask = async (req, res) => {
  try {
    const { groupId } = req.body;
    if (!groupId) return res.status(400).json({ message: "groupId required" });

    const group = await Group.findOne({ _id: groupId, isDeleted: false });
    if (!group) return res.status(400).json({ message: "Group not found" });

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { groupId },
      { new: true }
    ).populate("projectId", "name color");

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
