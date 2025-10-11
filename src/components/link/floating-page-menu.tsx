'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicPages } from '@/hooks/use-public-pages';
import { FileText, Menu, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageListItem } from './page-list-item';

interface FloatingPageMenuProps {
  username: string;
  currentSlug?: string;
}

export function FloatingPageMenu({
  username,
  currentSlug,
}: FloatingPageMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const { data, isLoading, error } = usePublicPages(username);

  const handleNavigate = (slug: string) => {
    router.push(`/${username}/${slug}`);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-primary text-primary-foreground"
            aria-label="Open page menu"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader className="text-left pb-4">
              <div className="flex items-center justify-between">
                <DrawerTitle
                  className="text-xl font-semibold"
                  data-testid="drawer-title"
                >
                  Pages by {username}
                </DrawerTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DrawerHeader>

            <ScrollArea className="px-4 pb-4 h-[60vh]">
              {isLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <X className="w-6 h-6 text-destructive" />
                  </div>
                  <p className="text-muted-foreground">Failed to load pages</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {data && !error && (
                <div className="space-y-4">
                  {/* User info */}
                  <div
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    data-testid="user-info"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg">
                        {data.user.name?.charAt(0)?.toUpperCase() ||
                          data.user.username?.charAt(0)?.toUpperCase() ||
                          'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {data.user.name || data.user.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        @{data.user.username}
                      </p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <FileText className="w-3 h-3" />
                      {data.pages.length} pages
                    </Badge>
                  </div>

                  {/* Pages list */}
                  {data.pages.length > 0 ? (
                    <div className="space-y-3" data-testid="page-list">
                      {data.pages.map((page) => (
                        <PageListItem
                          key={page.id}
                          page={page}
                          username={username}
                          isCurrentPage={page.slug === currentSlug}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        No pages available
                      </p>
                    </div>
                  )}

                  {/* Navigate to profile */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleNavigate('')}
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
