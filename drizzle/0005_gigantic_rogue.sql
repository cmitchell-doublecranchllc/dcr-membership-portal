ALTER TABLE `lessonBookings` ADD `attendanceStatus` enum('pending','present','absent','late') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `lessonBookings` ADD `attendanceMarkedBy` int;--> statement-breakpoint
ALTER TABLE `lessonBookings` ADD `attendanceMarkedAt` bigint;--> statement-breakpoint
ALTER TABLE `lessonBookings` ADD `attendanceNotes` text;