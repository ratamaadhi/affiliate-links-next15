'use client';

import { useSWRConfig } from 'swr';

export function useLinkClick() {
  const { mutate } = useSWRConfig();

  const handleClick = (linkId: number, url: string) => {
    // Track click in background (fire and forget)
    fetch('/api/links/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId }),
    })
      .then(() => {
        // Invalidate all link-related caches to refresh click counts
        // This matches the cache keys used in useLinkInfinite and useLinkForPageInfinite
        mutate(
          (key) =>
            typeof key === 'object' &&
            key !== null &&
            'key' in key &&
            (key.key === 'links' || key.key === 'forPage')
        );
      })
      .catch(console.error);

    // Open URL in new tab using programmatic anchor click
    // This mimics a user-initiated click which is more reliable with popup blockers
    // Note: Only truly reliable when triggered directly from a user event
    if (!url) {
      console.error('Invalid URL provided to useLinkClick');
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();

    // Delay cleanup to ensure browser processes the click
    setTimeout(() => {
      document.body.removeChild(anchor);
    }, 100);
  };

  return { handleClick };
}
