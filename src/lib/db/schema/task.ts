import { int, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const task = sqliteTable('task', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  done: integer({ mode: 'boolean' }).notNull().default(false),
  createdAt: int()
    .notNull()
    .$default(() => Date.now()),
  updatedAt: int()
    .notNull()
    .$default(() => Date.now())
    .$onUpdate(() => Date.now()),
});

export const selectTaskSchema = createSelectSchema(task);
export const insertTaskSchema = createInsertSchema(task, {
  name: (string) => string.min(1, 'Context is required').max(500),
})
  .required({
    done: true,
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const patchTaskSchema = insertTaskSchema.partial();
