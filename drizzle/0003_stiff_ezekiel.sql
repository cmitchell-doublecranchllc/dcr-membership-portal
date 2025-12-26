CREATE TABLE `recurring_event_series` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`eventType` enum('competition','show','clinic','social','other') NOT NULL DEFAULT 'other',
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
ALTER TABLE `events` ADD `recurringSeriesId` int;--> statement-breakpoint
ALTER TABLE `events` ADD `recurrenceException` boolean DEFAULT false NOT NULL;