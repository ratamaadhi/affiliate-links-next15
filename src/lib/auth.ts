import type { User } from 'better-auth';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import db from './db';
import * as schema from '@/lib/db/schema';
import { customSession, username } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { Resend } from 'resend';
import VerificationEmail from '@/components/email/verification-email';
import PasswordResetEmail from '@/components/email/reset-password';

const resend = new Resend(process.env.RESEND_API_KEY);

export type UserWithId = Omit<User, 'id'> & {
  id: number;
};

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: 'Affiliate Links App <noreply@ratama.space>',
        to: [user.email],
        subject: 'Reset your password',
        react: PasswordResetEmail({
          userName: user.name,
          resetUrl: url,
          userEmail: user.email,
        }),
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: 'Affiliate Links App <noreply@ratama.space>',
        to: [user.email],
        subject: 'Verify your email',
        react: VerificationEmail({ userName: user.name, verificationUrl: url }),
      });
    },
    sendOnSignUp: true,
  },
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  advanced: {
    generateId: false,
  },
  socialProviders: {
    google: {
      prompt: 'select_account',
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    nextCookies(),
    username(),
    customSession(async ({ user, session }) => {
      // const userData = await db.query.user.findFirst({
      //   where: eq(schema.user.id, +user.id),
      // });
      return {
        user: {
          ...user,
          // ...userData,
        },
        session,
      };
    }),
  ],
});
