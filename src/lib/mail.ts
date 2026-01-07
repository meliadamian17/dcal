import nodemailer from "nodemailer";

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
    from: `"Academic Link" <${process.env.SMTP_USER}>`,
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
        
        <p style="font-size: 0.8em; color: #666;">Sent by Academic Link Notification System</p>
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

