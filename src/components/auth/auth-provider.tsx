'use client';

import { useAuth } from '@/hooks/useAuth';
import { SessionUser } from '@/lib/types';
import { createContext, useContext } from 'react';

interface AuthContextValue {
  initialUser: SessionUser | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: SessionUser | null;
}

/**
 * OPTIMIZATION: AuthProvider component that passes initial user data from server
 * to useAuth hook, preventing duplicate client-side session fetches.
 *
 * Usage in server components:
 * ```tsx
 * <AuthProvider initialUser={user}>
 *   <YourClientComponents />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  // Create a context to make initialUser available to nested components
  return (
    <AuthContext.Provider value={{ initialUser: initialUser || null }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * OPTIMIZATION: Hook that combines useAuth with server-provided initial data.
 * Use this instead of useAuth in client components that are children of AuthProvider.
 *
 * This eliminates the duplicate session fetch on initial load.
 */
export function useAuthWithInitial() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn(
      'useAuthWithInitial must be used within AuthProvider, falling back to useAuth without initial data'
    );
  }
  return useAuth(context?.initialUser);
}
