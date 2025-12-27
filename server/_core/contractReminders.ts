import * as db from "../db";
import { sendEmail } from "./email";
import cron from "node-cron";

const ADMIN_EMAIL = process.env.GMAIL_USER || 'admin@doublecranchllc.com';
const PORTAL_URL = process.env.VITE_OAUTH_PORTAL_URL || 'https://memberdoublecranchllc.com';

/**
 * Check for unsigned contracts and send reminders
 * Runs daily at 9:00 AM
 */
export function initContractReminderScheduler() {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[Contract Reminders] Running daily check...');
    await checkAndSendReminders();
  });

  console.log('[Contract Reminders] Scheduler initialized');
}

async function checkAndSendReminders() {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all unsigned contract assignments
    const unsignedAssignments = await db.getUnsignedContractAssignments();

    for (const assignment of unsignedAssignments) {
      const assignedDate = new Date(assignment.createdAt);
      const daysSinceAssigned = Math.floor((now.getTime() - assignedDate.getTime()) / (24 * 60 * 60 * 1000));

      // Send 3-day reminder
      if (daysSinceAssigned >= 3 && !assignment.firstReminderSentAt) {
        await send3DayReminder(assignment);
      }

      // Send 7-day reminder (final/overdue)
      if (daysSinceAssigned >= 7 && !assignment.finalReminderSentAt) {
        await send7DayReminder(assignment);
      }
    }

    console.log(`[Contract Reminders] Processed ${unsignedAssignments.length} unsigned contracts`);
  } catch (error) {
    console.error('[Contract Reminders] Error sending reminders:', error);
  }
}

async function send3DayReminder(assignment: any) {
  try {
    const member = await db.getMemberById(assignment.memberId);
    const user = member ? await db.getUserById(member.userId) : null;
    const contract = await db.getContractById(assignment.contractId);

    if (!user || !contract) return;

    // Send reminder to member
    await sendEmail({
      to: user.email,
      subject: `Reminder: Please Sign Your ${contract.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7f1d1d;">Contract Signature Reminder</h2>
          <p>Dear ${user.name},</p>
          <p>This is a friendly reminder that you have a contract waiting for your signature.</p>
          
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Contract:</strong> ${contract.title}</p>
            <p><strong>Assigned:</strong> ${new Date(assignment.createdAt).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'As soon as possible'}</p>
          </div>
          
          <p><a href="${PORTAL_URL}/contracts" style="background-color: #7f1d1d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Sign Contract Now</a></p>
          
          <p>Please log in to your member portal to review and sign the contract at your earliest convenience.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br/>Double C Ranch Team</p>
        </div>
      `,
    });

    // Send notification to admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `FYI: ${user.name} hasn't signed ${contract.title} (3 days)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h3 style="color: #7f1d1d;">Contract Reminder Sent</h3>
          <p>A 3-day reminder has been automatically sent to the following member:</p>
          
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Member:</strong> ${user.name} (${user.email})</p>
            <p><strong>Contract:</strong> ${contract.title}</p>
            <p><strong>Assigned:</strong> ${new Date(assignment.createdAt).toLocaleDateString()}</p>
            <p><strong>Days Unsigned:</strong> 3 days</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">This is an automated notification to keep you informed. No action required unless you want to follow up personally.</p>
        </div>
      `,
    });

    // Update reminder tracking
    await db.updateContractAssignment(assignment.id, {
      firstReminderSentAt: new Date(),
    });

    console.log(`[Contract Reminders] Sent 3-day reminder for assignment ${assignment.id}`);
  } catch (error) {
    console.error(`[Contract Reminders] Error sending 3-day reminder for assignment ${assignment.id}:`, error);
  }
}

async function send7DayReminder(assignment: any) {
  try {
    const member = await db.getMemberById(assignment.memberId);
    const user = member ? await db.getUserById(member.userId) : null;
    const contract = await db.getContractById(assignment.contractId);

    if (!user || !contract) return;

    // Send final reminder to member
    await sendEmail({
      to: user.email,
      subject: `Final Reminder: Your ${contract.title} is Overdue`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Final Reminder: Contract Overdue</h2>
          <p>Dear ${user.name},</p>
          <p><strong>Your contract signature is now overdue.</strong> Please sign it as soon as possible to maintain your active membership status.</p>
          
          <div style="background-color: #fee2e2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p><strong>Contract:</strong> ${contract.title}</p>
            <p><strong>Assigned:</strong> ${new Date(assignment.createdAt).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'As soon as possible'}</p>
            <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">OVERDUE</span></p>
          </div>
          
          <p><a href="${PORTAL_URL}/contracts" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Sign Contract Immediately</a></p>
          
          <p>If you need assistance or have questions about this contract, please contact us immediately.</p>
          
          <p>Best regards,<br/>Double C Ranch Team</p>
        </div>
      `,
    });

    // Send alert to admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `⚠️ Alert: ${user.name}'s ${contract.title} is Overdue (7 days)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h3 style="color: #dc2626;">⚠️ Contract Overdue Alert</h3>
          <p>The following member has not signed their contract after 7 days:</p>
          
          <div style="background-color: #fee2e2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p><strong>Member:</strong> ${user.name} (${user.email})</p>
            <p><strong>Phone:</strong> ${member?.phone || 'N/A'}</p>
            <p><strong>Contract:</strong> ${contract.title}</p>
            <p><strong>Assigned:</strong> ${new Date(assignment.createdAt).toLocaleDateString()}</p>
            <p><strong>Days Unsigned:</strong> 7+ days</p>
            <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">OVERDUE</span></p>
          </div>
          
          <p><strong>Action Recommended:</strong> Consider reaching out personally to ensure they complete the contract signing process.</p>
          
          <p><a href="${PORTAL_URL}/staff/pending-members" style="background-color: #7f1d1d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">View Member Details</a></p>
        </div>
      `,
    });

    // Update reminder tracking
    await db.updateContractAssignment(assignment.id, {
      finalReminderSentAt: new Date(),
    });

    console.log(`[Contract Reminders] Sent 7-day reminder for assignment ${assignment.id}`);
  } catch (error) {
    console.error(`[Contract Reminders] Error sending 7-day reminder for assignment ${assignment.id}:`, error);
  }
}
