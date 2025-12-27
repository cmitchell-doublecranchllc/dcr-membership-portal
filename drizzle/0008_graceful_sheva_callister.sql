CREATE TABLE `horses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`breed` varchar(255),
	`age` int,
	`color` varchar(100),
	`gender` enum('mare','gelding','stallion'),
	`height` varchar(50),
	`temperament` text,
	`specialNeeds` text,
	`vetInfo` text,
	`photoUrl` text,
	`isBoarded` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `horses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `members` ADD `ridingExperienceLevel` enum('beginner','intermediate','advanced','expert');--> statement-breakpoint
ALTER TABLE `members` ADD `certifications` text;--> statement-breakpoint
ALTER TABLE `members` ADD `ridingGoals` text;--> statement-breakpoint
ALTER TABLE `members` ADD `medicalNotes` text;--> statement-breakpoint
ALTER TABLE `users` ADD `profilePhotoUrl` text;