# Pony Club Riding Center Portal - TODO

## Phase 1: Database Schema & Structure
- [x] Design and implement database schema for members, check-ins, contracts, messages
- [x] Set up membership tier enum (Bronze, Silver, Gold)
- [x] Create tables for check-in logs, contract signatures, announcements

## Phase 2: Authentication & Member Profiles
- [x] Implement member login and authentication
- [x] Create member profile page with membership tier display
- [x] Add parent-child relationship management
- [x] Display membership status from Acuity

## Phase 3: Check-in System
- [x] Build big "CHECK IN" button on home screen
- [x] Implement check-in confirmation flow
- [x] Create staff dashboard with real-time check-in status
- [x] Add check-in timestamp logging
- [x] Display check-in history

## Phase 4: Contracts & E-Signatures
- [x] Integrate Google Docs API for contract templates
- [x] Display contracts to parents in portal
- [x] Implement electronic signature pad
- [x] Save signed PDFs to Google Drive
- [x] Allow parents to view all signed contracts
- [x] Create admin contract compliance dashboard
- [x] Send reminders for unsigned contracts

## Phase 5: Schedule & Calendar
- [x] Integrate Acuity Scheduling API
- [x] Display upcoming lessons and appointments
- [x] Sync with Google Calendar
- [x] Create simple calendar view
- [x] Add link to Acuity for booking management

## Phase 6: Communication System
- [x] Build messaging between parents and staff
- [x] Create announcement system for members
- [x] Integrate Gmail for email notifications
- [x] Add notification for lesson reminders
- [x] Add notification for contract alerts

## Phase 7: Testing & Polish
- [x] Test all features on mobile devices
- [x] Verify Google Workspace integrations
- [x] Test Acuity API integration
- [x] Ensure responsive design works properly
- [x] Create project checkpoint

## Phase 8: Deployment
- [x] Final review and testing
- [x] Create deployment checkpoint
- [x] Deliver to user with documentation

## Events & Competitions Feature
- [x] Add events and RSVPs tables to database schema
- [x] Create event management API endpoints
- [x] Build RSVP functionality with capacity limits
- [x] Create events listing page for members
- [x] Create event details page with RSVP button
- [x] Build admin event management interface
- [x] Add event type categories (competition, show, clinic, social)
- [x] Display member's RSVP status on dashboard
- [x] Test events and RSVP functionality
- [x] Create checkpoint with events feature

## Gmail Email Notifications for Events
- [x] Request Gmail API credentials from user
- [x] Create email template system for event notifications
- [x] Send RSVP confirmation email when member registers
- [x] Send reminder email 24 hours before event
- [x] Send waitlist notification emails
- [x] Add email notification preferences to member profile
- [x] Test email sending functionality
- [x] Create checkpoint with email notifications

## Recurring Events Feature
- [x] Add recurring event fields to database schema
- [x] Create recurring event series table
- [x] Implement event generation logic for daily/weekly/monthly patterns
- [x] Add UI for creating recurring events
- [x] Support editing single occurrence vs entire series
- [x] Support deleting single occurrence vs entire series
- [x] Test recurring event creation and management
- [x] Create checkpoint with recurring events feature
