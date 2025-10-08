'use client';

import {
  MobileDockActions,
  MobileDockProvider,
} from '@/context/mobile-dock-context';
import { Plus, Search } from 'lucide-react';

interface PagesMobileDockProviderProps {
  children: React.ReactNode;
}

export function PagesMobileDockProvider({
  children,
}: PagesMobileDockProviderProps) {
  const actions: MobileDockActions = {
    triggerAdd: () => {
      // Trigger the create page button
      const createPageButton = document.querySelector(
        '[data-create-page-button]'
      ) as HTMLButtonElement;
      if (createPageButton) {
        createPageButton.click();
      }
    },
    triggerSearch: () => {
      // Focus on search page input
      const searchPageInput = document.querySelector(
        '[data-search-page-input]'
      ) as HTMLInputElement;
      if (searchPageInput) {
        searchPageInput.focus();
      }
    },
  };

  const config = {
    addButtonText: 'Add Page',
    searchButtonText: 'Search Page',
    addButtonIcon: <Plus className="h-5 w-5" />,
    searchButtonIcon: <Search className="h-5 w-5" />,
  };

  return (
    <MobileDockProvider actions={actions} config={config}>
      {children}
    </MobileDockProvider>
  );
}
