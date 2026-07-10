"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// only use paw icon
const ICONS = ["🐾"];

interface DriftItem {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  icon: string;
}

export function FloatingParticles() {
  const [items, setItems] = useState<DriftItem[]>([]);

  useEffect(() => {
    // fewer, larger, slower drifting items
    const generated = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: 6 + Math.random() * 88,
      top: 8 + Math.random() * 80,
      // slightly larger paws
      size: 36 + Math.random() * 44,
      delay: Math.random() * 6,
      // longer duration for slow premium drift
      duration: 18 + Math.random() * 14,
      icon: ICONS[0],
    }));

    setItems(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((it) => (
        <motion.div
          key={it.id}
          style={{
            left: `${it.left}%`,
            top: `${it.top}%`,
            fontSize: `${it.size}px`,
            position: "absolute",
            opacity: 0.28,
          }}
          initial={{ opacity: 0, y: 6, rotate: -4 }}
          animate={{
            opacity: [0, 0.28, 0.12],
            y: [0, -12 + Math.random() * -36, -6],
            x: [0, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 8],
            rotate: [0, (Math.random() - 0.5) * 8, -2],
          }}
          transition={{
            duration: it.duration,
            delay: it.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {it.icon}
        </motion.div>
      ))}
    </div>
  );
}
