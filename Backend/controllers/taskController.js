const Task  = require("../models/TaskModels");
const Group = require("../models/GroupModels");
const TaskInvitation = require("../models/TaskInvitationModel");
const User = require("../models/UserModels");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

exports.getAllTasks = async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const filter = { isDeleted: false, companyId };
    if (req.query.groupId)  filter.groupId  = req.query.groupId;
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.assignTo) filter.assignTo = req.query.assignTo;
    if (req.query.person) {
      filter.$or = [
        { assignedTo: req.query.person },
        { "invitedMembers.email": req.query.person }
      ];
    }

    const tasks = await Task.find(filter)
      .populate("projectId", "name color")
      .populate("assignedTo", "name email")
      .populate("invitedMembers.invitedBy", "name email")
      .sort({ order: 1, createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBoardData = async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const groupFilter = { isDeleted: false, companyId };
    const groups = await Group.find(groupFilter).sort({ order: 1, createdAt: 1 });

    const board = await Promise.all(
      groups.map(async (g) => {
        const taskFilter = { groupId: g._id, isDeleted: false, companyId };
        const tasks = await Task.find(taskFilter)
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
            type:          t.type,
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
    const companyId = req.companyId || "NONE";
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false, companyId })
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
      assignTo, type, date, time, estimatedTime,
      groupId, projectId,
    } = req.body;

    const companyId = req.companyId || "";
    const group = await Group.findOne({ _id: groupId, isDeleted: false, companyId });
    if (!group) return res.status(400).json({ message: "Group not found or unauthorized" });

    const lastTask = await Task.findOne({ groupId, isDeleted: false, companyId }).sort({ order: -1 });
    const order    = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      title, description, notes, status, priority,
      assignTo, type, date, time, estimatedTime,
      groupId,
      projectId: projectId || null,
      order,
      companyId: req.companyId || "",
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
      "assignTo","type","date","time","estimatedTime",
      "checked","groupId","projectId","order",
    ];

    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const companyId = req.companyId || "NONE";
    if (updates.groupId) {
      const group = await Group.findOne({ _id: updates.groupId, isDeleted: false, companyId });
      if (!group) return res.status(400).json({ message: "Target group not found or unauthorized" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, companyId },
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
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
    const companyId = req.companyId || "NONE";
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false, companyId });
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
    const companyId = req.companyId || "NONE";
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, companyId },
      { isDeleted: true },
      { returnDocument: 'after' }
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

    const companyId = req.companyId || "NONE";
    const group = await Group.findOne({ _id: groupId, isDeleted: false, companyId });
    if (!group) return res.status(400).json({ message: "Group not found or unauthorized" });

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, companyId },
      { groupId },
      { returnDocument: 'after' }
    ).populate("projectId", "name color");

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const { taskId, email } = req.body;
    const companyId = req.companyId || "NONE";
    
    const task = await Task.findOne({ _id: taskId, isDeleted: false, companyId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const existingInvitation = await TaskInvitation.findOne({ 
      task: taskId, 
      email, 
      status: "pending" 
    });
    if (existingInvitation) {
      return res.status(400).json({ message: "Invitation already sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const invitation = await TaskInvitation.create({
      task: taskId,
      email,
      invitedBy: req.user.id,
      token
    });

    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const inviteUrl = `${process.env.FRONTEND_URL}/invite/${token}`;
    await transporter.sendMail({
      to: email,
      subject: `Task Invitation: ${task.title}`,
      html: `
        <h2>You've been invited to a task!</h2>
        <p><strong>Task:</strong> ${task.title}</p>
        <p><strong>Description:</strong> ${task.description}</p>
        <p>Click <a href="${inviteUrl}">here</a> to accept or reject the invitation.</p>
        <p>This invitation expires in 7 days.</p>
      `
    });

    res.status(201).json({ message: "Invitation sent successfully", invitation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.respondToInvitation = async (req, res) => {
  try {
    const { token, action } = req.body;
    
    const invitation = await TaskInvitation.findOne({ token });
    if (!invitation) return res.status(404).json({ message: "Invalid invitation" });
    
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invitation expired" });
    }

    invitation.status = action === "accept" ? "accepted" : "rejected";
    await invitation.save();

    if (action === "accept") {
      let user = await User.findOne({ email: invitation.email });
      
      if (!user) {
        user = await User.create({
          name: invitation.email.split("@")[0],
          email: invitation.email,
          password: crypto.randomBytes(16).toString("hex"),
          role: "member"
        });
      }

      await Task.findByIdAndUpdate(
        invitation.task,
        { 
          $addToSet: { assignedTo: user._id },
          $pull: { 
            invitedMembers: { email: invitation.email }
          }
        }
      );
    }

    res.json({ message: `Invitation ${action}ed successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.autoAssignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.companyId || "NONE";
    
    const task = await Task.findOne({ _id: taskId, isDeleted: false, companyId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const availableUsers = await User.find({ 
      companyId, 
      role: { $in: ["member", "manager"] }
    }).sort({ createdAt: 1 });

    if (availableUsers.length === 0) {
      return res.status(400).json({ message: "No available users for assignment" });
    }

    const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];
    
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { 
        $addToSet: { assignedTo: randomUser._id },
        autoAssign: true
      },
      { returnDocument: 'after' }
    ).populate("assignedTo", "name email");

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateIntegrations = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { integrations } = req.body;
    const companyId = req.companyId || "NONE";
    
    const task = await Task.findOneAndUpdate(
      { _id: taskId, isDeleted: false, companyId },
      { integrations },
      { returnDocument: 'after' }
    );

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTaskMembers = async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.companyId || "NONE";
    
    const task = await Task.findOne({ _id: taskId, isDeleted: false, companyId })
      .populate("assignedTo", "name email")
      .populate("invitedMembers.invitedBy", "name email");

    if (!task) return res.status(404).json({ message: "Task not found" });

    const members = {
      assigned: task.assignedTo,
      invited: task.invitedMembers
    };

    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
