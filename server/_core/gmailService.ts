import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize Gmail transporter
 */
function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn('[Gmail] Credentials not configured');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  console.log('[Gmail] Transporter initialized');
  return transporter;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

/**
 * Send an email via Gmail
 */
export async function sendGmailEmail(options: EmailOptions): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.warn('[Gmail] Skipping email send - transporter not initialized');
    return false;
  }

  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Double C Ranch LLC" <${GMAIL_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
      html: options.html,
    };

    if (options.attachments && options.attachments.length > 0) {
      mailOptions.attachments = options.attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      }));
    }

    const info = await transport.sendMail(mailOptions);
    console.log('[Gmail] Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Gmail] Failed to send email:', error);
    return false;
  }
}

/**
 * Verify Gmail connection
 */
export async function verifyGmailConnection(): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    return false;
  }

  try {
    await transport.verify();
    console.log('[Gmail] Connection verified successfully');
    return true;
  } catch (error) {
    console.error('[Gmail] Connection verification failed:', error);
    return false;
  }
}
