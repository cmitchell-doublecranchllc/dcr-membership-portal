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
