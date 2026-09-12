import React, { useState, useEffect, useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * AnimatedNumber
 * Smoothly interpolates numeric values when entering the viewport.
 * If value contains '—' or is non-numeric, displays statically without animation.
 */
export default function AnimatedNumber({ value, duration = 1.2, className = '' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const shouldReduceMotion = useReducedMotion();

  // Determine if value is a valid number
  const stringVal = String(value || '').trim();
  const isNumeric = /^[0-9,]+$/.test(stringVal);
  const numericTarget = isNumeric ? parseInt(stringVal.replace(/,/g, ''), 10) : null;

  useEffect(() => {
    if (!isInView || numericTarget === null || isNaN(numericTarget)) {
      return;
    }

    if (shouldReduceMotion) {
      setDisplayValue(numericTarget);
      return;
    }

    let startTime = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(ease * numericTarget);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(numericTarget);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isInView, numericTarget, duration, shouldReduceMotion]);

  if (!isNumeric || numericTarget === null || isNaN(numericTarget)) {
    return <span ref={ref} className={className}>{stringVal || '—'}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {isInView ? displayValue.toLocaleString() : '0'}
    </span>
  );
}
