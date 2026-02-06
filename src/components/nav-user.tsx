'use client';

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Pencil,
  Sparkles,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarUpload } from '@/components/settings/avatar-upload';
import { useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

export function NavUser() {
  const { user, isLoading } = useAuth();
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);

  const { isMobile } = useSidebar();

  const router = useRouter();
  async function handleLogout() {
    try {
      await authClient.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out. Please try again.');
    }
  }

  const avatarFallback = user?.name?.substring(0, 2).toUpperCase();

  return (
    <SidebarMenu>
      {isLoading && (
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            disabled
            className="cursor-wait bg-transparent"
          >
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="grid flex-1 gap-1.5 text-left text-sm leading-tight">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      {!user && !isLoading && <SidebarMenuItem>Please log in</SidebarMenuItem>}
      {user && !isLoading && (
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <button
                    type="button"
                    onClick={() => setAvatarUploadOpen(true)}
                    className="group relative rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Change profile image"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback className="rounded-lg">
                        {avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                    {/* Hover/focus overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                      <Pencil className="h-4 w-4 text-white" />
                    </div>
                  </button>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Sparkles />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AvatarUpload
            currentImageUrl={user.image}
            userName={user.name}
            isOpen={avatarUploadOpen}
            onOpenChange={setAvatarUploadOpen}
          />
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
