'use client';
import { cn } from '@/lib/utils';
import {
  AnimatePresence,
  motion,
  Variants,
  Transition,
  TargetAndTransition,
} from 'motion/react'; // Added Variants, Transition, TargetAndTransition
import React from 'react';

// Type definitions for motion variants
type MotionVariant = {
  hidden?: TargetAndTransition;
  visible?: TargetAndTransition;
  exit?: TargetAndTransition;
};

type PresetVariantKey = keyof typeof presetVariants;

const defaultStaggerTimes: Record<'char' | 'word' | 'line', number> = {
  char: 0.03,
  word: 0.05,
  line: 0.1,
};

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
  exit: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
  },
  exit: { opacity: 0 },
};

const presetVariants: Record<string, { container: Variants; item: Variants }> =
  {
    blur: {
      container: defaultContainerVariants,
      item: {
        hidden: { opacity: 0, filter: 'blur(12px)' },
        visible: { opacity: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, filter: 'blur(12px)' },
      },
    },
    'fade-in-blur': {
      container: defaultContainerVariants,
      item: {
        hidden: { opacity: 0, y: 20, filter: 'blur(12px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, y: 20, filter: 'blur(12px)' },
      },
    },
    scale: {
      container: defaultContainerVariants,
      item: {
        hidden: { opacity: 0, scale: 0 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0 },
      },
    },
    fade: {
      container: defaultContainerVariants,
      item: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      },
    },
    slide: {
      container: defaultContainerVariants,
      item: {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
      },
    },
  };

interface AnimationComponentProps {
  segment: string;
  variants: Variants;
  per: 'char' | 'word' | 'line';
  segmentWrapperClassName?: string;
}

const AnimationComponent = React.memo(
  ({
    segment,
    variants,
    per,
    segmentWrapperClassName,
  }: AnimationComponentProps) => {
    const content =
      per === 'line' ? (
        <motion.span variants={variants} className="block">
          {segment}
        </motion.span>
      ) : per === 'word' ? (
        <motion.span
          aria-hidden="true"
          variants={variants}
          className="inline-block whitespace-pre"
        >
          {segment}
        </motion.span>
      ) : (
        <motion.span className="inline-block whitespace-pre">
          {segment.split('').map((char, charIndex) => (
            <motion.span
              key={`char-${charIndex}`}
              aria-hidden="true"
              variants={variants}
              className="inline-block whitespace-pre"
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      );

    if (!segmentWrapperClassName) {
      return content;
    }

    const defaultWrapperClassName = per === 'line' ? 'block' : 'inline-block';

    return (
      <span className={cn(defaultWrapperClassName, segmentWrapperClassName)}>
        {content}
      </span>
    );
  }
);

AnimationComponent.displayName = 'AnimationComponent';

const splitText = (
  text: React.ReactNode,
  per: 'line' | 'word' | 'char'
): string[] => {
  if (typeof text !== 'string') return []; // Handle non-string children
  if (per === 'line') return text.split('\n');
  return text.split(/(\s+)/);
};

const hasTransition = (
  variant: Variants | TargetAndTransition | undefined
): boolean => {
  if (!variant) return false;
  return typeof variant === 'object' && 'transition' in variant;
};

const createVariantsWithTransition = (
  baseVariants: Variants,
  transitionProps?: Transition
): Variants => {
  if (!transitionProps) return baseVariants;

  const newVariants: Variants = { ...baseVariants };

  if (newVariants.visible) {
    newVariants.visible = {
      ...newVariants.visible,
      transition: {
        ...((newVariants.visible as TargetAndTransition).transition || {}),
        ...transitionProps,
      },
    };
  }

  if (newVariants.exit) {
    newVariants.exit = {
      ...newVariants.exit,
      transition: {
        ...((newVariants.exit as TargetAndTransition).transition || {}),
        ...transitionProps,
        staggerDirection: -1,
      },
    };
  }

  return newVariants;
};

interface TextEffectProps {
  children: React.ReactNode;
  per?: 'char' | 'word' | 'line';
  as?: keyof typeof motion;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  className?: string;
  preset?: PresetVariantKey;
  delay?: number;
  speedReveal?: number;
  speedSegment?: number;
  trigger?: boolean;
  onAnimationComplete?: (definition: string | number) => void;
  onAnimationStart?: (definition: string | number) => void;
  segmentWrapperClassName?: string;
  containerTransition?: Transition;
  segmentTransition?: Transition;
  style?: React.CSSProperties;
}

export function TextEffect({
  children,
  per = 'word',
  as = 'p',
  variants,
  className,
  preset = 'fade',
  delay = 0,
  speedReveal = 1,
  speedSegment = 1,
  trigger = true,
  onAnimationComplete,
  onAnimationStart,
  segmentWrapperClassName,
  containerTransition,
  segmentTransition,
  style,
}: TextEffectProps) {
  const segments = splitText(children, per);
  const MotionTag: React.ComponentType<any> = motion[as];

  const baseVariants = preset
    ? presetVariants[preset]
    : { container: defaultContainerVariants, item: defaultItemVariants };

  const stagger = defaultStaggerTimes[per] / speedReveal;

  const baseDuration = 0.3 / speedSegment;

  const customStagger = hasTransition(
    variants?.container?.visible as TargetAndTransition | undefined
  )
    ? (variants?.container?.visible as any).transition?.staggerChildren
    : undefined;

  const customDelay = hasTransition(
    variants?.container?.visible as TargetAndTransition | undefined
  )
    ? (variants?.container?.visible as any).transition?.delayChildren
    : undefined;

  const computedVariants = {
    container: {
      ...createVariantsWithTransition(
        variants?.container || baseVariants.container,
        {
          staggerChildren: customStagger ?? stagger,
          delayChildren: customDelay ?? delay,
          ...containerTransition,
        }
      ),
      exit: {
        // This is the exit variant, not a transition property
        staggerChildren: customStagger ?? stagger,
        staggerDirection: -1,
      },
    },
    item: createVariantsWithTransition(variants?.item || baseVariants.item, {
      duration: baseDuration,
      ...segmentTransition,
    }),
  };

  return (
    <AnimatePresence mode="popLayout">
      {trigger && (
        <MotionTag
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={computedVariants.container}
          className={className}
          onAnimationComplete={onAnimationComplete}
          onAnimationStart={onAnimationStart}
          style={style}
        >
          {per !== 'line' ? <span className="sr-only">{children}</span> : null}
          {segments.map((segment, index) => (
            <AnimationComponent
              key={`${per}-${index}-${segment}`}
              segment={segment}
              variants={computedVariants.item}
              per={per}
              segmentWrapperClassName={segmentWrapperClassName}
            />
          ))}
        </MotionTag>
      )}
    </AnimatePresence>
  );
}
