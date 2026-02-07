-- Add health check fields to link table
ALTER TABLE `link` ADD COLUMN `last_checked_at` integer;
--> statement-breakpoint
ALTER TABLE `link` ADD COLUMN `health_status` text;
--> statement-breakpoint
ALTER TABLE `link` ADD COLUMN `status_code` integer;
--> statement-breakpoint
ALTER TABLE `link` ADD COLUMN `response_time` integer;
--> statement-breakpoint
ALTER TABLE `link` ADD COLUMN `error_message` text;
