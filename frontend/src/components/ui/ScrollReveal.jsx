import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp, DURATION, EASING } from '@/lib/motion';

/**
 * Reusable ScrollReveal component
 * Animates into view once with subtle opacity + translateY.
 * Respects prefers-reduced-motion automatically.
 */
export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  yOffset = 18,
  duration = DURATION.section,
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration, delay, ease: EASING.smooth }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
