# Pony Club Portal TODO

## QR Code Check-In & Progress Tracking System

### Database Schema
- [x] Add QR code field to members table
- [x] Create goals table (student goals with progress tracking)
- [x] Update check-ins table to support QR code scanning
- [x] Add achievements/milestones table (using goals with completed status)

### Backend API
- [x] Create tRPC endpoints for QR code generation
- [x] Create tRPC endpoints for QR code scanning
- [x] Create tRPC endpoints for goals management
- [x] Create tRPC endpoints for progress tracking
- [x] Create tRPC endpoints for attendance statistics

### Frontend Pages
- [x] Build staff QR scanner page (camera-based)
- [x] Build QR code generator page (printable cards)
- [x] Build student goals management page
- [x] Build student dashboard (attendance stats + goals)
- [x] Add navigation links to new pages

### Testing
- [ ] Test QR code generation and printing
- [ ] Test QR code scanning and check-in
- [ ] Test goals creation and progress tracking
- [ ] Test student dashboard displays
- [ ] Print and laminate test QR codes

## Completed Features
- [x] Acuity scheduling integration
- [x] Remove Calendly integration
- [x] Rescheduling instructions card
- [x] Remove cancellation text
- [x] Fix check-in button visibility
- [x] Fix check-in validation
- [x] Delete button fix for lesson slots

