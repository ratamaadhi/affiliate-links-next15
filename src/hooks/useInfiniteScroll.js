'use client';

import { useEffect, useRef } from 'react';

// Custom hook for infinite scrolling
function useInfiniteScroll(hasMore, onLoadMore, isLoading, setIsLoading) {
  const loaderRef = useRef(null);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const canLoadMore = entry.isIntersecting && hasMore && !isLoading;

        if (canLoadMore) {
          setIsLoading(true);
          onLoadMore();
        }
      },
      { threshold: 1 }
    );

    const currentLoaderRef = loaderRef.current;
    observer.observe(currentLoaderRef);

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
      observer.disconnect();
    };
  }, [hasMore, onLoadMore, isLoading, setIsLoading]);

  return loaderRef;
}

export default useInfiniteScroll;
