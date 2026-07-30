"use client";

import { motion } from "framer-motion";

export function HeartPingSuccess({
  onDone,
  onSendAnother,
}: {
  onDone: () => void;
  onSendAnother: () => void;
}) {
  return (
    <div className="px-2 py-10 text-center" aria-live="polite">
      <motion.div
        initial={{ scale: 0.86, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-pink-200/30 bg-pink-100/10 text-5xl shadow-[0_0_48px_rgba(244,114,182,0.18)]"
      >
        ❤️
      </motion.div>
      <h3 className="mt-7 text-3xl font-black text-white">Your Heart Ping is on its way ❤️</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
        They may not see it immediately, but they’ll know you reached out.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={onDone} className="min-h-11 rounded-full bg-white px-6 py-3 font-black text-black transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/25">
          Done
        </button>
        <button type="button" onClick={onSendAnother} className="min-h-11 rounded-full border border-white/10 bg-white/[0.06] px-6 py-3 font-black text-white transition hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/25">
          Send Another
        </button>
      </div>
    </div>
  );
}
