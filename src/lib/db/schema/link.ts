import { relations } from 'drizzle-orm';
import { int, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { page } from './page';

export const link = sqliteTable('link', {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  url: text().notNull(),
  imageUrl: text('image_url'), // Added image URL field

  pageId: integer()
    .notNull()
    .references(() => page.id),

  displayOrder: real().default(0).notNull(),
  clickCount: integer().default(0).notNull(),

  isActive: integer({ mode: 'boolean' }).default(true).notNull(),

  createdAt: int()
    .notNull()
    .$default(() => Date.now()),
  updatedAt: int()
    .notNull()
    .$default(() => Date.now())
    .$onUpdate(() => Date.now()),
});

export const linksRelations = relations(link, ({ one }) => ({
  page: one(page, {
    fields: [link.pageId],
    references: [page.id],
  }),
}));

export type LinkSelect = typeof link.$inferSelect;
export type LinkInsert = typeof link.$inferInsert;
