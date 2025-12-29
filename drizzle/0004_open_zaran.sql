DROP TABLE `announcements`;--> statement-breakpoint
DROP TABLE `appointments`;--> statement-breakpoint
DROP TABLE `checkIns`;--> statement-breakpoint
DROP TABLE `contractAssignments`;--> statement-breakpoint
DROP TABLE `contractSignatures`;--> statement-breakpoint
DROP TABLE `contracts`;--> statement-breakpoint
DROP TABLE `eventRsvps`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
DROP TABLE `horses`;--> statement-breakpoint
DROP TABLE `lessonBookings`;--> statement-breakpoint
DROP TABLE `lessonSlots`;--> statement-breakpoint
DROP TABLE `members`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
DROP TABLE `progressNotes`;--> statement-breakpoint
DROP TABLE `recurring_event_series`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `accountStatus`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `profilePhotoUrl`;