'use client';

import { createContext, ReactNode, useContext } from 'react';

export interface MobileDockActions {
  triggerAdd: () => void;
  triggerSearch: () => void;
}

export interface MobileDockConfig {
  showAddButton: boolean;
  showSearchButton: boolean;
  addButtonText: string;
  searchButtonText: string;
  addButtonIcon: React.ReactNode;
  searchButtonIcon: React.ReactNode;
}

interface MobileDockContextType {
  actions: MobileDockActions;
  config: MobileDockConfig;
}

const defaultConfig: MobileDockConfig = {
  showAddButton: true,
  showSearchButton: true,
  addButtonText: 'Add',
  searchButtonText: 'Search',
  addButtonIcon: null, // Will be set by provider
  searchButtonIcon: null, // Will be set by provider
};

const MobileDockContext = createContext<MobileDockContextType | null>(null);

export function useMobileDock() {
  const context = useContext(MobileDockContext);
  if (!context) {
    throw new Error('useMobileDock must be used within a MobileDockProvider');
  }
  return context;
}

interface MobileDockProviderProps {
  children: ReactNode;
  actions: MobileDockActions;
  config?: Partial<MobileDockConfig>;
}

export function MobileDockProvider({
  children,
  actions,
  config = {},
}: MobileDockProviderProps) {
  const finalConfig = { ...defaultConfig, ...config };

  return (
    <MobileDockContext.Provider value={{ actions, config: finalConfig }}>
      {children}
    </MobileDockContext.Provider>
  );
}
