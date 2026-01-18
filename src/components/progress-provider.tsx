'use client';

import { ProgressBar } from '@/components/ui/progress-bar';
import { useProgress } from '@/hooks/useProgress';

export const ProgressProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Initialize progress with router events
  useProgress({
    showSpinner: false,
    minimum: 0.1,
    speed: 200,
    trickle: true,
    trickleSpeed: 200,
  });

  return (
    <>
      <ProgressBar />
      {children}
    </>
  );
};

export default ProgressProvider;
