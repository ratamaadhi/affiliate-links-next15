import { createAuthClient } from 'better-auth/client';
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
});

export const signIn = async () => {
  const data = await authClient.signIn.social({
    provider: 'google',
  });
  return data;
};
