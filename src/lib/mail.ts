import nodemailer from "nodemailer";
import { format } from "date-fns";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendNotificationEmail(
  to: string,
  assignmentName: string,
  courseName: string,
  dueDate: Date,
  description: string | null
) {
  const formattedDate = dueDate.toLocaleString();

  const mailOptions = {
    from: `"dcal" <${process.env.SMTP_USER}>`,
    to,
    subject: `REMINDER: ${assignmentName} due soon`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 20px; border: 1px solid #333;">
        <h2 style="color: #00f3ff;">Assignment Due Reminder</h2>
        <p>This is a reminder that the following assignment is due within 24 hours:</p>
        
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-left: 4px solid #bd00ff; margin: 20px 0;">
          <h3 style="margin: 0; color: #fff;">${assignmentName}</h3>
          <p style="color: #bd00ff; margin-top: 5px;">${courseName}</p>
          <p style="color: #ccc;">Due: <strong>${formattedDate}</strong></p>
          ${description ? `<p style="font-size: 0.9em; color: #aaa;">${description}</p>` : ""}
        </div>
        
        <p style="font-size: 0.8em; color: #666;">Sent by dcal Notification System</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

interface AssignmentSummary {
  assignmentName: string;
  courseName: string;
  dueDateTime: Date;
  description: string | null;
  submitted: boolean;
}

interface EventSummary {
  title: string;
  dateTime: Date;
  description: string | null;
  tags: string[];
}

export async function sendDailySummaryEmail(
  to: string,
  assignments: AssignmentSummary[],
  events: EventSummary[],
  dateLabel: string
) {
  const pendingAssignments = assignments.filter(a => !a.submitted);
  const completedAssignments = assignments.filter(a => a.submitted);

  // Build assignments HTML
  let assignmentsHtml = "";
  if (pendingAssignments.length > 0) {
    assignmentsHtml = `
      <h3 style="color: #a855f7; margin: 20px 0 10px 0; font-size: 16px;">📚 Pending Assignments (${pendingAssignments.length})</h3>
      ${pendingAssignments.map(a => `
        <div style="background: rgba(168,85,247,0.1); padding: 12px 15px; border-left: 3px solid #a855f7; margin: 8px 0; border-radius: 0 8px 8px 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <strong style="color: #fff; font-size: 14px;">${a.assignmentName}</strong>
              <p style="color: #a855f7; margin: 4px 0 0 0; font-size: 12px;">${a.courseName}</p>
            </div>
            <span style="color: #f59e0b; font-size: 12px; white-space: nowrap;">${format(new Date(a.dueDateTime), "MMM d 'at' h:mm a")}</span>
          </div>
          ${a.description ? `<p style="color: #888; font-size: 12px; margin: 8px 0 0 0;">${a.description.substring(0, 100)}${a.description.length > 100 ? "..." : ""}</p>` : ""}
        </div>
      `).join("")}
    `;
  }

  if (completedAssignments.length > 0) {
    assignmentsHtml += `
      <h3 style="color: #10b981; margin: 20px 0 10px 0; font-size: 16px;">✅ Completed (${completedAssignments.length})</h3>
      <p style="color: #666; font-size: 12px; margin: 0;">
        ${completedAssignments.map(a => a.assignmentName).join(", ")}
      </p>
    `;
  }

  if (assignments.length === 0) {
    assignmentsHtml = `
      <p style="color: #666; font-style: italic; margin: 15px 0;">No assignments scheduled.</p>
    `;
  }

  // Build events HTML
  let eventsHtml = "";
  if (events.length > 0) {
    eventsHtml = `
      <h3 style="color: #22d3ee; margin: 20px 0 10px 0; font-size: 16px;">📅 Events (${events.length})</h3>
      ${events.map(e => `
        <div style="background: rgba(34,211,238,0.1); padding: 12px 15px; border-left: 3px solid #22d3ee; margin: 8px 0; border-radius: 0 8px 8px 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <strong style="color: #fff; font-size: 14px;">${e.title}</strong>
            <span style="color: #22d3ee; font-size: 12px; white-space: nowrap;">${format(new Date(e.dateTime), "MMM d 'at' h:mm a")}</span>
          </div>
          ${e.tags && e.tags.length > 0 ? `
            <div style="margin-top: 6px;">
              ${e.tags.map(tag => `<span style="background: rgba(34,211,238,0.2); color: #22d3ee; padding: 2px 8px; border-radius: 12px; font-size: 10px; margin-right: 4px;">${tag}</span>`).join("")}
            </div>
          ` : ""}
          ${e.description ? `<p style="color: #888; font-size: 12px; margin: 8px 0 0 0;">${e.description.substring(0, 100)}${e.description.length > 100 ? "..." : ""}</p>` : ""}
        </div>
      `).join("")}
    `;
  } else {
    eventsHtml = `
      <h3 style="color: #22d3ee; margin: 20px 0 10px 0; font-size: 16px;">📅 Events</h3>
      <p style="color: #666; font-style: italic; margin: 0;">No events scheduled.</p>
    `;
  }

  const mailOptions = {
    from: `"dcal" <${process.env.SMTP_USER}>`,
    to,
    subject: `📊 Daily Summary - ${dateLabel}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #ededed; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, rgba(34,211,238,0.2), rgba(168,85,247,0.2)); padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <h1 style="margin: 0; font-size: 24px; color: #fff;">Daily Summary</h1>
          <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 14px;">${dateLabel}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 20px 24px;">
          <!-- Quick Stats -->
          <div style="display: flex; gap: 12px; margin-bottom: 20px;">
            <div style="flex: 1; background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.2); border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #a855f7;">${pendingAssignments.length}</div>
              <div style="font-size: 11px; color: #888; text-transform: uppercase;">Pending</div>
            </div>
            <div style="flex: 1; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${completedAssignments.length}</div>
              <div style="font-size: 11px; color: #888; text-transform: uppercase;">Completed</div>
            </div>
            <div style="flex: 1; background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.2); border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #22d3ee;">${events.length}</div>
              <div style="font-size: 11px; color: #888; text-transform: uppercase;">Events</div>
            </div>
          </div>

          ${assignmentsHtml}
          ${eventsHtml}
        </div>
        
        <!-- Footer -->
        <div style="padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
          <p style="font-size: 11px; color: #52525b; margin: 0;">Sent by dcal • Daily summary at 6 PM EST</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Daily summary sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending daily summary:", error);
    return false;
  }
}

