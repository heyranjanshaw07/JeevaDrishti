/**
 * JeevaDrishti Global Motion System
 * Standardized Framer Motion variants, easing curves, and durations.
 * Adheres strictly to scientific minimalism and accessibility (prefers-reduced-motion).
 */

export const DURATION = {
  micro: 0.18,     // 150–220ms for button hover, tooltip, icons
  normal: 0.32,    // 250–400ms for tabs, modals, accordions
  section: 0.55,   // 450–700ms for section reveals and scroll intros
  cinematic: 1.1,  // 800–1500ms for atmospheric pulses and signal travel
};

export const EASING = {
  smooth: [0.16, 1, 0.3, 1],       // Primary graceful ease-out
  snappy: [0.25, 1, 0.5, 1],       // For responsive interactive controls
  linear: 'linear',
  easeInOut: [0.4, 0, 0.2, 1],
};

// ─── Standard Animation Variants ─────────────────────────────────────────────

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION.normal, ease: EASING.smooth } },
  exit: { opacity: 0, transition: { duration: DURATION.micro, ease: EASING.smooth } },
};

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.section, ease: EASING.smooth } },
  exit: { opacity: 0, y: -10, transition: { duration: DURATION.normal, ease: EASING.smooth } },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: DURATION.normal, ease: EASING.smooth } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: DURATION.micro, ease: EASING.smooth } },
};

export const slideIn = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0, transition: { duration: DURATION.normal, ease: EASING.smooth } },
  exit: { opacity: 0, x: 16, transition: { duration: DURATION.micro, ease: EASING.smooth } },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASING.smooth },
  },
};

// ─── Interactive Micro-Interaction Variants ──────────────────────────────────

export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -3,
    scale: 1.012,
    transition: { duration: DURATION.micro, ease: EASING.smooth },
  },
};

export const buttonMotion = {
  rest: { scale: 1, y: 0 },
  hover: { y: -1, transition: { duration: DURATION.micro, ease: EASING.smooth } },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

// ─── Page Entrance Wrapper Variant ───────────────────────────────────────────

export const pageEntrance = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.section,
      ease: EASING.smooth,
      staggerChildren: 0.1,
    },
  },
  exit: { opacity: 0, transition: { duration: DURATION.micro } },
};
