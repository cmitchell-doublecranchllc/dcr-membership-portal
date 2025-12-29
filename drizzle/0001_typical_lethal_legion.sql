CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`authorId` int NOT NULL,
	`targetTiers` text,
	`isPublished` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`acuityAppointmentId` varchar(128) NOT NULL,
	`appointmentType` varchar(255),
	`startTime` bigint NOT NULL,
	`endTime` bigint NOT NULL,
	`status` varchar(64),
	`notes` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checkIns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`checkedInBy` int NOT NULL,
	`checkInTime` bigint NOT NULL,
	`lessonDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checkIns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`memberId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`dueDate` timestamp,
	`isSigned` boolean NOT NULL DEFAULT false,
	`reminderSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractSignatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`memberId` int NOT NULL,
	`signedBy` int NOT NULL,
	`signatureData` text,
	`signedPdfUrl` text,
	`signedPdfKey` varchar(512),
	`googleDriveFileId` varchar(255),
	`signedAt` bigint NOT NULL,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contractSignatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`googleDocId` varchar(255),
	`googleDocUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`requiresSignature` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`membershipTier` enum('bronze','silver','gold') NOT NULL DEFAULT 'bronze',
	`acuityClientId` varchar(128),
	`phone` varchar(32),
	`emergencyContact` text,
	`parentId` int,
	`isChild` boolean NOT NULL DEFAULT false,
	`dateOfBirth` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`subject` varchar(255),
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`parentMessageId` int,
	`sentAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','staff') NOT NULL DEFAULT 'user';