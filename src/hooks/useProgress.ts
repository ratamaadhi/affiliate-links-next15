'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import NProgress from 'nprogress';

interface ProgressOptions {
  showSpinner?: boolean;
  minimum?: number;
  easing?: string;
  speed?: number;
  trickle?: boolean;
  trickleSpeed?: number;
}

export const useProgress = (options: ProgressOptions = {}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isNavigating = useRef(false);
  const previousPath = useRef(
    pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
  );

  useEffect(() => {
    // Configure NProgress with provided options
    NProgress.configure({
      showSpinner: options.showSpinner ?? false,
      minimum: options.minimum ?? 0.1,
      easing: options.easing ?? 'ease',
      speed: options.speed ?? 200,
      trickle: options.trickle ?? true,
      trickleSpeed: options.trickleSpeed ?? 200,
    });

    return () => {
      // Cleanup
      NProgress.done();
    };
  }, [options]);

  // Detect route changes using pathname and searchParams
  useEffect(() => {
    const currentUrl =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    // Check if URL actually changed
    if (previousPath.current !== currentUrl) {
      // Start progress when URL changes
      if (!isNavigating.current) {
        isNavigating.current = true;
        NProgress.start();

        // Complete progress after a short delay to simulate route loading
        const timer = setTimeout(() => {
          isNavigating.current = false;
          NProgress.done();
        }, 300);

        // Update previous path
        previousPath.current = currentUrl;

        return () => clearTimeout(timer);
      }
    }
  }, [pathname, searchParams]);

  // Manual progress control functions
  const start = () => {
    NProgress.start();
  };

  const done = () => {
    NProgress.done();
  };

  const inc = (amount?: number) => {
    NProgress.inc(amount);
  };

  const configure = (newOptions: ProgressOptions) => {
    NProgress.configure(newOptions);
  };

  return {
    start,
    done,
    inc,
    configure,
    isNavigating: isNavigating.current,
  };
};

export default useProgress;
