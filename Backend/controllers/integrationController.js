const Task = require("../models/TaskModels");
const nodemailer = require("nodemailer");
const axios = require("axios");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendGmailNotification = async (task, statusChange) => {
  try {
    const taskWithMembers = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("invitedMembers.invitedBy", "name email");

    const recipients = [
      ...taskWithMembers.assignedTo.map(member => member.email),
      ...taskWithMembers.invitedMembers.map(invite => invite.email)
    ];

    if (recipients.length === 0) return;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.join(","),
      subject: `Task Update: ${task.title}`,
      html: `
        <h2>Task Status Update</h2>
        <p><strong>Task:</strong> ${task.title}</p>
        <p><strong>Status Change:</strong> ${statusChange}</p>
        <p><strong>Description:</strong> ${task.description}</p>
        <p><strong>Priority:</strong> ${task.priority}</p>
        <p>View the task in your dashboard for more details.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("Gmail notification sent for task:", task.title);
  } catch (error) {
    console.error("Error sending Gmail notification:", error);
  }
};

exports.postToSlack = async (task, statusChange) => {
  try {
    if (!process.env.SLACK_WEBHOOK_URL) {
      console.log("Slack webhook URL not configured");
      return;
    }

    const message = {
      text: `Task Update: ${task.title}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Task Update: ${task.title}*`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Status:* ${statusChange}`
            },
            {
              type: "mrkdwn",
              text: `*Priority:* ${task.priority}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Description:* ${task.description}`
          }
        }
      ]
    };

    await axios.post(process.env.SLACK_WEBHOOK_URL, message);
    console.log("Slack notification sent for task:", task.title);
  } catch (error) {
    console.error("Error posting to Slack:", error);
  }
};

exports.syncWithGoogleCalendar = async (task) => {
  try {
    if (!process.env.GOOGLE_CALENDAR_API_KEY) {
      console.log("Google Calendar API key not configured");
      return;
    }

    if (!task.date) {
      console.log("Task has no due date, skipping calendar sync");
      return;
    }

    const event = {
      summary: task.title,
      description: task.description,
      start: {
        date: task.date
      },
      end: {
        date: task.date
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 }
        ]
      }
    };

    const calendarId = 'primary';
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${process.env.GOOGLE_CALENDAR_API_KEY}`;

    const response = await axios.post(url, event, {
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("Google Calendar event created for task:", task.title);
    return response.data;
  } catch (error) {
    console.error("Error syncing with Google Calendar:", error);
  }
};

exports.linkToGitHub = async (task, commitData) => {
  try {
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
      console.log("GitHub credentials not configured");
      return;
    }

    const issueTitle = `Task: ${task.title}`;
    const issueBody = `
## Task Details
**Title:** ${task.title}
**Description:** ${task.description}
**Priority:** ${task.priority}
**Status:** ${task.status}
**Due Date:** ${task.date || 'Not set'}

## Related Commits
${commitData.map(commit => `- ${commit.message} (${commit.sha})`).join('\n')}
    `;

    const issueData = {
      title: issueTitle,
      body: issueBody,
      labels: ['task', task.priority.toLowerCase().replace(' ', '-')]
    };

    const response = await axios.post(
      `https://api.github.com/repos/${process.env.GITHUB_REPO}/issues`,
      issueData,
      {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    console.log("GitHub issue created for task:", task.title);
    return response.data;
  } catch (error) {
    console.error("Error linking to GitHub:", error);
  }
};

exports.sendToZapier = async (task, action) => {
  try {
    if (!process.env.ZAPIER_WEBHOOK_URL) {
      console.log("Zapier webhook URL not configured");
      return;
    }

    const payload = {
      action,
      task: {
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        date: task.date,
        assignedTo: task.assignedTo,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      },
      timestamp: new Date().toISOString()
    };

    await axios.post(process.env.ZAPIER_WEBHOOK_URL, payload);
    console.log("Data sent to Zapier for task:", task.title);
  } catch (error) {
    console.error("Error sending to Zapier:", error);
  }
};

exports.handleTaskUpdate = async (taskId, updateData, previousData) => {
  try {
    const task = await Task.findById(taskId);
    if (!task) return;

    const integrations = task.integrations || {};
    
    if (integrations.gmail && updateData.status && updateData.status !== previousData.status) {
      await exports.sendGmailNotification(task, `Status changed from ${previousData.status} to ${updateData.status}`);
    }

    if (integrations.slack && updateData.status && updateData.status !== previousData.status) {
      await exports.postToSlack(task, `Status changed from ${previousData.status} to ${updateData.status}`);
    }

    if (integrations.googleCalendar && updateData.date && updateData.date !== previousData.date) {
      await exports.syncWithGoogleCalendar(task);
    }

    if (integrations.github) {
      const commitData = updateData.commits || [];
      if (commitData.length > 0) {
        await exports.linkToGitHub(task, commitData);
      }
    }

    if (integrations.zapier) {
      await exports.sendToZapier(task, 'updated');
    }
  } catch (error) {
    console.error("Error handling task update integrations:", error);
  }
};

exports.handleTaskCreation = async (task) => {
  try {
    const integrations = task.integrations || {};
    
    if (integrations.gmail) {
      await exports.sendGmailNotification(task, 'Task created');
    }

    if (integrations.slack) {
      await exports.postToSlack(task, 'Task created');
    }

    if (integrations.googleCalendar && task.date) {
      await exports.syncWithGoogleCalendar(task);
    }

    if (integrations.zapier) {
      await exports.sendToZapier(task, 'created');
    }
  } catch (error) {
    console.error("Error handling task creation integrations:", error);
  }
};
