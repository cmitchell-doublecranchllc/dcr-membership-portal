import axios from "axios";

const KLAVIYO_API_BASE = "https://a.klaviyo.com/api";

interface KlaviyoSMSParams {
  phoneNumber: string; // Phone number in E.164 format (+1234567890)
  message: string;
}

/**
 * Send SMS via Klaviyo API
 */
export async function sendKlaviyoSMS(params: KlaviyoSMSParams): Promise<boolean> {
  try {
    const apiKey = process.env.KLAVIYO_API_KEY;
    const fromNumber = process.env.KLAVIYO_SMS_FROM;

    if (!apiKey || !fromNumber) {
      console.error("[Klaviyo] Missing API credentials");
      return false;
    }

    // Klaviyo SMS API endpoint
    const response = await axios.post(
      `${KLAVIYO_API_BASE}/messages`,
      {
        data: {
          type: "message",
          attributes: {
            channel: "sms",
            phone_number: params.phoneNumber,
            body: params.message,
            from_phone_number: fromNumber,
          },
        },
      },
      {
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`,
          "Content-Type": "application/json",
          revision: "2024-10-15",
        },
        timeout: 10000,
      }
    );

    console.log("[Klaviyo] SMS sent successfully:", response.data);
    return true;
  } catch (error: any) {
    console.error("[Klaviyo] Failed to send SMS:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Validate Klaviyo API credentials by making a test API call
 */
export async function validateKlaviyoCredentials(): Promise<boolean> {
  try {
    const apiKey = process.env.KLAVIYO_API_KEY;

    if (!apiKey) {
      return false;
    }

    // Test credentials by fetching account info
    const response = await axios.get(`${KLAVIYO_API_BASE}/accounts`, {
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: "2024-10-15",
      },
      timeout: 10000,
    });

    return response.status === 200;
  } catch (error: any) {
    console.error("[Klaviyo] Credential validation failed:", error.response?.data || error.message);
    return false;
  }
}
