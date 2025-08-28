'use client';

import { ReactNode } from 'react';
import { SWRConfig } from 'swr';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  return (
    <SWRConfig
      value={{
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        loadingTimeout: 10000,
      }}
    >
      {children}
    </SWRConfig>
  );
};
