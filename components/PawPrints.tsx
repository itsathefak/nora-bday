"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface PawPrint {
  id: number;
  left: number;
  top: number;
  delay: number;
  size: number;
  icon: string;
}

const PAW_ICONS = ["🐾"];

export function PawPrints() {
  const [paws, setPaws] = useState<PawPrint[]>([]);

  useEffect(() => {
    setPaws(
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        left: Math.random() * 90,
        top: 12 + Math.random() * 76,
        delay: Math.random() * 8,
        // slightly larger paw prints
        size: 32 + Math.random() * 36,
        icon: PAW_ICONS[0],
      })),
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {paws.map((paw) => (
        <motion.div
          key={paw.id}
          style={{
            left: `${paw.left}%`,
            top: `${paw.top}%`,
            fontSize: `${paw.size}px`,
            position: "absolute",
            opacity: 0.62,
            color: "rgba(255,255,255,0.96)",
            textShadow: "0 0 18px rgba(255,255,255,0.24)",
          }}
          initial={{ opacity: 0, x: -12, rotate: -8 }}
          animate={{
            opacity: [0, 0.62, 0],
            x: [0, 28, 12],
            rotate: [0, 8, -4],
          }}
          transition={{
            duration: 7 + Math.random() * 6,
            delay: paw.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {paw.icon}
        </motion.div>
      ))}
    </div>
  );
}
