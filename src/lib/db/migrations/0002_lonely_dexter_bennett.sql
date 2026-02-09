CREATE TABLE `link_report` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`link_id` integer NOT NULL,
	`reporter_name` text,
	`reporter_email` text,
	`reason` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`admin_notes` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`link_id`) REFERENCES `link`(`id`) ON UPDATE no action ON DELETE cascade
);
