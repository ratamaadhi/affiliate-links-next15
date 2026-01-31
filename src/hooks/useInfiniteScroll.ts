'use client';

import { useEffect } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

function useInfiniteScroll(
  hasMore: boolean,
  onLoadMore: () => void,
  isLoading: boolean
): (node?: Element | null) => void {
  const { isIntersecting, ref: loaderRef } = useIntersectionObserver({
    threshold: 0.5,
  });

  useEffect(() => {
    // The ref will be null initially, but isIntersecting will be false
    // so we only need to check the actual conditions
    const canLoadMore = isIntersecting && hasMore && !isLoading;

    if (canLoadMore) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, isIntersecting, isLoading]);

  return loaderRef;
}

export default useInfiniteScroll;
