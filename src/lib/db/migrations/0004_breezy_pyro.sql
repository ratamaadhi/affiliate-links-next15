PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_link_click_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`link_id` integer,
	`short_link_id` integer,
	`clicked_at` integer NOT NULL,
	`referrer` text,
	`user_agent` text,
	FOREIGN KEY (`link_id`) REFERENCES `link`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`short_link_id`) REFERENCES `short_link`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_link_click_history`("id", "link_id", "short_link_id", "clicked_at", "referrer", "user_agent") SELECT "id", "link_id", "short_link_id", "clicked_at", "referrer", "user_agent" FROM `link_click_history`;--> statement-breakpoint
DROP TABLE `link_click_history`;--> statement-breakpoint
ALTER TABLE `__new_link_click_history` RENAME TO `link_click_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `link_click_history_link_id_idx` ON `link_click_history` (`link_id`);--> statement-breakpoint
CREATE INDEX `link_click_history_short_link_id_idx` ON `link_click_history` (`short_link_id`);--> statement-breakpoint
CREATE INDEX `link_click_history_clicked_at_idx` ON `link_click_history` (`clicked_at`);--> statement-breakpoint
CREATE INDEX `link_click_history_link_clicked_at_idx` ON `link_click_history` (`link_id`,`clicked_at`);