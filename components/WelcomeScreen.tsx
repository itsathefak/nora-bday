"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { FloatingObjects } from "./FloatingObjects";
import { FloatingParticles } from "./FloatingParticles";
import { PawPrints } from "./PawPrints";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const [isHoveringFooter, setIsHoveringFooter] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 via-black to-black" />

      {/* Film grain effect */}
      <div
        className="absolute inset-0 opacity-5 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/%3E%3C/filter%3E%3Crect width="400" height="400" fill="white" filter="url(%23noiseFilter)"/%3E%3C/svg%3E")',
          backgroundSize: "400px 400px",
        }}
      />

      {/* Subtle red glow behind title */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating background elements */}
      <FloatingParticles />
      <PawPrints />
      <FloatingObjects />

      {/* Content */}
      <div className="relative z-10 max-w-3xl space-y-10 px-6 text-center">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="space-y-8"
        >
          <h1 className="text-6xl font-bold leading-tight sm:text-7xl">
            Welcome to
            <br />
            <span className="text-red-600">Nora</span>
            <span className="text-white">Flix</span>
          </h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-base leading-8 text-slate-200 whitespace-pre-line"
          >
            {`Happy Birthday, Nora bb ❤️\n\nA little place I built just for you. Every memory, every laugh, every adventure, and every tiny moment we've shared has found its home here. So grab some snacks, get comfy, and let's relive our favorite story together.`}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <motion.button
            type="button"
            onClick={onGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-4 text-base font-semibold text-white shadow-xl shadow-red-900/40 transition duration-300 hover:shadow-2xl hover:shadow-red-900/60"
          >
            Get Started
          </motion.button>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="absolute bottom-8 text-center"
        onMouseEnter={() => setIsHoveringFooter(true)}
        onMouseLeave={() => setIsHoveringFooter(false)}
      >
        <motion.p
          animate={{ opacity: isHoveringFooter ? 1 : 0.5 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-slate-400 cursor-default"
        >
          {isHoveringFooter
            ? "Made with ❤️, late nights, and way too much overthinking."
            : "Made with ❤️ by Atna"}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
