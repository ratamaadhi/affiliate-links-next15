import { int, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

import { user } from './auth';
import { link, LinkSelect } from './link';

export const page = sqliteTable('page', {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  description: text(),
  slug: text().notNull(),
  userId: integer()
    .notNull()
    .references(() => user.id),

  themeSettings: text({ mode: 'json' }),

  createdAt: int()
    .notNull()
    .$default(() => Date.now()),
  updatedAt: int()
    .notNull()
    .$default(() => Date.now())
    .$onUpdate(() => Date.now()),
});

export const pagesRelations = relations(page, ({ one, many }) => ({
  user: one(user, {
    fields: [page.userId],
    references: [user.id],
  }),
  links: many(link),
}));

export type PageSelect = typeof page.$inferSelect & {
  links: LinkSelect[];
};
export type PageInsert = typeof page.$inferInsert;
