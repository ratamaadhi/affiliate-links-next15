import { relations } from "drizzle-orm/relations";
import { user, account, session, page, link, usernameHistory, shortLink } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	pages: many(page),
	usernameHistories: many(usernameHistory),
	shortLinks: many(shortLink),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const pageRelations = relations(page, ({one, many}) => ({
	user: one(user, {
		fields: [page.userId],
		references: [user.id]
	}),
	links: many(link),
	shortLinks: many(shortLink),
}));

export const linkRelations = relations(link, ({one}) => ({
	page: one(page, {
		fields: [link.pageId],
		references: [page.id]
	}),
}));

export const usernameHistoryRelations = relations(usernameHistory, ({one}) => ({
	user: one(user, {
		fields: [usernameHistory.userId],
		references: [user.id]
	}),
}));

export const shortLinkRelations = relations(shortLink, ({one}) => ({
	user: one(user, {
		fields: [shortLink.userId],
		references: [user.id]
	}),
	page: one(page, {
		fields: [shortLink.pageId],
		references: [page.id]
	}),
}));