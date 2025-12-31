# Pony Club Portal TODO

## QR Code Check-In & Progress Tracking System

### Completed Features ✅
- [x] Database schema with QR codes, goals, and check-ins
- [x] QR code generation and unique constraint
- [x] Staff QR scanner page (camera-based)
- [x] QR code generator/printer page
- [x] Student goals management
- [x] Student progress dashboard
- [x] Attendance tracking and stats
- [x] Duplicate check-in protection (15 minute window)
- [x] Enhanced check-ins table with operational fields
- [x] Goal progress audit trail (previousProgress, newProgress, progressChange)
- [x] Database performance indexes

### Technical Improvements Completed ✅
- [x] QR code unique constraint (allows NULL)
- [x] Check-ins table: checkInType, source, program, appointmentId fields
- [x] Goals progress updates: audit trail fields
- [x] Database indexes: checkIns(memberId, checkInTime), studentGoals(memberId, status), goalProgressUpdates(goalId, updateDate)
- [x] Duplicate check-in protection in both student and staff flows

### Pending Items
- [ ] Test QR code generation and printing
- [ ] Test QR code scanning workflow
- [ ] Test goals creation and progress updates
- [ ] Test student dashboard displays
- [ ] Fix TypeScript memory issues (exit code 134)
- [ ] Document QR code system for staff training

## Acuity Integration
- [x] Remove Calendly integration
- [x] Embed Acuity scheduling page
- [x] Remove "My Lessons" page (Acuity handles scheduling)
- [x] Add rescheduling instructions card
- [x] Remove cancellation text from instructions

## System Status
- Portal focuses on: documents, progress notes, messages, events, profiles, QR check-in, goals
- Acuity handles: lesson booking, rescheduling, SMS reminders
- Database: MySQL/TiDB with proper indexes and constraints

## Verification & Testing (Priority)
- [ ] Fix TypeScript build errors (exit code 134)
- [ ] Achieve clean dev server start with zero errors
- [ ] Document all QR system page routes and click paths
- [ ] Test: Generate QR code for test student
- [ ] Test: Scan QR code as staff
- [ ] Test: Verify check-in record creation
- [ ] Test: View attendance on student dashboard
- [ ] Test: Create goal → update progress → view history
- [ ] Confirm QR code uniqueness at database level
- [ ] Confirm duplicate check-in prevention works
- [ ] Confirm performance indexes are active
- [ ] Create end-to-end testing guide for user

## New User Request - Staff Tools Section
- [x] Add "Staff Tools" section to Staff Dashboard with prominent buttons
- [x] QR Scanner button (links to /staff/qr-scanner)
- [x] QR Generator button (links to /staff/qr-generator)
- [x] Attendance Log button (links to /staff/attendance)

## Critical: TypeScript Zero Errors Requirement
- [x] Fix all 48 TypeScript errors
- [x] Achieve exit code 0 on `pnpm check`
- [x] Ensure deployable, stable build

## SEO Improvements for Homepage
- [x] Add meta description (50-160 characters)
- [x] Add meta keywords
- [x] Add H2 headings to homepage content
- [x] Verify SEO improvements

## Shareable Link Preview Customization
- [x] Add Open Graph meta tags for social media sharing
- [x] Set custom preview image (Double C Ranch + German flag + Pony Club logos)
- [x] Customize title and description for link previews
- [x] Test link preview on social media platforms

## Favicon and Social Media Links
- [x] Create favicon from branding image (16x16, 32x32, 180x180)
- [x] Add favicon to index.html
- [x] Add social media links to footer (Facebook, Instagram)
- [x] Test favicon display in browser tabs
- [x] Verify social links work correctly
