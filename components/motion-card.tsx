'use client';

import { motion } from 'framer-motion';
import { PropsWithChildren } from 'react';

export function MotionCard({ children }: PropsWithChildren) {
  return (
    <motion.div
      whileHover={{ rotate: 0.5, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="paper-card"
    >
      {children}
    </motion.div>
  );
}
