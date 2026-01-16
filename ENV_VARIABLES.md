# Environment Variables

This document lists all environment variables required to run the Pony Club Membership Portal.

## Required Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)

### Authentication & Session
- `JWT_SECRET` - Secret key for signing session cookies
- `VITE_APP_ID` - Manus OAuth application ID
- `OAUTH_SERVER_URL` - Manus OAuth backend URL (default: `https://api.manus.im`)
- `VITE_OAUTH_PORTAL_URL` - Manus login portal URL (default: `https://login.manus.im`)

### Owner Information
- `OWNER_OPEN_ID` - Owner's OpenID for admin access
- `OWNER_NAME` - Owner's display name

### Manus Built-in Services
- `BUILT_IN_FORGE_API_URL` - Manus API base URL for server-side calls
- `BUILT_IN_FORGE_API_KEY` - Server-side API key for Manus services
- `VITE_FRONTEND_FORGE_API_KEY` - Frontend API key for Manus services
- `VITE_FRONTEND_FORGE_API_URL` - Manus API base URL for frontend calls

### App Branding
- `VITE_APP_TITLE` - Application title displayed in browser
- `VITE_APP_LOGO` - Path to logo file (e.g., `/logo.png`)

## Optional Variables

### Analytics
- `VITE_ANALYTICS_ENDPOINT` - Analytics service endpoint
- `VITE_ANALYTICS_WEBSITE_ID` - Website ID for analytics tracking

### Email Services
- `GMAIL_USER` - Gmail address for sending emails
- `GMAIL_APP_PASSWORD` - Gmail app-specific password

### SMS Services
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_PHONE_NUMBER` - Twilio phone number (format: `+1234567890`)

### Calendar Integration
- `GOOGLE_CALENDAR_ID` - Google Calendar ID
- `GOOGLE_CALENDAR_CREDENTIALS` - Google service account credentials (JSON)

### Phone Services
- `AIRCALL_API_ID` - Aircall API ID
- `AIRCALL_API_TOKEN` - Aircall API token
- `AIRCALL_PHONE_NUMBER` - Aircall phone number

### Marketing
- `KLAVIYO_API_KEY` - Klaviyo API key for email/SMS marketing
- `KLAVIYO_SMS_FROM` - Klaviyo SMS sender number

### System
- `NODE_ENV` - Node environment (`development` or `production`)

## Notes

- **On Manus hosting**: All variables are automatically injected - no manual configuration needed
- **For external hosting** (Render, Railway, etc.): You must manually configure all required variables
- **Secrets management**: Never commit actual values to git. Use your hosting provider's secrets/environment variables feature
- **Database**: Requires MySQL 5.7+ or TiDB compatible database
