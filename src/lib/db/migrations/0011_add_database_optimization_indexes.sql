-- Phase 6.3: Database Optimization for Username Change & Short URL System
-- This migration adds indexes to optimize query performance

-- Add index on page.slug for slug-only queries
-- This improves performance of findPageBySlug() and generateUniqueSlug()
CREATE INDEX IF NOT EXISTS page_slug_idx ON page (slug);

-- Add index on page.userId for user-specific page queries
-- This complements the existing composite index (userId, slug)
CREATE INDEX IF NOT EXISTS page_user_id_idx ON page (user_id);

-- Add index on link.pageId for page-specific link queries
-- This improves performance of fetchPaginatedLinks() and fetchPaginatedActiveLinks()
CREATE INDEX IF NOT EXISTS link_page_id_idx ON link (page_id);

-- Add index on link.displayOrder for ordering queries
-- This improves performance of queries ordered by displayOrder
CREATE INDEX IF NOT EXISTS link_display_order_idx ON link (display_order);

-- Add index on link.isActive for filtering active links
-- This improves performance of queries filtering by isActive
CREATE INDEX IF NOT EXISTS link_is_active_idx ON link (is_active);

-- Add composite index on (pageId, displayOrder) for ordered page queries
-- This improves performance of queries that filter by pageId and order by displayOrder
CREATE INDEX IF NOT EXISTS link_page_id_display_order_idx ON link (page_id, display_order);

-- Add composite index on (pageId, isActive, displayOrder) for filtered ordered queries
-- This improves performance of queries that filter by pageId and isActive, then order by displayOrder
CREATE INDEX IF NOT EXISTS link_page_id_is_active_display_order_idx ON link (page_id, is_active, display_order);
