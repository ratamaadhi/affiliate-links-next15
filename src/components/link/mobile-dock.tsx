'use client';

import { Button } from '@/components/ui/button';
import { Dock, DockIcon } from '@/components/ui/dock';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useMobileDock } from '@/context/mobile-dock-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { Eye, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EnhancedDashboardPreview } from './enhanced-dashboard-preview';

interface MobileDockProps {
  username?: string;
  pageLink?: string;
}

export function MobileDock({ username, pageLink }: MobileDockProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();
  const { actions, config } = useMobileDock();

  const handleHomeClick = () => {
    router.push('/dashboard');
  };

  const handlePreviewClick = () => {
    setIsPreviewOpen(true);
  };

  const handleAddClick = () => {
    actions.triggerAdd();
  };

  const handleSearchClick = () => {
    actions.triggerSearch();
  };

  // Only show dock on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
        <Dock
          direction="bottom"
          className="justify-around bg-background/45 backdrop-blur-md border-border shadow-2xl rounded-2xl"
          iconSize={40}
          iconMagnification={50}
          iconDistance={100}
        >
          <DockIcon onClick={handleHomeClick}>
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-full rounded-full hover:bg-muted-foreground/10"
              aria-label="Home"
            >
              <Home className="h-5 w-5" />
            </Button>
          </DockIcon>

          {config.showAddButton && (
            <DockIcon onClick={handleAddClick}>
              <Button
                variant="ghost"
                size="icon"
                className="h-full w-full rounded-full hover:bg-muted-foreground/10"
                aria-label={config.addButtonText}
              >
                {config.addButtonIcon}
              </Button>
            </DockIcon>
          )}

          {config.showSearchButton && (
            <DockIcon onClick={handleSearchClick}>
              <Button
                variant="ghost"
                size="icon"
                className="h-full w-full rounded-full hover:bg-muted-foreground/10"
                aria-label={config.searchButtonText}
              >
                {config.searchButtonIcon}
              </Button>
            </DockIcon>
          )}

          <Drawer open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DrawerTrigger asChild>
              <DockIcon onClick={handlePreviewClick}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-full w-full rounded-full hover:bg-muted-foreground/10"
                  aria-label="Preview"
                >
                  <Eye className="h-5 w-5" />
                </Button>
              </DockIcon>
            </DrawerTrigger>
            <DrawerContent className="data-[vaul-drawer-direction=top]:max-h-[90vh] data-[vaul-drawer-direction=bottom]:max-h-[90vh] h-[90vh]">
              <DrawerTitle className="sr-only">Page Preview</DrawerTitle>
              <div className="w-full pt-2">
                <EnhancedDashboardPreview
                  pageLink={pageLink}
                  username={username || ''}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </Dock>
      </div>

      {/* Add spacing at the bottom to prevent content from being hidden behind the dock */}
      {/* <div className="h-14 md:hidden" /> */}
    </>
  );
}
