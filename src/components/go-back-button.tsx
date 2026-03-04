'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface GoBackButtonProps {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children: React.ReactNode;
}

/**
 * Client component for "Go Back" button functionality
 * Uses Next.js router for navigation
 */
export function GoBackButton({
  variant = 'outline',
  size = 'default',
  className = '',
  children,
}: GoBackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => router.back()}
    >
      {children}
    </Button>
  );
}
