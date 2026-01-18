-- Add composite unique index on (userId, slug) for page table
-- This allows multiple users to have pages with the same title (same slug part)
-- while ensuring slugs are unique per user

-- Create composite unique index on (userId, slug)
CREATE UNIQUE INDEX `page_userId_slug_unique_idx` ON `page` (`userId`, `slug`);
