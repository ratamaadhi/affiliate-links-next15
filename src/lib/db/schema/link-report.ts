import { relations } from 'drizzle-orm';
import { int, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { link } from './link';

export const linkReport = sqliteTable('link_report', {
  id: int().primaryKey({ autoIncrement: true }),
  linkId: integer()
    .notNull()
    .references(() => link.id, { onDelete: 'cascade' }),

  // Reporter info - can be anonymous
  reporterName: text('reporter_name'),
  reporterEmail: text('reporter_email'),

  // Report details
  reason: text().notNull(), // 'broken', 'inappropriate', 'spam', 'other'
  description: text(), // Additional details

  // Status tracking
  status: text().default('pending').notNull(), // 'pending', 'reviewed', 'resolved', 'dismissed'
  adminNotes: text('admin_notes'),

  // Metadata
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  createdAt: int()
    .notNull()
    .$default(() => Date.now()),
  updatedAt: int()
    .notNull()
    .$default(() => Date.now())
    .$onUpdate(() => Date.now()),
});

export const linkReportsRelations = relations(linkReport, ({ one }) => ({
  link: one(link, {
    fields: [linkReport.linkId],
    references: [link.id],
  }),
}));

export type LinkReportSelect = typeof linkReport.$inferSelect;
export type LinkReportInsert = typeof linkReport.$inferInsert;
