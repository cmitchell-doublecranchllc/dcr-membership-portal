import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('[Twilio] Missing credentials - SMS functionality disabled');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Send SMS message via Twilio
 */
export async function sendSMS(params: {
  to: string;
  message: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!client || !twilioPhoneNumber) {
    console.error('[Twilio] SMS sending disabled - missing credentials');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    // Ensure phone number is in E.164 format
    const toNumber = params.to.startsWith('+') ? params.to : `+1${params.to.replace(/\D/g, '')}`;
    
    const message = await client.messages.create({
      body: params.message,
      from: twilioPhoneNumber,
      to: toNumber,
    });

    console.log(`[Twilio] SMS sent successfully to ${toNumber} (SID: ${message.sid})`);
    
    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error: any) {
    console.error('[Twilio] Failed to send SMS:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send lesson reminder SMS
 */
export async function sendLessonReminderSMS(params: {
  studentName: string;
  studentPhone: string;
  lessonDate: Date;
  lessonType: string;
  instructor?: string;
  location?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { studentName, studentPhone, lessonDate, lessonType, instructor, location } = params;

  const dateStr = lessonDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  
  const timeStr = lessonDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  let message = `Hi ${studentName}! Reminder: You have a ${lessonType} lesson tomorrow (${dateStr}) at ${timeStr}.`;
  
  if (instructor) {
    message += ` Instructor: ${instructor}.`;
  }
  
  if (location) {
    message += ` Location: ${location}.`;
  }
  
  message += ` See you there! - Double C Ranch`;

  return sendSMS({
    to: studentPhone,
    message,
  });
}

/**
 * Send contract reminder SMS
 */
export async function sendContractReminderSMS(params: {
  memberName: string;
  memberPhone: string;
  contractName: string;
  dueDate: Date;
}): Promise<{ success: boolean; error?: string }> {
  const { memberName, memberPhone, contractName, dueDate } = params;

  const dateStr = dueDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  const message = `Hi ${memberName}! Reminder: Your ${contractName} is due by ${dateStr}. Please sign it in your portal at memberdoublecranchllc.com. - Double C Ranch`;

  return sendSMS({
    to: memberPhone,
    message,
  });
}

/**
 * Send lesson booking confirmation SMS
 */
export async function sendLessonBookingConfirmationSMS(params: {
  studentName: string;
  studentPhone: string;
  lessonDate: Date;
  lessonType: string;
}): Promise<{ success: boolean; error?: string }> {
  const { studentName, studentPhone, lessonDate, lessonType } = params;

  const dateStr = lessonDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  
  const timeStr = lessonDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const message = `Hi ${studentName}! Your ${lessonType} lesson is confirmed for ${dateStr} at ${timeStr}. We'll send a reminder 24 hours before. - Double C Ranch`;

  return sendSMS({
    to: studentPhone,
    message,
  });
}
