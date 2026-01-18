'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

import NProgress from 'nprogress';

interface ProgressBarProps {
  color?: string;
  height?: string;
  showSpinner?: boolean;
  minimum?: number;
  easing?: string;
  speed?: number;
  trickle?: boolean;
  trickleSpeed?: number;
}

export const ProgressBar = ({
  color,
  height = '2px',
  showSpinner = false,
  minimum = 0.1,
  easing = 'ease',
  speed = 200,
  trickle = true,
  trickleSpeed = 200,
}: ProgressBarProps) => {
  const { theme } = useTheme();

  useEffect(() => {
    // Configure NProgress
    NProgress.configure({
      minimum,
      easing,
      speed,
      showSpinner,
      trickle,
      trickleSpeed,
    });

    // Set custom color based on theme using CSS variables
    const progressBarColor = color || 'var(--primary)';

    // Create and inject custom styles
    const style = document.createElement('style');
    style.id = 'nprogress-custom';
    style.textContent = `
      #nprogress {
        pointer-events: none;
        z-index: 9999;
      }
      
      #nprogress .bar {
        background: ${progressBarColor};
        height: ${height};
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 9999;
      }
      
      #nprogress .peg {
        display: block;
        position: absolute;
        right: 0px;
        width: 100px;
        height: 100%;
        box-shadow: 0 0 10px ${progressBarColor}, 0 0 5px ${progressBarColor};
        opacity: 1.0;
        transform: rotate(3deg) translate(0px, -4px);
      }
      
      #nprogress .spinner {
        display: block;
        position: fixed;
        z-index: 9999;
        top: 15px;
        right: 15px;
      }
      
      #nprogress .spinner-icon {
        width: 18px;
        height: 18px;
        box-sizing: border-box;
        border: solid 2px transparent;
        border-top-color: ${progressBarColor};
        border-left-color: ${progressBarColor};
        border-radius: 50%;
        animation: nprogress-spinner 400ms linear infinite;
      }
      
      @keyframes nprogress-spinner {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    // Remove existing custom styles if any
    const existingStyle = document.getElementById('nprogress-custom');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new styles
    document.head.appendChild(style);

    // Cleanup
    return () => {
      const styleElement = document.getElementById('nprogress-custom');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [
    theme,
    color,
    height,
    showSpinner,
    minimum,
    easing,
    speed,
    trickle,
    trickleSpeed,
  ]);

  // This component doesn't render anything visible
  // It just manages the NProgress configuration
  return null;
};

export default ProgressBar;
