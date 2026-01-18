CREATE TABLE `username_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`old_username` text NOT NULL,
	`changed_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `username_history_user_id_idx` ON `username_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `username_history_old_username_idx` ON `username_history` (`old_username`);--> statement-breakpoint
CREATE TABLE `short_link` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`short_code` text NOT NULL,
	`target_url` text NOT NULL,
	`page_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`click_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer,
	FOREIGN KEY (`page_id`) REFERENCES `page`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `short_link_shortCode_unique` ON `short_link` (`short_code`);--> statement-breakpoint
CREATE INDEX `short_link_short_code_idx` ON `short_link` (`short_code`);--> statement-breakpoint
CREATE INDEX `short_link_user_id_idx` ON `short_link` (`user_id`);--> statement-breakpoint
CREATE INDEX `short_link_page_id_idx` ON `short_link` (`page_id`);--> statement-breakpoint
ALTER TABLE `user` ADD `username_change_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `user` ADD `last_username_change_at` integer;