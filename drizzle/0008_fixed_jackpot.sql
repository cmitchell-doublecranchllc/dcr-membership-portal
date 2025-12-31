ALTER TABLE `checkIns` ADD `checkInType` enum('lesson','event','other') DEFAULT 'lesson' NOT NULL;--> statement-breakpoint
ALTER TABLE `checkIns` ADD `source` enum('staff_scanner','student_self','manual_entry','qr_self') DEFAULT 'staff_scanner' NOT NULL;--> statement-breakpoint
ALTER TABLE `checkIns` ADD `program` enum('lesson','horse_management','camp','pony_club','event','other') DEFAULT 'lesson' NOT NULL;--> statement-breakpoint
ALTER TABLE `checkIns` ADD `status` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `checkIns` ADD `verifiedBy` int;--> statement-breakpoint
ALTER TABLE `checkIns` ADD `verifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `checkIns` ADD `appointmentId` varchar(128);--> statement-breakpoint
ALTER TABLE `checkIns` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `goalProgressUpdates` ADD `previousProgress` int NOT NULL;--> statement-breakpoint
ALTER TABLE `goalProgressUpdates` ADD `newProgress` int NOT NULL;--> statement-breakpoint
ALTER TABLE `goalProgressUpdates` ADD `progressChange` int NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_qrCode_unique` UNIQUE(`qrCode`);--> statement-breakpoint
CREATE INDEX `idx_checkins_member_time` ON `checkIns` (`memberId`,`checkInTime`);--> statement-breakpoint
CREATE INDEX `idx_members_qrcode` ON `checkIns` (`memberId`);--> statement-breakpoint
CREATE INDEX `idx_progress_goal_date` ON `goalProgressUpdates` (`goalId`,`updateDate`);--> statement-breakpoint
CREATE INDEX `idx_goals_member_status` ON `studentGoals` (`memberId`,`status`);--> statement-breakpoint
ALTER TABLE `goalProgressUpdates` DROP COLUMN `progressPercentage`;