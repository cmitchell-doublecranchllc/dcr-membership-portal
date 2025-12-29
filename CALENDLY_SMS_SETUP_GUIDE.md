# Calendly SMS Notifications Setup Guide

## Overview

With your paid Calendly subscription (Standard, Teams, or Enterprise), you can now send automated SMS text message reminders to your lesson participants. This guide will walk you through setting up SMS notifications for your riding lesson bookings.

## Important Information

### SMS Provider
- **Calendly uses Twilio** as the SMS provider
- Messages come from **random U.S. phone numbers**
- Messages are **not monitored** and cannot receive replies
- **180 character limit** per message

### Requirements
- **Paid Calendly plan** (Standard, Teams, or Enterprise)
- **Cannot use SMS during trial period**
- SMS only available for **Group events with 100 or fewer invitees**
- Phone number field **cannot be required** (GDPR compliance - invitees must opt-in)

### Supported Countries
- SMS works in most countries
- **Not supported**: Singapore, Russia, Iran
- Some international carriers may block messages

---

## Step-by-Step Setup Instructions

### Step 1: Access Calendly Workflows

1. Log in to your **Calendly account** at https://calendly.com
2. Navigate to your **Event Types** page
3. Select the **lesson event type** you want to add SMS reminders to (e.g., "Private Riding Lesson", "Group Riding Lesson")
4. Scroll down and click **"Workflows"** in the event editor

### Step 2: Create SMS Workflow

1. Click **"Add Workflow"** or **"New Workflow"**
2. Choose when to send the SMS:
   - **Before the event**: Send reminder X hours/days before lesson
   - **After booking**: Send confirmation immediately after booking
   - **After the event**: Send follow-up message after lesson

### Step 3: Configure SMS Settings

1. Select **"Text message (SMS)"** as the notification type
2. Choose the recipient:
   - **Invitee** (your lesson participants)
   - **Host** (yourself/staff)
3. Set the timing:
   - **Recommended timings**:
     - 24 hours before lesson
     - 1 hour before lesson
     - Immediately after booking (confirmation)

### Step 4: Compose Your Message

**Character Limit**: 180 characters maximum

**Sample Messages**:

**Booking Confirmation (immediately after booking)**:
```
Thanks for booking your riding lesson at Pony Club! Date: {{event_start_date}} at {{event_start_time}}. Location: Main Arena. See you soon!
```

**24-Hour Reminder**:
```
Reminder: Your riding lesson is tomorrow at {{event_start_time}}. Please arrive 10 minutes early. Questions? Call us at [YOUR PHONE].
```

**1-Hour Reminder**:
```
Your lesson at Pony Club starts in 1 hour ({{event_start_time}}). See you at Main Arena!
```

### Step 5: Add Reschedule/Cancel Links (Optional)

To allow participants to reschedule or cancel via SMS:

**Reschedule link**:
```
https://calendly.com/reschedulings/{{invitee_uuid}}
```

**Cancel link**:
```
https://calendly.com/cancellations/{{invitee_uuid}}
```

**Example message with links**:
```
Lesson tomorrow at {{event_start_time}}. Reschedule: https://calendly.com/reschedulings/{{invitee_uuid}}
```

### Step 6: Add Phone Number Field to Booking Form

1. In your event type editor, go to **"Booking Questions"**
2. Click **"Add Question"**
3. Select **"Phone Number"** field
4. **Important**: You cannot make this field required (GDPR compliance)
5. Add helpful text: "Enter your phone number to receive SMS reminders (optional)"

### Step 7: Test Your SMS Workflow

1. Save your workflow
2. Book a test lesson using your own phone number
3. Verify you receive the SMS at the scheduled time
4. Check message formatting and links

---

## Recommended SMS Workflow Setup

### For Each Lesson Type (Private, Group, etc.)

**Workflow 1: Booking Confirmation**
- **Trigger**: Immediately after booking
- **Message**: "Thanks for booking! Your riding lesson is {{event_start_date}} at {{event_start_time}}. Location: Main Arena. See you there!"

**Workflow 2: 24-Hour Reminder**
- **Trigger**: 24 hours before event
- **Message**: "Reminder: Lesson tomorrow at {{event_start_time}}. Arrive 10 min early. Weather updates at [YOUR WEBSITE]."

**Workflow 3: 1-Hour Reminder**
- **Trigger**: 1 hour before event  
- **Message**: "Your lesson starts in 1 hour at Main Arena. See you soon!"

---

## SMS Credit Limits

Calendly limits how many SMS messages your organization can send to maintain quality and prevent abuse.

- Check your current SMS credit limit in **Account Settings → SMS Credits**
- If you exceed limits, contact Calendly support to increase

---

## Compliance & Best Practices

### Legal Requirements
- **GDPR Compliance**: Phone number must be optional (cannot be required)
- **Opt-in required**: Invitees must consent to receive SMS
- **Opt-out available**: Recipients can stop messages anytime

### Content Restrictions
**Do NOT send SMS about**:
- Cannabis
- Gambling  
- Firearms
- Other restricted topics per Twilio's Acceptable Use Policy

**Violation will result in SMS feature being disabled**

### Best Practices
1. **Keep messages under 180 characters**
2. **Don't use URL shorteners** (bit.ly, etc.) - carriers may block them
3. **Use full URLs** for better delivery
4. **Be clear and concise**
5. **Include your business name** in every message
6. **Test with multiple carriers** (AT&T, Verizon, T-Mobile, etc.)

---

## Troubleshooting

### SMS Not Sending
- ✓ Verify you're on a **paid plan** (not trial)
- ✓ Check **SMS credit limit** hasn't been exceeded
- ✓ Confirm invitee entered a **valid phone number**
- ✓ Verify invitee's country is **supported**
- ✓ Check workflow is **enabled** and **saved**

### Messages Being Blocked
- Remove URL shorteners (use full URLs)
- Check message content for restricted topics
- Test with different phone carriers
- Verify phone number format is correct

### Invitees Not Receiving SMS
- Confirm they entered phone number during booking
- Check their carrier doesn't block automated SMS
- Verify their country is supported
- Ask them to check spam/blocked messages

---

## Alternative: Using Your Portal's Built-in SMS (Future Enhancement)

Your Pony Club Portal currently has **Twilio** and **Klaviyo SMS** integration capabilities. If you'd like more control over SMS messaging (custom phone numbers, two-way messaging, etc.), we can set up SMS directly in your portal instead of using Calendly's SMS feature.

**Benefits of Portal SMS**:
- Use your own phone number
- Two-way messaging support
- More customization options
- Integration with lesson management system
- No per-message limits from Calendly

Let me know if you'd like to explore this option!

---

## Quick Reference: Calendly Variables

Use these variables in your SMS messages:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{event_name}}` | Name of event type | "Private Riding Lesson" |
| `{{event_start_date}}` | Date of event | "Dec 29, 2025" |
| `{{event_start_time}}` | Start time | "8:00 PM" |
| `{{event_end_time}}` | End time | "9:00 PM" |
| `{{invitee_name}}` | Participant name | "John Smith" |
| `{{invitee_email}}` | Participant email | "john@example.com" |
| `{{invitee_uuid}}` | Unique ID for links | (for reschedule/cancel) |
| `{{location}}` | Event location | "Main Arena" |

---

## Next Steps

1. **Log in to Calendly** and navigate to your lesson event types
2. **Add SMS workflows** for booking confirmations and reminders
3. **Add phone number field** to your booking questions
4. **Test with your own phone number** before going live
5. **Monitor SMS credits** and delivery rates

---

## Support Resources

- **Calendly SMS Documentation**: https://help.calendly.com/hc/en-us/articles/1500000432021
- **Calendly Workflows**: Access via your event type editor
- **SMS Credit Limits**: https://help.calendly.com/hc/en-us/articles/17693718960535
- **Twilio Messaging Policy**: https://www.twilio.com/legal/aup

---

## Questions?

If you need help setting this up or want to explore using your portal's built-in SMS capabilities instead, just let me know!
