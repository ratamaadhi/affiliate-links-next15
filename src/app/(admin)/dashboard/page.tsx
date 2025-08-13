import { LogoutButton } from '@/components/logout-button';
import { ModeToggle } from '@/components/mode-toggle';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }
  return (
    <main className="flex flex-col items-center justify-center h-screen gap-y-2">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-4 text-gray-600">This is the admin dashboard page.</p>
      <div className="flex justify-between items-center gap-2">
        <LogoutButton />
        <ModeToggle />
      </div>
    </main>
  );
}
