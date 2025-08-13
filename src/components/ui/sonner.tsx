'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

interface ToasterProps extends React.ComponentProps<typeof Sonner> {}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme: nextTheme = 'system' } = useTheme();

  // Ensure theme is one of the allowed values for Sonner
  const sonnerTheme: 'system' | 'light' | 'dark' =
    nextTheme === 'light' || nextTheme === 'dark' ? nextTheme : 'system';

  return (
    <Sonner
      theme={sonnerTheme}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
