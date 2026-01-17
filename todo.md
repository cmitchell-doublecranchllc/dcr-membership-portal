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

## Bug: Check-In Button Failing
- [x] Investigate check-in button error on homepage
- [x] Fix check-in mutation/API endpoint
- [ ] Test check-in button successfully creates record
- [ ] Verify check-in appears in attendance log

## Bug: QR Code System Not Working End-to-End
- [x] Change QR codes to encode portal URLs (https://memberdoubleranchllc.com/qr/<token>)
- [x] Create /qr/<token> route that auto-checks in members
- [x] Fix manual CHECK IN button (currently returns 404)
- [ ] Test: Generate QR → Scan with phone → Check-in created
- [ ] Verify check-in appears in Staff Attendance Log
- [ ] Verify check-in appears in Student My Progress page

## Check-In Verification Workflow (Critical)
- [x] Update checkIns schema: add status (pending/approved/rejected), verifiedBy, verifiedAt fields
- [x] Complete database migration (pnpm db:push)
- [x] Remove QR code generation and scanning features (no longer needed)
- [x] Update checkIn endpoint to create pending check-ins for students
- [x] Create Pending Check-Ins view for staff (/staff/pending-checkins)
- [x] Add approve/reject actions in Pending Check-Ins view
- [x] Rewrite Staff Attendance Log to show check-in records (not lesson bookings)
- [x] Staff Attendance Log must show: status badges, timestamps, student name, verifiedBy/verifiedAt
- [x] Add check-in history section to My Progress showing all check-ins with status
- [x] Update My Progress stats to count ONLY approved check-ins (pending/rejected don't count)
- [x] Ensure check-ins are immediately visible to students after submission (pending status)
- [x] Fix CHECK IN button 404 error
- [x] Add on-site confirmation prompt to CHECK IN button
- [ ] Fix all TypeScript errors to achieve exit code 0 (REQUIRED)
- [ ] Test end-to-end: student check-in → pending → staff approve → attendance visible

## User Management
- [x] Add User Management page to Staff Dashboard
- [x] List all users with name, email, role, account status
- [x] Add delete button for each user
- [x] Backend endpoint to delete user and all related data
- [x] Confirmation dialog before deletion
- [x] Add delete button to Student Profiles page (/staff/students)

- [ ] Fix student profile edit - certification level changes not saving

## Bug Fix - Student Profile Edit Not Saving
- [ ] Remove broken edit dialog from InstructorStudents page
- [ ] Rebuild edit functionality with proper mutation calls
- [ ] Test that certification level changes save correctly
- [ ] Verify changes persist in database and show in View Details

## Remove Student Profile Edit Feature
- [x] Remove Edit button from Student Riding Profiles page
- [x] Remove edit dialog and all edit-related state/functions
- [x] Keep only View Details functionality
- [x] Keep Delete button for user management

## Rebuild Student Profile Edit - Multiple Methods
- [x] Create dedicated edit page at /staff/students/:id/edit
- [x] Add inline editing capability in View Details dialog
- [x] Add Edit Mode toggle in View Details dialog
- [x] Implement working save functionality with proper backend calls
- [x] Test all three editing methods work correctly

## Remove View Details Dialog - Use Only Edit Page
- [x] Remove View Details button from table
- [x] Remove View Details dialog component
- [x] Keep only Edit button that goes to /staff/students/:id/edit page
- [x] Remove all dialog-related state and functions

## Migrate from MySQL to PostgreSQL
- [x] Update Drizzle config to use PostgreSQL
- [x] Update schema to use PostgreSQL data types
- [x] Install PostgreSQL driver dependencies
- [x] Update database connection
- [ ] Test database operations (requires PostgreSQL DATABASE_URL)

## Fix PostgreSQL Schema Syntax Errors
- [ ] Identify syntax errors in drizzle/schema.ts causing db:push to fail
- [ ] Fix enum declarations and table definitions
- [ ] Test db:push locally
- [ ] Push fix to GitHub

## Remove Lesson Reminders Feature
- [x] Find lesson reminder scheduler code
- [x] Remove lesson reminder initialization
- [x] Remove lesson reminder dependencies
- [x] Push changes to GitHub

## Make OAuth Optional
- [x] Update OAuth initialization to check for required env vars
- [x] Make OAuth routes conditional
- [x] Handle missing OAuth config gracefully
- [x] Push changes to GitHub

## Fix Analytics Environment Variable Handling
- [x] Update analytics.ts to properly handle undefined env vars
- [x] Add explicit checks to prevent Invalid URL errors
- [x] Test that analytics gracefully skips when not configured
- [x] Push fix to GitHub

## Clean Up index.html
- [x] Remove commented Google Fonts block
- [x] Update to cleaner version without comment blocks
- [x] Push changes to GitHub

## Investigate Persistent Invalid URL Error on Render
- [x] Check if Render has actually deployed the latest commit (cc927c3)
- [x] Investigate Vite environment variable replacement during build
- [x] Test build locally without analytics env vars set
- [x] Consider alternative approach: completely remove analytics initialization
- [ ] Verify fix works in production on Render

## Fix OAuth URL Construction (Root Cause of Invalid URL Error)
- [x] Update useAuth.ts to use lazy evaluation for getLoginUrl()
- [x] Update const.ts to add guard for missing env vars
- [x] Test build locally
- [x] Push fix to GitHub

## Build Custom Authentication System
- [ ] Update users table schema to add password field
- [ ] Install bcrypt for password hashing
- [ ] Create backend login endpoint (email/password)
- [ ] Create backend registration endpoint
- [ ] Create /login page with login form
- [ ] Create /register page with registration form
- [ ] Update session management to use JWT
- [ ] Test login and registration flows
- [ ] Push to GitHub and deploy
