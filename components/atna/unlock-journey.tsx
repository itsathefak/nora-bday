"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const rounds = [
  {
    eyebrow: "First lock · The key",
    title: "Some doors only open when we choose to stay.",
    instruction: "Press and hold the key until the mechanism turns.",
    action: "Hold the key",
  },
  {
    eyebrow: "Second lock · The memory",
    title: "A memory becomes precious when we return to it.",
    instruction: "Follow the three lights in order, slowly.",
    action: "Begin the memory",
  },
  {
    eyebrow: "Final lock · The seal",
    title: "The last lock was never made of metal.",
    instruction: "Place your hand on the seal and hold it there.",
    action: "Hold the seal",
  },
];

export function UnlockJourney({
  open,
  completedLocks,
  onClose,
  onUnlock,
}: {
  open: boolean;
  completedLocks: number;
  onClose: () => void;
  onUnlock: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [memoryStep, setMemoryStep] = useState(-1);
  const holdTimer = useRef<number | null>(null);
  const progressTimer = useRef<number | null>(null);
  const round = rounds[Math.min(completedLocks, 2)];

  const clearHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (progressTimer.current) window.clearInterval(progressTimer.current);
    holdTimer.current = null;
    progressTimer.current = null;
    setProgress(0);
  };

  const completeRound = () => {
    clearHold();
    onUnlock();
  };

  const beginHold = () => {
    if (completedLocks === 1) return;
    const startedAt = Date.now();
    progressTimer.current = window.setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - startedAt) / 1600) * 100));
    }, 30);
    holdTimer.current = window.setTimeout(completeRound, 1600);
  };

  const beginMemory = () => {
    if (memoryStep >= 0) return;
    setMemoryStep(0);
  };

  useEffect(() => {
    if (!open) {
      clearHold();
      setMemoryStep(-1);
    }
    return clearHold;
  }, [open, completedLocks]);

  useEffect(() => {
    if (memoryStep < 0 || memoryStep >= 3) return;
    const timeout = window.setTimeout(() => {
      if (memoryStep === 2) {
        setMemoryStep(3);
        window.setTimeout(completeRound, 450);
      } else {
        setMemoryStep((current) => current + 1);
      }
    }, 720);
    return () => window.clearTimeout(timeout);
  }, [memoryStep]);

  if (!open || completedLocks >= 3) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[130] flex items-center justify-center bg-black/88 px-5 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Unlock round ${completedLocks + 1}`}
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-red-200/10 bg-[#100b0b] p-8 text-center shadow-[0_35px_100px_rgba(70,0,0,.42)] md:p-12"
        >
          <button onClick={onClose} className="absolute right-5 top-5 h-10 w-10 rounded-full border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white" aria-label="Close unlocking journey">×</button>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-red-300/70">{round.eyebrow}</p>
          <h3 className="mx-auto mt-5 max-w-md font-serif text-3xl leading-tight text-[#f4ead7] md:text-4xl">{round.title}</h3>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-400">{round.instruction}</p>

          {completedLocks === 1 ? (
            <div className="mt-10">
              <div className="mx-auto flex max-w-xs items-center justify-between">
                {[0, 1, 2].map((step) => (
                  <motion.span
                    key={step}
                    animate={memoryStep === step ? { scale: [1, 1.5, 1], opacity: [0.3, 1, 0.45] } : { scale: 1, opacity: memoryStep > step ? 0.8 : 0.25 }}
                    transition={{ duration: 0.65 }}
                    className="h-3 w-3 rounded-full bg-red-300 shadow-[0_0_18px_rgba(248,113,113,.8)]"
                  />
                ))}
              </div>
              <div className="mx-auto -mt-[7px] h-px max-w-[15rem] bg-gradient-to-r from-transparent via-red-300/30 to-transparent" />
              <button onClick={beginMemory} disabled={memoryStep >= 0} className="mt-10 rounded-full border border-[#cbb88f]/30 bg-[#cbb88f]/10 px-7 py-3 text-sm font-semibold text-[#ead9b4] transition hover:bg-[#cbb88f]/15 disabled:cursor-default disabled:opacity-60">{memoryStep >= 0 ? "Remembering…" : round.action}</button>
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center">
              <motion.button
                onPointerDown={beginHold}
                onPointerUp={clearHold}
                onPointerLeave={clearHold}
                onPointerCancel={clearHold}
                whileTap={{ scale: 0.96 }}
                className={`relative flex h-28 w-28 touch-none select-none items-center justify-center rounded-full border text-4xl ${completedLocks === 2 ? "border-red-300/30 bg-[radial-gradient(circle,#a52d2d,#4d0909)] shadow-[0_0_35px_rgba(185,28,28,.3)]" : "border-[#c9ab70]/30 bg-[#17120b] text-[#c9ab70]"}`}
                aria-label={round.action}
              >
                <span className="absolute inset-2 rounded-full border border-white/5" />
                <span className="relative z-10">{completedLocks === 2 ? "A" : "⚿"}</span>
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 112 112" aria-hidden="true">
                  <circle cx="56" cy="56" r="53" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="2" />
                  <circle cx="56" cy="56" r="53" fill="none" stroke={completedLocks === 2 ? "#fca5a5" : "#d5b477"} strokeWidth="2" strokeLinecap="round" pathLength="100" strokeDasharray={`${progress} 100`} />
                </svg>
              </motion.button>
              <span className="mt-5 text-xs uppercase tracking-[0.24em] text-slate-500">{round.action}</span>
            </div>
          )}

          <div className="mt-10 flex justify-center gap-2">
            {[0, 1, 2].map((lock) => <span key={lock} className={`h-1 w-10 rounded-full ${lock < completedLocks ? "bg-red-400" : "bg-white/10"}`} />)}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
