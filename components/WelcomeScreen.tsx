"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FloatingObjects } from "./FloatingObjects";
import { FloatingParticles } from "./FloatingParticles";
import { PawPrints } from "./PawPrints";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const [isHoveringFooter, setIsHoveringFooter] = useState(false);
  const [isBookReplyOpen, setIsBookReplyOpen] = useState(false);

  useEffect(() => {
    if (!isBookReplyOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsBookReplyOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isBookReplyOpen]);

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
            {`Happy Birthday, Nora bb ❤️\n\nA little place I built just for uscan we convert this . Whether we're sitting beside each other or miles apart, I hope this little place always reminds you that our story is still being written. Until then, here's every chapter we've lived, every memory we've made, and every little reason I never want us to forget. So grab some snacks, get comfy, and let's relive our favorite moments together. ❤️`}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8"
        >
          <button
            type="button"
            onClick={() => setIsBookReplyOpen(true)}
            className="group inline-flex items-center justify-center gap-3 rounded-full border border-red-200/20 bg-white/[0.045] px-5 py-3 text-sm font-bold text-red-100 shadow-[0_18px_45px_rgba(127,29,29,0.25)] backdrop-blur transition hover:-translate-y-0.5 hover:border-red-200/40 hover:bg-red-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200/25 sm:text-base"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600/90 text-white shadow-lg shadow-red-900/40 transition group-hover:scale-110">
              ♥
            </span>
            Click here first
          </button>

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

      <AnimatePresence>
        {isBookReplyOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-reply-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              onClick={() => setIsBookReplyOpen(false)}
              aria-label="Close book reply"
            />

            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 18, opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.28 }}
              className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#120707] shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(248,113,113,0.14),transparent_32%),radial-gradient(circle_at_28%_76%,rgba(251,191,36,0.08),transparent_30%)]" />

              <button
                type="button"
                onClick={() => setIsBookReplyOpen(false)}
                className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-2xl leading-none text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200/25"
                aria-label="Close"
              >
                ×
              </button>

              <div className="relative z-10 grid max-h-[90vh] overflow-y-auto md:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
                <div className="bg-[#070303] p-4 sm:p-6">
                  <div className="overflow-hidden rounded-[1.4rem] border border-amber-100/15 bg-amber-50/5 shadow-2xl">
                    <img
                      src="/videos/common/atna-book.png"
                      alt="Nora's handwritten book preface"
                      className="h-full max-h-[74vh] w-full object-contain"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-center p-6 text-left sm:p-8 md:p-10">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-red-200/65">
                    A reply to your book
                  </p>
                  <h2
                    id="book-reply-title"
                    className="mt-4 font-serif text-4xl font-black leading-tight text-[#fff7ed] sm:text-5xl"
                  >
                    To the Author,
                  </h2>

                  <div className="mt-6 space-y-4 text-base leading-8 text-slate-200 sm:text-lg">
                    <p>
                      You once wrote that the greatest thing one person can give
                      to another is time.
                    </p>
                    <p>I never forgot that.</p>
                    <p>So I wanted to give some of mine back.</p>
                    <p>
                      Not only in pages.
                      <br />
                      Not only in ink.
                    </p>
                    <p>
                      But in memories, late nights, thousands of tiny details,
                      too many photos, questionable decisions, and one little
                      world built especially for you.
                    </p>
                    <div className="relative overflow-hidden rounded-2xl border border-red-200/10 bg-white/[0.025] px-4 py-4 shadow-[0_10px_32px_rgba(127,29,29,0.14)]">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40" />
                      <p className="relative font-semibold text-[#fff4e6] drop-shadow-[0_0_12px_rgba(255,244,230,0.18)]">
                        You gave me a book.
                      </p>
                      <p className="relative mt-1 font-semibold text-[#fff4e6] drop-shadow-[0_0_12px_rgba(255,244,230,0.18)]">
                        I wanted to give you a world.
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 h-px w-24 bg-gradient-to-r from-red-200/55 to-transparent" />

                  <p className="mt-6 font-serif text-2xl font-bold text-[#fff7ed] drop-shadow-[0_0_16px_rgba(255,247,237,0.16)]">
                    Welcome to NoraFlix.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
                    My reply to your book, and a home for everything I never
                    wanted us to forget.
                  </p>
                  <p className="mt-6 text-sm text-slate-500">
                    For my most amazing viewer, player, and memory-keeper — you
                    are the only owner of this world, forever ∞
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
