"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-white"
    >
      <div className="space-y-3 text-center">
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="mx-auto h-12 w-12 rounded-full border-4 border-accent"
        />
        <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
          Loading NoraFlix
        </p>
      </div>
    </motion.div>
  );
}
