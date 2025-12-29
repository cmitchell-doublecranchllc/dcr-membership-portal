CREATE TABLE `progressNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`lessonBookingId` int,
	`createdBy` int NOT NULL,
	`noteDate` bigint NOT NULL,
	`category` enum('skill_progress','behavior','achievement','goal','concern','general') NOT NULL DEFAULT 'general',
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`isVisibleToParent` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `progressNotes_id` PRIMARY KEY(`id`)
);
