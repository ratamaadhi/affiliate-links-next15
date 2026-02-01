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

    // Open URL in new tab with fallback for popup blockers
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      // Popup was blocked, fall back to opening in same tab
      window.location.href = url;
    }
  };

  return { handleClick };
}
