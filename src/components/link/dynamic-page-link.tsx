'use client';

import { LinkPageContext } from '@/context/link-page-context';
import { CopyButton } from '@/components/ui/shadcn-io/copy-button';
import Link from 'next/link';
import { useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function DynamicPageLink() {
  const { selectedPage } = useContext(LinkPageContext);
  const { user } = useAuth();

  // Get username from authenticated user
  const username = user?.username;

  // If no page is selected, use the username as fallback
  const pageSlug = selectedPage?.slug || selectedPage;
  const linkText = selectedPage?.label || 'Select a page to generate link';

  // Generate URL based on whether selected page is username or slug
  const pageUrl = (() => {
    if (!pageSlug) {
      return `${process.env.NEXT_PUBLIC_BASE_URL}/`;
    }

    // If selectedPage is a string (username) or if the slug matches username, use /[username]
    if (typeof selectedPage === 'string' || pageSlug === username) {
      return `${process.env.NEXT_PUBLIC_BASE_URL}/${username}`;
    }

    // If selectedPage is an object with slug different from username, use /[username]/[slug]
    return `${process.env.NEXT_PUBLIC_BASE_URL}/${username}/${pageSlug}`;
  })();

  const copyContent = pageUrl;

  return (
    <div className="w-full flex items-center gap-2">
      <div className="flex flex-1 gap-2 xl:w-max w-full rounded-lg px-4 py-2 bg-background shadow border border-muted relative overflow-hidden">
        <div className="text-nowrap text-sm relative overflow-x-auto no-scrollbar">
          <span className="font-semibold text-foreground/70 sticky left-0 bg-background">
            My Linkid:{' '}
          </span>
          {pageSlug ? (
            <Link href={pageUrl} target="_blank" className="hover:underline">
              {pageUrl}
            </Link>
          ) : (
            <span className="text-muted-foreground">{linkText}</span>
          )}
        </div>
      </div>
      {pageSlug && <CopyButton content={copyContent} />}
    </div>
  );
}
