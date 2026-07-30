"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { HEART_PING_PEOPLE, type HeartPingSender } from "../../lib/heart-ping/types";
import { HeartPingHistory } from "./heart-ping-history";
import { HeartPingModal } from "./heart-ping-modal";
import { HeartPingSenderCard } from "./heart-ping-sender-card";

function AmbientHearts() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  const hearts = Array.from({ length: 34 }, (_, index) => ({
    left: 3 + ((index * 29) % 94),
    top: 4 + ((index * 41) % 92),
    size: 20 + ((index * 7) % 26),
    delay: index * 0.22,
    duration: 6.5 + (index % 6),
    opacity: 0.12 + ((index % 5) * 0.035),
  }));

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
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

export function HeartPingSection() {
  const [selectedSender, setSelectedSender] = useState<HeartPingSender | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  return (
    <section className="relative isolate overflow-hidden border-t border-red-950/30 bg-[#050202] px-5 py-28 text-white sm:py-36">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_25%_18%,rgba(159,18,57,0.28),transparent_28%),radial-gradient(circle_at_78%_28%,rgba(244,114,182,0.18),transparent_26%),linear-gradient(to_bottom,#050202,#090303_40%,#020101)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.055] [background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 180 180%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%22.9%22 numOctaves=%223%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%22.8%22/%3E%3C/svg%3E')]" />
      <AmbientHearts />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-pink-200/55">Heart Ping</p>
          <h2 className="mt-5 font-serif text-4xl leading-tight text-[#f5ead7] sm:text-5xl md:text-6xl">A Little Signal, Whenever We Need It</h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">For the days when words feel far away, but we still want the other person to know.</p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-500">Choose who is sending the ping. Pick what you want to say. We’ll deliver a small reminder that you’re thinking of each other.</p>
          <p className="mx-auto mt-5 max-w-xl rounded-full border border-white/10 bg-white/[0.035] px-4 py-3 text-xs leading-relaxed text-slate-500">Heart Ping sends a personal email and is not an emergency or instant-response service.</p>
        </motion.div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
          <HeartPingSenderCard
            sender="atna"
            title="Ping Nora"
            label="From Atna"
            image={HEART_PING_PEOPLE.nora.image}
            onSelect={() => setSelectedSender("atna")}
          />
          <HeartPingSenderCard
            sender="nora"
            title="Ping Atna"
            label="From Nora"
            image={HEART_PING_PEOPLE.atna.image}
            onSelect={() => setSelectedSender("nora")}
          />
        </div>

        <HeartPingHistory refreshKey={historyRefreshKey} />

        <div className="mx-auto mt-16 max-w-3xl text-center">
          <p className="font-serif text-2xl leading-relaxed text-[#f1d8c8]">Even on the heavy days, remind me why we keep choosing tomorrow.</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-500">No fixing. No pressure. Just a small reminder that neither of us has to carry every difficult day alone.</p>
        </div>
      </div>

      <HeartPingModal
        sender={selectedSender}
        open={!!selectedSender}
        onClose={() => setSelectedSender(null)}
        onSaved={() => setHistoryRefreshKey((current) => current + 1)}
      />
    </section>
  );
}
