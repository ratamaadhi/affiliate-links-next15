import { authClient } from '@/lib/auth-client';
import { SessionUser } from '@/lib/types';
import { Session } from 'better-auth';
import useSWR from 'swr';

interface InfSession {
  user: SessionUser;
  session: Session;
}

// Fetcher function untuk SWR
const sessionFetcher = async (): Promise<InfSession | null> => {
  try {
    const { data, error } = await authClient.getSession();
    if (error || !data) {
      return null;
    }
    // Ensure 'email' is present and not optional
    if (!data.user.email) {
      throw new Error('User email is missing in session data');
    }
    return {
      ...data,
      user: {
        ...data.user,
        email: data.user.email as string, // force required
        username: (data.user as any).username ?? null, // ensure username is present
      },
    };
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
};

// OPTIMIZATION: Accept initialData from server to skip redundant client-side session fetch
export const useAuth = (initialUser?: SessionUser | null) => {
  const {
    data: session,
    error,
    isLoading,
    mutate,
  } = useSWR<InfSession | null>('session', sessionFetcher, {
    // OPTIMIZATION: Use server-provided data as fallback to prevent duplicate fetch
    fallbackData: initialUser
      ? { user: initialUser, session: null as any }
      : undefined,
    // OPTIMIZATION: Skip revalidation on mount if initial data is provided
    revalidateOnMount: !initialUser,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
    dedupingInterval: 60000, // 1 menit
    refreshInterval: 300000, // 5 menit
  });

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Mutate untuk update session data
      await mutate();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
      // Mutate dengan null untuk clear session
      await mutate(null, false);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        throw new Error(error.message);
      }

      await mutate();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  return {
    session,
    user: session?.user || null,
    isLoading,
    isAuthenticated: !!session,
    error,
    login,
    logout,
    signup,
    mutate, // untuk manual revalidation
  };
};
