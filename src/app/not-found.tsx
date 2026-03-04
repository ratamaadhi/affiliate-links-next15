import { GoBackButton } from '@/components/go-back-button';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Home, Search } from 'lucide-react';
import Link from 'next/link';

/**
 * Global not found page
 * Displayed when a route doesn't match any existing pages
 */
export default function NotFound() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/10" />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
              <span className="text-4xl font-bold text-primary">404</span>
            </div>
            <CardTitle className="text-2xl font-semibold">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-base mt-2">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center pb-4">
            <p className="text-sm text-muted-foreground">
              This could be because:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground text-left">
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>The URL was mistyped or is invalid</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>The page has been deleted or moved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>You don&apos;t have permission to view this page</span>
              </li>
            </ul>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <div className="flex w-full gap-2">
              <Button variant="default" className="flex-1" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
              <GoBackButton variant="outline" className="flex-1">
                <Search className="mr-2 h-4 w-4" />
                Go Back
              </GoBackButton>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Need help?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Create an account
              </Link>{' '}
              to get started.
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
