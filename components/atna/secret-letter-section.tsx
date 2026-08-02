"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { AmbientHearts } from "./ambient-hearts";
import { EmotionalLetterModal } from "./emotional-letter-modal";
import { SealedEnvelope } from "./sealed-envelope";
import { UnlockJourney } from "./unlock-journey";

function Dust() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-[#e8d9bd]"
          style={{ left: `${(index * 37) % 100}%`, top: `${15 + ((index * 29) % 75)}%` }}
          animate={{ y: [0, -35, 0], x: [0, index % 2 ? 10 : -8, 0], opacity: [0.05, 0.45, 0.05] }}
          transition={{ duration: 7 + (index % 5), delay: index * 0.35, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export function SecretLetterSection() {
  const [locks, setLocks] = useState(0);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const unlockNext = () => {
    const next = Math.min(3, locks + 1);
    setLocks(next);

    if (next === 3) {
      setJourneyOpen(false);
      setRevealing(true);
      window.setTimeout(() => {
        setRevealing(false);
        setLetterOpen(true);
      }, 1500);
    }
  };

  const startOrOpen = () => {
    if (locks === 3) {
      setLetterOpen(true);
    } else {
      setJourneyOpen(true);
    }
  };

  return (
    <section className="relative isolate min-h-[900px] overflow-hidden border-t border-red-950/30 bg-[#030202] px-5 py-28 text-center sm:py-36">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[650px] w-[850px] max-w-[110vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-950/20 blur-[110px]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.055] [background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 180 180%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%22.8%22 numOctaves=%223%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%22.8%22/%3E%3C/svg%3E')]" />
      <div className="pointer-events-none absolute inset-0 z-0">
        <AmbientHearts count={30} opacityScale={0.65} />
      </div>
      <Dust />

      <div className="relative z-10 mx-auto max-w-3xl">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-semibold uppercase tracking-[0.42em] text-red-300/55">Private correspondence</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="mt-5 font-serif text-4xl leading-tight text-[#f2e9d8] sm:text-5xl md:text-6xl">Something I Couldn’t Say Out Loud</motion.h2>
        <p className="mt-5 text-base text-slate-400 sm:text-lg">This letter has been waiting for the right moment.</p>
        <p className="mt-2 text-sm text-slate-600">Three memories stand between you and what is inside.</p>

        <div className="relative mx-auto mt-20 pb-6">
          <AnimatePresence mode="wait">
            <motion.div key={revealing ? "revealing" : locks === 3 ? "open" : "sealed"} initial={{ opacity: 0, scale: 0.94 }} animate={revealing ? { opacity: [1, 0.7, 1], scale: [1, 1.08, 1.02], y: [0, -12, -4] } : { opacity: 1, scale: 1 }} transition={{ duration: revealing ? 1.35 : 0.6 }}>
              <SealedEnvelope unlocked={locks === 3 || revealing} />
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-8 font-serif text-sm italic tracking-wide text-[#a99573]">For Nora — open when you’re ready</p>

        <div className="mt-8 flex justify-center gap-5" aria-label={`${locks} of 3 locks opened`}>
          {[0, 1, 2].map((lock) => (
            <motion.span key={lock} animate={lock < locks ? { scale: [1, 1.3, 1], color: "#fca5a5" } : { scale: 1 }} className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm ${lock < locks ? "border-red-300/35 bg-red-950/40 text-red-200 shadow-[0_0_18px_rgba(185,28,28,.22)]" : "border-white/10 bg-white/[0.025] text-slate-600"}`}>
              {lock < locks ? "✓" : "⌾"}
            </motion.span>
          ))}
        </div>

        <motion.button whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.98 }} onClick={startOrOpen} disabled={revealing} className="mt-10 rounded-full border border-[#d1b77e]/25 bg-[#e7d5af] px-8 py-4 text-sm font-bold text-[#1c140c] shadow-[0_12px_40px_rgba(125,75,25,.16)] transition hover:bg-[#f0dfba] disabled:cursor-wait disabled:opacity-60">
          {revealing ? "Opening…" : locks === 3 ? "✉ Read the Letter" : "🔒 Unlock the Letter"}
        </motion.button>
        <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-600">{locks} of 3 locks opened</p>
      </div>

      <UnlockJourney open={journeyOpen} completedLocks={locks} onClose={() => setJourneyOpen(false)} onUnlock={unlockNext} />
      <EmotionalLetterModal open={letterOpen} onClose={() => setLetterOpen(false)} />
    </section>
  );
}
