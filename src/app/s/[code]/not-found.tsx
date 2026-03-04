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
import { ArrowLeft, Home, Plus } from 'lucide-react';
import Link from 'next/link';
import { TbDiamond } from 'react-icons/tb';

/**
 * Short link not found page
 * Displayed when a user visits an invalid or expired short URL
 */
export function ShortLinkNotFound() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/10" />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
              <TbDiamond className="size-5" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              Link Not Found
            </CardTitle>
            <CardDescription className="text-base mt-2">
              The short link you&apos;re looking for doesn&apos;t exist or has
              expired.
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center pb-4">
            <p className="text-sm text-muted-foreground">
              This could be because:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground text-left">
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>The link was deleted by its creator</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>The link has expired</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>The URL was typed incorrectly</span>
              </li>
            </ul>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <div className="flex w-full gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
              <GoBackButton variant="outline" className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </GoBackButton>
            </div>
            <Button variant="default" className="w-full" asChild>
              <Link href="/signup">
                <Plus className="mr-2 h-4 w-4" />
                Create Your Own Link
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

export default ShortLinkNotFound;
