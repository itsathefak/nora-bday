"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface FloatingObject {
  id: number;
  left: number;
  delay: number;
  emoji: string;
  size: number;
}

// only paw emoji for consistency
const EMOJIS = ["🐾"];

export function FloatingObjects() {
  const [objects, setObjects] = useState<FloatingObject[]>([]);

  useEffect(() => {
    setObjects(
      Array.from({ length: 4 }, (_, i) => ({
        id: i,
        left: Math.random() * 78 + 8,
        delay: Math.random() * 8,
        // larger paw objects
        emoji: EMOJIS[0],
        size: 28 + Math.random() * 44,
      })),
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {objects.map((obj) => (
        <motion.div
          key={obj.id}
          style={{
            left: `${obj.left}%`,
            bottom: 0,
            fontSize: `${obj.size}px`,
            position: "absolute",
            opacity: 0.2,
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{
            opacity: [0, 0.36, 0],
            y: [-8, -140, -60],
            x: [-10, 8, -6],
          }}
          transition={{
            duration: 12 + Math.random() * 8,
            delay: obj.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {obj.emoji}
        </motion.div>
      ))}
    </div>
  );
}
