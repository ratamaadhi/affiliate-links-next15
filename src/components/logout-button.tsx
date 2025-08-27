'use client';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function LogoutButton({ className }: { className?: string }) {
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
  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      size="sm"
      className={className}
    >
      <LogOut />
      Log out
    </Button>
  );
}
