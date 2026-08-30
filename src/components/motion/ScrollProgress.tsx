"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/**
 * A hairline of brand red along the bottom of the nav rail that fills as you read.
 *
 * `useScroll` writes to a motion value rather than React state, so scrolling
 * never re-renders the tree. The spring smooths the raw progress so it flows
 * rather than snapping — the one place the "liquid" idea is literal.
 */
export function ScrollProgress() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const width = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-px origin-left
                 bg-gradient-to-r from-brand-500 via-brand-300 to-gold-300"
      style={{ scaleX: reduced ? scrollYProgress : width }}
    />
  );
}
