import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/page/page-wrapper';
import dynamic from 'next/dynamic';
import { headers } from 'next/headers';
import { Suspense } from 'react';

// Lazy load settings components for better performance
const UsernameChangeForm = dynamic(
  () =>
    import('@/components/settings/username-change-form').then((mod) => ({
      default: mod.UsernameChangeForm,
    })),
  {
    loading: () => (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    ),
  }
);

const ShortLinksList = dynamic(
  () =>
    import('@/components/settings/short-links-list').then((mod) => ({
      default: mod.ShortLinksList,
    })),
  {
    loading: () => (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ),
  }
);

export default async function SettingsPage() {
  const headersList = await headers();
  const userInfo = headersList.get('x-user-info');
  const user = userInfo ? JSON.parse(userInfo) : null;

  const breadcrumbs = [
    { title: 'Dashboard', url: '/dashboard' },
    { title: 'Settings', url: '/dashboard/settings' },
  ];

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <div className="container mx-auto max-w-4xl py-8 px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-4 sm:text-xl">
              Username Settings
            </h2>
            <Suspense
              fallback={
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <UsernameChangeForm currentUsername={user?.username || ''} />
            </Suspense>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-4 sm:text-xl">
              Short URLs
            </h2>
            <Suspense
              fallback={
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-32" />
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <ShortLinksList />
            </Suspense>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-4 sm:text-xl">
              Account Information
            </h2>
            <div className="rounded-lg border p-4 sm:p-6 space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-base sm:text-lg break-all">{user?.email}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Username
                </label>
                <p className="text-base sm:text-lg break-all">
                  {user?.username || 'Not set'}
                </p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Display Name
                </label>
                <p className="text-base sm:text-lg break-all">
                  {user?.name || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
