"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const REQUIRED_CODES = {
  piggy: "12032024",
  atna: "18032001",
  nora: "03082002",
};

export function AtnaUnlockModal({
  open,
  onClose,
  onUnlocked,
}: {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}) {
  const [codes, setCodes] = useState({
    piggy: "",
    atna: "",
    nora: "",
  });
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  const complete = useMemo(
    () => codes.piggy.length > 0 && codes.atna.length > 0 && codes.nora.length > 0,
    [codes],
  );

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => firstInputRef.current?.focus(), 80);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !unlocking) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open, unlocking]);

  const updateCode = (key: keyof typeof codes, value: string) => {
    setCodes((current) => ({
      ...current,
      [key]: value.replace(/\D/g, "").slice(0, 8),
    }));
    setError("");
  };

  const submit = () => {
    if (unlocking) return;
    const valid =
      codes.piggy === REQUIRED_CODES.piggy &&
      codes.atna === REQUIRED_CODES.atna &&
      codes.nora === REQUIRED_CODES.nora;

    if (!valid) {
      setError("One of the love keys is not quite right.");
      return;
    }

    setUnlocking(true);
    window.setTimeout(() => {
      onUnlocked();
      setUnlocking(false);
      setCodes({ piggy: "", atna: "", nora: "" });
    }, 1650);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black/82 px-4 text-white backdrop-blur-md"
        >
          <div className="absolute left-[-8rem] top-12 h-96 w-96 rounded-full bg-red-700/25 blur-3xl" />
          <div className="absolute right-[-8rem] bottom-8 h-[28rem] w-[28rem] rounded-full bg-pink-400/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
            <motion.div
              animate={{ y: [0, -24, 0], opacity: [0.25, 0.7, 0.25] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute left-[14%] top-[22%] text-5xl"
            >
              ♥
            </motion.div>
            <motion.div
              animate={{ y: [0, 28, 0], opacity: [0.2, 0.65, 0.2] }}
              transition={{ duration: 4.8, repeat: Infinity }}
              className="absolute right-[18%] top-[30%] text-4xl"
            >
              ♡
            </motion.div>
            <motion.div
              animate={{ y: [0, -18, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 4.2, repeat: Infinity }}
              className="absolute bottom-[18%] left-[42%] text-5xl"
            >
              ♥
            </motion.div>
          </div>

          <button
            type="button"
            aria-label="Close unlock modal"
            onClick={onClose}
            disabled={unlocking}
            className="absolute inset-0 cursor-default"
          />

          <motion.section
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-[2rem] border border-red-300/20 bg-gradient-to-br from-zinc-950 via-red-950/25 to-black p-6 shadow-2xl shadow-red-950/40 md:p-8"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />

            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-red-300/20 bg-black/55 shadow-[0_0_45px_rgba(239,68,68,0.45)]">
              <motion.div
                animate={
                  unlocking
                    ? { rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] }
                    : { y: [0, -4, 0] }
                }
                transition={{
                  duration: unlocking ? 0.55 : 2.2,
                  repeat: unlocking ? 2 : Infinity,
                }}
                className="text-6xl"
              >
                {unlocking ? "💖" : "🔒"}
              </motion.div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
                Atna Profile Locked
              </p>
              <h2 className="mt-3 text-4xl font-black md:text-5xl">
                Unlock With Love
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
                Three birthday keys open this profile. Piggy, Atna, and Nora bb
                all have to agree.
              </p>
            </div>

            <div className="mt-7 grid gap-3">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Piggy birthday
                </span>
                <input
                  ref={firstInputRef}
                  value={codes.piggy}
                  onChange={(event) => updateCode("piggy", event.target.value)}
                  inputMode="numeric"
                  type="password"
                  placeholder="DDMMYYYY"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-4 text-center text-2xl font-black tracking-[0.35em] text-white outline-none transition focus:border-red-400 focus:bg-white/[0.12]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Atna birthday
                </span>
                <input
                  value={codes.atna}
                  onChange={(event) => updateCode("atna", event.target.value)}
                  inputMode="numeric"
                  type="password"
                  placeholder="DDMMYYYY"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-4 text-center text-2xl font-black tracking-[0.35em] text-white outline-none transition focus:border-red-400 focus:bg-white/[0.12]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Nora bb birthday
                </span>
                <input
                  value={codes.nora}
                  onChange={(event) => updateCode("nora", event.target.value)}
                  inputMode="numeric"
                  type="password"
                  placeholder="DDMMYYYY"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-4 text-center text-2xl font-black tracking-[0.35em] text-white outline-none transition focus:border-red-400 focus:bg-white/[0.12]"
                />
              </label>
            </div>

            <div className="mt-5 min-h-[24px] text-center text-sm font-bold text-red-200">
              {error}
            </div>

            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={!complete || unlocking}
                className="rounded-full bg-white px-6 py-3 font-black text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {unlocking ? "Unlocking..." : "Unlock Atna"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={unlocking}
                className="rounded-full bg-white/10 px-6 py-3 font-black text-white transition hover:bg-white/15 disabled:opacity-45"
              >
                Cancel
              </button>
            </div>

            <AnimatePresence>
              {unlocking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.4, rotate: -18 }}
                    animate={{ scale: [0.4, 1.2, 1], rotate: [-18, 8, 0] }}
                    transition={{ duration: 0.9 }}
                    className="text-center"
                  >
                    <div className="text-8xl">💘</div>
                    <p className="mt-4 text-2xl font-black text-white">
                      Love lock opened
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AtnaProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setUnlocked(false);
    setOpen(true);
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-black" aria-label="Checking Atna unlock" />
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-950/30 via-black to-black">
        <AtnaUnlockModal
          open={open}
          onClose={() => router.push("/")}
          onUnlocked={() => {
            setUnlocked(true);
            setOpen(false);
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
