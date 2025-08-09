import type { User } from 'better-auth';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import db from '@/lib/db'; // your drizzle instance
import { createAuthMiddleware } from 'better-auth/plugins';

export type UserWithId = Omit<User, 'id'> & {
  id: number;
};

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/get-session') {
        if (!ctx.context.session) {
          return ctx.json({
            session: null,
            user: null,
          });
        }
        return ctx.json(ctx.context.session);
      }
    }),
  },
  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),
  advanced: {
    generateId: false,
  },
  socialProviders: {
    github: {
      clientId: process.env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
    },
  },
});
