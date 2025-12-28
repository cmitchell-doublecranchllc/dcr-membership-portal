import { describe, it, expect } from 'vitest';
import twilio from 'twilio';

describe('Twilio Integration', () => {
  it('should validate Twilio credentials and connect successfully', async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    expect(accountSid).toBeDefined();
    expect(authToken).toBeDefined();
    expect(phoneNumber).toBeDefined();

    // Create Twilio client
    const client = twilio(accountSid, authToken);

    // Test connection by fetching account details
    const account = await client.api.v2010.accounts(accountSid).fetch();
    
    expect(account.sid).toBe(accountSid);
    expect(account.status).toBe('active');
    
    console.log('✅ Twilio credentials validated successfully');
    console.log(`Account SID: ${account.sid}`);
    console.log(`Account Status: ${account.status}`);
    console.log(`Phone Number: ${phoneNumber}`);
  });

  it('should verify phone number is valid', async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    const client = twilio(accountSid, authToken);

    // Verify the phone number exists in the account
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({ limit: 100 });
    
    const foundNumber = incomingPhoneNumbers.find(num => num.phoneNumber === phoneNumber);
    
    expect(foundNumber).toBeDefined();
    expect(foundNumber?.capabilities.sms).toBe(true);
    expect(foundNumber?.capabilities.voice).toBe(true);
    
    console.log('✅ Phone number verified with SMS and Voice capabilities');
  });
});
