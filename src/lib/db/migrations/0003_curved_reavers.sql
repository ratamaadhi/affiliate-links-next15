CREATE TABLE `link_click_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`link_id` integer NOT NULL,
	`short_link_id` integer,
	`clicked_at` integer NOT NULL,
	`referrer` text,
	`user_agent` text,
	FOREIGN KEY (`link_id`) REFERENCES `link`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`short_link_id`) REFERENCES `short_link`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `link_click_history_link_id_idx` ON `link_click_history` (`link_id`);--> statement-breakpoint
CREATE INDEX `link_click_history_short_link_id_idx` ON `link_click_history` (`short_link_id`);--> statement-breakpoint
CREATE INDEX `link_click_history_clicked_at_idx` ON `link_click_history` (`clicked_at`);--> statement-breakpoint
CREATE INDEX `link_click_history_link_clicked_at_idx` ON `link_click_history` (`link_id`,`clicked_at`);