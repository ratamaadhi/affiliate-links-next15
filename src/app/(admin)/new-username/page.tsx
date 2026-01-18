import { GalleryVerticalEnd } from 'lucide-react';

import { NewUserForm } from '@/components/form/new-user-form';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function NewUsername() {
  const { session } = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Affiliate Links
        </Link>

        <NewUserForm />
      </div>
    </div>
  );
}
