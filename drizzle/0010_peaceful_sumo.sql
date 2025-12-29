ALTER TABLE `members` ADD `horseManagementLevel` enum('d1','d2','d3','c1','c2','c3','hb','ha');--> statement-breakpoint
ALTER TABLE `members` ADD `ridingCertifications` text;--> statement-breakpoint
ALTER TABLE `members` ADD `otherCertifications` text;--> statement-breakpoint
ALTER TABLE `members` DROP COLUMN `ridingExperienceLevel`;--> statement-breakpoint
ALTER TABLE `members` DROP COLUMN `certifications`;