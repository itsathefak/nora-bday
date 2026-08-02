"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AmbientHearts({
  count = 58,
  opacityScale = 1,
}: {
  count?: number;
  opacityScale?: number;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  const hearts = Array.from({ length: count }, (_, index) => ({
    left: 2 + ((index * 29) % 96),
    top: 2 + ((index * 41) % 96),
    size: 18 + ((index * 7) % 30),
    delay: index * 0.18,
    duration: 7 + (index % 7),
    opacity: (0.1 + ((index % 5) * 0.032)) * opacityScale,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {hearts.map((heart, index) => (
        <motion.span
          key={index}
          className="absolute font-serif text-pink-200 drop-shadow-[0_0_18px_rgba(244,114,182,0.28)]"
          style={{
            left: `${heart.left}%`,
            top: `${heart.top}%`,
            fontSize: `${heart.size}px`,
          }}
          animate={{
            x: [0, index % 2 ? 14 : -12, 0],
            y: [0, -28 - (index % 4) * 6, 0],
            opacity: [heart.opacity * 0.45, heart.opacity, heart.opacity * 0.45],
            rotate: [index % 2 ? -7 : 6, index % 2 ? 7 : -6, index % 2 ? -7 : 6],
            scale: [0.88, 1.12, 0.88],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          ♥
        </motion.span>
      ))}
    </div>
  );
}
