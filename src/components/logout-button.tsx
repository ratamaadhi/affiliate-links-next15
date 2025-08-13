'use client';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function LogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    try {
      await authClient.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out. Please try again.');
    }
  }
  return (
    <Button variant="outline" onClick={handleLogout}>
      Logout
    </Button>
  );
}
