import {
  int,
  integer,
  sqliteTable,
  text,
  index,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';

export const usernameHistory = sqliteTable(
  'username_history',
  {
    id: int().primaryKey({ autoIncrement: true }),
    userId: integer()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    oldUsername: text().notNull(),
    changedAt: integer()
      .notNull()
      .$default(() => Date.now()),
  },
  (table) => ({
    userIdIdx: index('username_history_user_id_idx').on(table.userId),
    oldUsernameIdx: index('username_history_old_username_idx').on(
      table.oldUsername
    ),
  })
);

export const usernameHistoryRelations = relations(
  usernameHistory,
  ({ one }) => ({
    user: one(user, {
      fields: [usernameHistory.userId],
      references: [user.id],
    }),
  })
);

export type UsernameHistorySelect = typeof usernameHistory.$inferSelect;
export type UsernameHistoryInsert = typeof usernameHistory.$inferInsert;
