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
CREATE TABLE `lessonBookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slotId` int NOT NULL,
	`memberId` int NOT NULL,
	`bookedBy` int NOT NULL,
	`status` enum('confirmed','cancelled','rescheduled','completed') NOT NULL DEFAULT 'confirmed',
	`rescheduledFromSlotId` int,
	`rescheduledToSlotId` int,
	`rescheduleCount` int NOT NULL DEFAULT 0,
	`notes` text,
	`bookedAt` bigint NOT NULL,
	`cancelledAt` bigint,
	`attendanceStatus` enum('pending','present','absent','late') NOT NULL DEFAULT 'pending',
	`attendanceMarkedBy` int,
	`attendanceMarkedAt` bigint,
	`attendanceNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessonBookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lessonSlots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`startTime` bigint NOT NULL,
	`endTime` bigint NOT NULL,
	`lessonType` enum('private','group','horsemanship') NOT NULL,
	`maxStudents` int NOT NULL DEFAULT 1,
	`currentStudents` int NOT NULL DEFAULT 0,
	`instructorName` varchar(255),
	`location` varchar(255),
	`notes` text,
	`isRecurring` boolean NOT NULL DEFAULT false,
	`recurringSeriesId` int,
	`googleCalendarEventId` varchar(255),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessonSlots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `recurring_event_series` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`eventType` enum('competition','show','clinic','social','riding_lesson','horsemanship_lesson','other') NOT NULL DEFAULT 'other',
	`location` varchar(255),
	`capacity` int,
	`requiresRsvp` boolean NOT NULL DEFAULT false,
	`recurrencePattern` enum('daily','weekly','biweekly','monthly') NOT NULL,
	`daysOfWeek` varchar(50),
	`startTimeOfDay` varchar(8) NOT NULL,
	`durationMinutes` int NOT NULL,
	`seriesStartDate` bigint NOT NULL,
	`seriesEndDate` bigint,
	`maxOccurrences` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `recurring_event_series_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `eventType` enum('competition','show','clinic','social','riding_lesson','horsemanship_lesson','other') NOT NULL DEFAULT 'other';--> statement-breakpoint
ALTER TABLE `events` ADD `recurringSeriesId` int;--> statement-breakpoint
ALTER TABLE `events` ADD `recurrenceException` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD `horseManagementLevel` enum('d1','d2','d3','c1','c2','c3','hb','ha');--> statement-breakpoint
ALTER TABLE `members` ADD `ridingCertifications` text;--> statement-breakpoint
ALTER TABLE `members` ADD `otherCertifications` text;--> statement-breakpoint
ALTER TABLE `members` ADD `ridingGoals` text;--> statement-breakpoint
ALTER TABLE `members` ADD `medicalNotes` text;--> statement-breakpoint
ALTER TABLE `users` ADD `accountStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `profilePhotoUrl` text;