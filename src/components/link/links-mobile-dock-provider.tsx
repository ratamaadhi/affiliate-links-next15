'use client';

import {
  MobileDockActions,
  MobileDockProvider,
} from '@/context/mobile-dock-context';
import { Plus, Search } from 'lucide-react';

interface LinksMobileDockProviderProps {
  children: React.ReactNode;
}

export function LinksMobileDockProvider({
  children,
}: LinksMobileDockProviderProps) {
  const actions: MobileDockActions = {
    triggerAdd: () => {
      // Trigger the create link button
      const createLinkButton = document.querySelector(
        '[data-create-link-button]'
      ) as HTMLButtonElement;
      if (createLinkButton) {
        createLinkButton.click();
      }
    },
    triggerSearch: () => {
      // Focus on search input
      const searchInput = document.querySelector(
        '[data-search-input]'
      ) as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
  };

  const config = {
    addButtonText: 'Add Link',
    searchButtonText: 'Search Link',
    addButtonIcon: <Plus className="h-5 w-5" />,
    searchButtonIcon: <Search className="h-5 w-5" />,
  };

  return (
    <MobileDockProvider actions={actions} config={config}>
      {children}
    </MobileDockProvider>
  );
}
