import { AppSidebar } from '@/components/app-sidebar';
import { AuthProvider } from '@/components/auth-provider';
import { DashboardSkeleton } from '@/components/dashboard-skeleton';
import { ProgressProvider } from '@/components/progress-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard | Aff-Link',
  description:
    '💎 The &ldquo;Link in Bio&rdquo; that Actually Sells. Just paste your affiliate links. We&apos;ll instantly turn them into a beautiful, shoppable gallery.',
};

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Suspense fallback={<DashboardSkeleton />}>
          <ProgressProvider>
            <AppSidebar />
            {children}
          </ProgressProvider>
        </Suspense>
      </SidebarProvider>
    </AuthProvider>
  );
}
