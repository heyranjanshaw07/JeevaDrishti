/**
 * Aurora Vision Lab — Global Animation Variants (Framer Motion)
 * Reusable transitions, page animations, subtle card movement, and fade/slide effects.
 */

// Smooth Page Transitions
export const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 8,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: 'blur(4px)',
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

// Fade in up animation
export const fadeInUpVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } 
  },
}

// Subtle card hover effect
export const subtleCardHover = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.005,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
}

// Stagger container for list/grid items
export const staggerContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

// Subtle micro pulse for live telemetry indicators
export const telemetryPulseVariants = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2.4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}
