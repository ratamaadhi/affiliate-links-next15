import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const task = sqliteTable("task", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	done: integer().default(0).notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const account = sqliteTable("account", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: integer("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at"),
	refreshTokenExpiresAt: integer("refresh_token_expires_at"),
	scope: text(),
	password: text(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const session = sqliteTable("session", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	expiresAt: integer("expires_at").notNull(),
	token: text().notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: integer("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
},
	(table) => [
		uniqueIndex("session_token_unique").on(table.token),
	]);

export const user = sqliteTable("user", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: integer("email_verified").notNull(),
	image: text(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	username: text(),
	displayUsername: text("display_username"),
	usernameChangeCount: integer("username_change_count").default(0),
	lastUsernameChangeAt: integer("last_username_change_at"),
},
	(table) => [
		uniqueIndex("user_username_unique").on(table.username),
		uniqueIndex("user_email_unique").on(table.email),
	]);

export const verification = sqliteTable("verification", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at"),
	updatedAt: integer("updated_at"),
});

export const page = sqliteTable("page", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	title: text().notNull(),
	description: text(),
	slug: text().notNull(),
	userId: integer("user_id").notNull().references(() => user.id),
	themeSettings: text("theme_settings"),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const link = sqliteTable("link", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	title: text().notNull(),
	url: text().notNull(),
	pageId: integer("page_id").notNull().references(() => page.id),
	displayOrder: real("display_order").notNull(),
	clickCount: integer("click_count").default(0).notNull(),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	imageUrl: text("image_url"),
	description: text(),
});

export const usernameHistory = sqliteTable("username_history", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	oldUsername: text("old_username").notNull(),
	changedAt: integer("changed_at").notNull(),
},
	(table) => [
		index("username_history_old_username_idx").on(table.oldUsername),
		index("username_history_user_id_idx").on(table.userId),
	]);

export const shortLink = sqliteTable("short_link", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	shortCode: text("short_code").notNull(),
	targetUrl: text("target_url").notNull(),
	pageId: integer("page_id").notNull().references(() => page.id, { onDelete: "cascade" }),
	userId: integer("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	clickCount: integer("click_count").default(0).notNull(),
	createdAt: integer("created_at").notNull(),
	expiresAt: integer("expires_at"),
},
	(table) => [
		index("short_link_page_id_idx").on(table.pageId),
		index("short_link_user_id_idx").on(table.userId),
		index("short_link_short_code_idx").on(table.shortCode),
		uniqueIndex("short_link_shortCode_unique").on(table.shortCode),
	]);

