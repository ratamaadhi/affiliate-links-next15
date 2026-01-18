import {
  int,
  integer,
  sqliteTable,
  text,
  index,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';
import { page } from './page';

export const shortLink = sqliteTable(
  'short_link',
  {
    id: int().primaryKey({ autoIncrement: true }),
    shortCode: text().notNull().unique(),
    targetUrl: text().notNull(),
    pageId: integer()
      .notNull()
      .references(() => page.id, { onDelete: 'cascade' }),
    userId: integer()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    clickCount: integer().default(0).notNull(),
    createdAt: integer()
      .notNull()
      .$default(() => Date.now()),
    expiresAt: integer(),
  },
  (table) => ({
    shortCodeIdx: index('short_link_short_code_idx').on(table.shortCode),
    userIdIdx: index('short_link_user_id_idx').on(table.userId),
    pageIdIdx: index('short_link_page_id_idx').on(table.pageId),
  })
);

export const shortLinkRelations = relations(shortLink, ({ one }) => ({
  user: one(user, {
    fields: [shortLink.userId],
    references: [user.id],
  }),
  page: one(page, {
    fields: [shortLink.pageId],
    references: [page.id],
  }),
}));

export type ShortLinkSelect = typeof shortLink.$inferSelect;
export type ShortLinkInsert = typeof shortLink.$inferInsert;
