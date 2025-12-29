CREATE TABLE `eventRsvps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`memberId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('attending','not_attending','maybe','waitlist') NOT NULL DEFAULT 'attending',
	`guestCount` int NOT NULL DEFAULT 0,
	`notes` text,
	`rsvpedAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eventRsvps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`eventType` enum('competition','show','clinic','social','other') NOT NULL DEFAULT 'other',
	`location` varchar(255),
	`startTime` bigint NOT NULL,
	`endTime` bigint NOT NULL,
	`capacity` int,
	`requiresRsvp` boolean NOT NULL DEFAULT true,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
