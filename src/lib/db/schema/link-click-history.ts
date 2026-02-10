import {
  int,
  integer,
  sqliteTable,
  index,
  text,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { link } from './link';
import { shortLink } from './short-link';

export const linkClickHistory = sqliteTable(
  'link_click_history',
  {
    id: int().primaryKey({ autoIncrement: true }),
    linkId: integer('link_id').references(() => link.id, {
      onDelete: 'cascade',
    }),
    shortLinkId: integer('short_link_id').references(() => shortLink.id, {
      onDelete: 'cascade',
    }),
    clickedAt: int('clicked_at')
      .notNull()
      .$default(() => Date.now()),
    // Optional: track referrer, user agent, etc. for future analytics
    referrer: text('referrer'),
    userAgent: text('user_agent'),
  },
  (table) => ({
    linkIdIdx: index('link_click_history_link_id_idx').on(table.linkId),
    shortLinkIdIdx: index('link_click_history_short_link_id_idx').on(
      table.shortLinkId
    ),
    clickedAtIdx: index('link_click_history_clicked_at_idx').on(
      table.clickedAt
    ),
    // Composite index for trend queries
    linkClickedAtIdx: index('link_click_history_link_clicked_at_idx').on(
      table.linkId,
      table.clickedAt
    ),
  })
);

export type LinkClickHistorySelect = typeof linkClickHistory.$inferSelect;
export type LinkClickHistoryInsert = typeof linkClickHistory.$inferInsert;
