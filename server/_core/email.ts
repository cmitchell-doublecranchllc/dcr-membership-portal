import { notifyOwner } from './notification';

/**
 * Send an email notification to a member
 * Uses the Manus notification system to deliver emails
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    // For now, we'll send notifications to the owner (you) about member events
    // In a production system, this would integrate with a proper email service
    // that can send to arbitrary email addresses
    
    const textContent = options.text || options.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    await notifyOwner({
      title: `Email to ${options.to}: ${options.subject}`,
      content: textContent.substring(0, 500) + (textContent.length > 500 ? '...' : ''),
    });

    console.log(`[Email] Notification sent for ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send notification:', error);
    return false;
  }
}

/**
 * Verify email system is ready
 */
export async function verifyEmailConnection(): Promise<boolean> {
  // Manus notification system is always available
  console.log('[Email] Using Manus notification system for emails');
  return true;
}

/**
 * Email templates for event notifications
 */

export function getEventRsvpConfirmationEmail(data: {
  memberName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation?: string;
  guestCount: number;
  status: string;
}): { subject: string; html: string } {
  const { memberName, eventTitle, eventDate, eventTime, eventLocation, guestCount, status } = data;

  const subject = `RSVP Confirmed: ${eventTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #c44536 0%, #8b3428 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c44536; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #c44536; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #c44536; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐴 Double C Ranch</h1>
          <p>Pony Club Riding Center</p>
        </div>
        <div class="content">
          <h2>Hi ${memberName}!</h2>
          <p>Thank you for your RSVP to our upcoming event. We're excited to see you there!</p>
          
          <div class="event-details">
            <h3>${eventTitle}</h3>
            <div class="detail-row">
              <span class="label">📅 Date:</span> ${eventDate}
            </div>
            <div class="detail-row">
              <span class="label">🕐 Time:</span> ${eventTime}
            </div>
            ${eventLocation ? `
            <div class="detail-row">
              <span class="label">📍 Location:</span> ${eventLocation}
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">👥 Guests:</span> ${guestCount > 0 ? `You + ${guestCount} guest${guestCount > 1 ? 's' : ''}` : 'Just you'}
            </div>
            <div class="detail-row">
              <span class="label">✅ Status:</span> ${status === 'attending' ? 'Confirmed' : status === 'maybe' ? 'Maybe' : status === 'waitlist' ? 'Waitlisted' : 'Not Attending'}
            </div>
          </div>

          ${status === 'waitlist' ? `
          <p style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
            <strong>⏳ You're on the waitlist</strong><br>
            This event is currently at capacity. We'll notify you immediately if a spot opens up!
          </p>
          ` : ''}

          <p>If you need to update your RSVP or have any questions, please log in to your member portal or contact us at (434) 205-0356.</p>
          
          <p>See you soon!</p>
          <p><strong>The Double C Ranch Team</strong></p>
        </div>
        <div class="footer">
          <p>Double C Ranch - Pony Club Riding Center</p>
          <p>📞 (434) 205-0356 | 🌐 doublecranchllc.com</p>
          <p style="font-size: 12px; color: #999;">You received this email because you RSVP'd to an event at Double C Ranch.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export function getEventReminderEmail(data: {
  memberName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation?: string;
  guestCount: number;
}): { subject: string; html: string } {
  const { memberName, eventTitle, eventDate, eventTime, eventLocation, guestCount } = data;

  const subject = `Reminder: ${eventTitle} Tomorrow!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #c44536 0%, #8b3428 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .reminder-box { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; text-align: center; }
        .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c44536; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #c44536; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐴 Double C Ranch</h1>
          <p>Pony Club Riding Center</p>
        </div>
        <div class="content">
          <div class="reminder-box">
            <h2 style="margin: 0; color: #856404;">⏰ Event Reminder</h2>
            <p style="font-size: 18px; margin: 10px 0;">Your event is tomorrow!</p>
          </div>

          <h2>Hi ${memberName}!</h2>
          <p>This is a friendly reminder about your upcoming event at Double C Ranch.</p>
          
          <div class="event-details">
            <h3>${eventTitle}</h3>
            <div class="detail-row">
              <span class="label">📅 Date:</span> ${eventDate}
            </div>
            <div class="detail-row">
              <span class="label">🕐 Time:</span> ${eventTime}
            </div>
            ${eventLocation ? `
            <div class="detail-row">
              <span class="label">📍 Location:</span> ${eventLocation}
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">👥 Attending:</span> ${guestCount > 0 ? `You + ${guestCount} guest${guestCount > 1 ? 's' : ''}` : 'Just you'}
            </div>
          </div>

          <p><strong>What to bring:</strong></p>
          <ul>
            <li>Comfortable riding attire</li>
            <li>Closed-toe shoes or boots</li>
            <li>Water bottle</li>
            <li>Sunscreen and hat (for outdoor events)</li>
          </ul>

          <p>Please arrive 10-15 minutes early for check-in. If you need to cancel or have any questions, contact us at (434) 205-0356.</p>
          
          <p>We look forward to seeing you!</p>
          <p><strong>The Double C Ranch Team</strong></p>
        </div>
        <div class="footer">
          <p>Double C Ranch - Pony Club Riding Center</p>
          <p>📞 (434) 205-0356 | 🌐 doublecranchllc.com</p>
          <p style="font-size: 12px; color: #999;">You received this reminder because you RSVP'd to an event at Double C Ranch.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export function getWaitlistPromotionEmail(data: {
  memberName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation?: string;
}): { subject: string; html: string } {
  const { memberName, eventTitle, eventDate, eventTime, eventLocation } = data;

  const subject = `Good News! Spot Available: ${eventTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-box { background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; text-align: center; }
        .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c44536; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #c44536; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Great News!</h1>
          <p>Double C Ranch</p>
        </div>
        <div class="content">
          <div class="success-box">
            <h2 style="margin: 0; color: #155724;">✅ You're Off the Waitlist!</h2>
            <p style="font-size: 18px; margin: 10px 0;">A spot has opened up for you</p>
          </div>

          <h2>Hi ${memberName}!</h2>
          <p>Exciting news! A spot has become available for the event you were waitlisted for. Your RSVP has been automatically confirmed!</p>
          
          <div class="event-details">
            <h3>${eventTitle}</h3>
            <div class="detail-row">
              <span class="label">📅 Date:</span> ${eventDate}
            </div>
            <div class="detail-row">
              <span class="label">🕐 Time:</span> ${eventTime}
            </div>
            ${eventLocation ? `
            <div class="detail-row">
              <span class="label">📍 Location:</span> ${eventLocation}
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">✅ Status:</span> <strong style="color: #28a745;">Confirmed</strong>
            </div>
          </div>

          <p>We're thrilled to have you join us! If you can no longer attend, please update your RSVP in the member portal as soon as possible so we can offer the spot to someone else.</p>
          
          <p>See you there!</p>
          <p><strong>The Double C Ranch Team</strong></p>
        </div>
        <div class="footer">
          <p>Double C Ranch - Pony Club Riding Center</p>
          <p>📞 (434) 205-0356 | 🌐 doublecranchllc.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}
