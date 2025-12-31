CREATE TABLE `goalProgressUpdates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`updatedBy` int NOT NULL,
	`progressPercentage` int NOT NULL,
	`notes` text,
	`updateDate` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `goalProgressUpdates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`goalTitle` varchar(255) NOT NULL,
	`goalDescription` text,
	`category` enum('riding_skill','horse_care','competition','certification','other') NOT NULL DEFAULT 'riding_skill',
	`targetDate` timestamp,
	`progressPercentage` int NOT NULL DEFAULT 0,
	`status` enum('active','completed','archived') NOT NULL DEFAULT 'active',
	`completedAt` bigint,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `members` ADD `qrCode` varchar(128);--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_qrCode_unique` UNIQUE(`qrCode`);