-- Remove global UNIQUE constraint from page.slug and add composite unique constraint (userId, slug)
-- This allows multiple users to have pages with the same title (same slug part)
-- while ensuring slugs are unique per user

-- First, recreate the page table without the slug unique constraint
DROP TABLE IF EXISTS `page`;

CREATE TABLE `page` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `slug` text NOT NULL,
  `userId` integer NOT NULL,
  `themeSettings` text ( DEFAULT 'json' ),
  `createdAt` integer NOT NULL DEFAULT (strftime('%s', 'now')),
  `updatedAt` integer NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Add composite unique constraint on (userId, slug)
-- This allows same slug for different users, but unique per user
CREATE UNIQUE INDEX `page_userId_slug_unique_idx` ON `page` (`userId`, `slug`);

-- Recreate indexes
CREATE INDEX `page_userId_idx` ON `page` (`userId`);
