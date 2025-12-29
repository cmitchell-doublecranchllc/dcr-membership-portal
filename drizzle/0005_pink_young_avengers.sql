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
	`firstReminderSentAt` timestamp,
	`finalReminderSentAt` timestamp,
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
	`content` text,
	`googleDocId` varchar(255),
	`googleDocUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`requiresSignature` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`eventType` enum('competition','show','clinic','social','riding_lesson','horsemanship_lesson','other') NOT NULL DEFAULT 'other',
	`location` varchar(255),
	`startTime` bigint NOT NULL,
	`endTime` bigint NOT NULL,
	`capacity` int,
	`recurringSeriesId` int,
	`recurrenceException` boolean NOT NULL DEFAULT false,
	`requiresRsvp` boolean NOT NULL DEFAULT true,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `memberDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`documentType` varchar(100) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` varchar(1000) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`uploadedBy` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memberDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`membershipTier` enum('bronze','silver','gold') NOT NULL DEFAULT 'bronze',
	`acuityClientId` varchar(128),
	`phone` varchar(32),
	`emergencyContactName` varchar(255),
	`emergencyContactPhone` varchar(32),
	`emergencyContactRelationship` varchar(128),
	`parentId` int,
	`isChild` boolean NOT NULL DEFAULT false,
	`dateOfBirth` timestamp,
	`allergies` text,
	`medications` text,
	`photoConsent` boolean NOT NULL DEFAULT false,
	`smsConsent` boolean NOT NULL DEFAULT false,
	`liabilityWaiverSigned` boolean NOT NULL DEFAULT false,
	`liabilityWaiverSignedAt` timestamp,
	`liabilityWaiverSignatureData` text,
	`horseManagementLevel` enum('d1','d2','d3','c1','c2','c3','hb','ha'),
	`ridingCertifications` text,
	`otherCertifications` text,
	`ridingGoals` text,
	`medicalNotes` text,
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
CREATE TABLE `onboardingChecklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemKey` varchar(128) NOT NULL,
	`itemTitle` varchar(255) NOT NULL,
	`itemDescription` text,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboardingChecklist_id` PRIMARY KEY(`id`)
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
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','staff') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `accountStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `profilePhotoUrl` text;