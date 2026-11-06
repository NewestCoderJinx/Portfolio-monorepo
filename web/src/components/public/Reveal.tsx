import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  children: ReactNode;
  /** Seconds to wait before animating, for staggering siblings. */
  delay?: number;
}

/** Fades and lifts its content in the first time it scrolls into view. Skipped when the visitor prefers reduced motion. */
export function Reveal({ children, delay = 0 }: Props) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      // Fill grid cells so cards in a row stay the same height.
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
