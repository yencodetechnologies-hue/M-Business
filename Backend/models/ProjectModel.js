const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: String, default: "" },

  category: { type: String, default: "Web Development" },
  priority: { type: String, default: "medium" },
  purpose: { type: String, default: "" },
  description: { type: String, default: "" },
  start: { type: String, default: "" },
  end: { type: String, default: "" },
  deadline: { type: String, default: "" },
  budget: { type: Number, default: 0 },
  currency: { type: String, default: "₹" },
  billed: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
  team: { type: String, default: "" },
  status: { type: String, default: "Pending" },
  progress: { type: Number, default: 0 },
  tasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  assignedTo: { type: [String], default: [] },  // ✅ Fixed

  companyId: { type: String, default: "" },
  clientId: { type: String, default: "" },
  loggedHours: { type: Number, default: 0 },
  milestones: {
    type: [{
      name: { type: String, required: true },
      date: { type: String, default: "" },
      startDate: { type: String, default: "" },
      endDate: { type: String, default: "" },
      done: { type: Boolean, default: false }
    }],
    default: []
  },
  updates: {
    type: [{
      text: { type: String, required: true },
      title: { type: String, default: "" },
      type: { type: String, default: "general" },
      date: { type: Date, default: Date.now },
      author: { type: String, default: "System" },
      visibleTo: { type: [String], default: ["team", "client"] },
      // Legacy single-attachment fields (kept for backwards compatibility)
      fileName: { type: String, default: "" },
      fileUrl: { type: String, default: "" },
      fileType: { type: String, default: "" },
      // Full attachment list, so multiple images/files can be attached to one update
      attachments: {
        type: [{
          name: { type: String, default: "" },
          url: { type: String, default: "" },
          type: { type: String, default: "" }
        }],
        default: []
      }
    }],
    default: []
  },
  files: {
    type: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      size: { type: Number, default: 0 },
      type: { type: String, default: "" },
      description: { type: String, default: "" },
      uploadedAt: { type: Date, default: Date.now },
      sentToClient: { type: String, default: null },
      sentToEmployee: { type: mongoose.Schema.Types.Mixed, default: null }
    }],
    default: []
  },

  invoices: {
    type: [{
      invoiceNo: { type: String, required: true },
      description: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      issueDate: { type: String, default: "" },
      dueDate: { type: String, default: "" },
      taxPercent: { type: Number, default: 0 },
      taxType: { type: String, default: "exclusive" },
      status: { type: String, default: "Draft" },
      notes: { type: String, default: "" },
      notifyClient: { type: Boolean, default: false },
      signature: { type: String, default: "" },
      signatureType: { type: String, default: "text" },
      invoiceType: { type: String, default: "Milestone" },
      customInvoiceType: { type: String, default: "" },
      items: { type: mongoose.Schema.Types.Mixed, default: [] },
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  paymentsReceived: {
    type: [{
      paymentNo: { type: String, required: true },
      linkedInvoice: { type: String, default: "" },
      description: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      paymentDate: { type: String, default: "" },
      paymentMode: { type: String, default: "" },
      transactionRef: { type: String, default: "" },
      notes: { type: String, default: "" },
      notifyClient: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  advances: {
    type: [{
      advanceNo: { type: String, required: true },
      description: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      dateReceived: { type: String, default: "" },
      paymentMode: { type: String, default: "" },
      adjustmentStatus: { type: String, default: "Pending" },
      amountAdjusted: { type: Number, default: 0 },
      notes: { type: String, default: "" },
      notifyClient: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  additionalCharges: {
    type: [{
      chargeNo: { type: String, required: true },
      category: { type: String, default: "" },
      description: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      approvedBy: { type: String, default: "" },
      date: { type: String, default: "" },
      status: { type: String, default: "Pending" },
      notes: { type: String, default: "" },
      notifyClient: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  expenses: {
    type: [{
      expenseNo: { type: String, required: true },
      category: { type: String, default: "" },
      description: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      date: { type: String, default: "" },
      paymentMode: { type: String, default: "" },
      status: { type: String, default: "Paid" },
      notes: { type: String, default: "" },
      notifyClient: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  milestonePayments: {
    type: [{
      milestoneNo: { type: String, required: true },
      name: { type: String, default: "" },
      description: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      dueDate: { type: String, default: "" },
      status: { type: String, default: "Upcoming" },
      paidOn: { type: String, default: "" },
      notifyClient: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  portalSettings: {
    type: Object,
    default: {
      enablePortal: true,
      showProgress: true,
      showMilestones: true,
      showTeam: false,
      allowMessages: true
    }
  }
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);