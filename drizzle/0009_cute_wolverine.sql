ALTER TABLE `members` ADD CONSTRAINT `members_userId_unique` UNIQUE(`userId`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);