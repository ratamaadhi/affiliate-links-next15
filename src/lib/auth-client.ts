import { createAuthClient } from 'better-auth/client';
import {
  customSessionClient,
  usernameClient,
} from 'better-auth/client/plugins';
import type { auth } from '@/lib/auth';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  plugins: [customSessionClient<typeof auth>(), usernameClient()],
});
