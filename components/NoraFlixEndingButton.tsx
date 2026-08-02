"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

const BLOOPERS_VIDEO_SRC = "/videos/noraflix-bloopers.mp4";

const specialThanksNames = [
  "USS",
  "MC",
  "Dien",
  "Asad",
  "Aravind",
  "Ian",
  "Lucille",
  "Lalitha",
  "Madhu",
  "Anitha",
  "Sunil",
  "Cake Aunty",
  "The Dollarama Girl",
  "The Halal Store Guy",
];

const creditsLines = [
  "NoraFlix Presents",
  "A Birthday Production",
  "Created with an unreasonable amount of love",
  "Starring:",
  "Nora ❤️",
  "Featuring:",
  "Piggy, Dauda, SU and Atna",
  "Happy Birthday, bb.",
];

function SpecialThanksModal({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const reduceMotion = useReducedMotion();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setShowCredits(false);
    setVideoFailed(false);

    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;

      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, a[href], video[controls], textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      triggerRef.current?.focus();
    };
  }, [onClose, open, triggerRef]);

  useEffect(() => {
    if (!open || showCredits || !videoRef.current) return;
    videoRef.current.muted = true;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {
      // Autoplay can fail without breaking the post-credits scene.
    });
  }, [open, showCredits]);

  const replayBloopers = () => {
    setShowCredits(false);
    window.setTimeout(() => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }, 80);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/82 px-4 py-6 backdrop-blur-xl sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="special-thanks-title"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="relative my-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-pink-200/15 bg-[radial-gradient(circle_at_20%_0%,rgba(244,114,182,0.16),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(239,68,68,0.16),transparent_30%),linear-gradient(135deg,rgba(18,8,10,0.98),rgba(3,3,3,0.98))] p-5 text-white shadow-[0_30px_110px_rgba(0,0,0,0.75)] sm:p-8"
          >
            <div className="pointer-events-none absolute left-8 top-24 text-5xl text-pink-200/[0.05]">♥</div>
            <div className="pointer-events-none absolute bottom-16 right-10 text-4xl text-red-200/[0.07]">✦</div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-2xl text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-200/70"
              aria-label="Close special thanks modal"
            >
              ×
            </button>

            <AnimatePresence mode="wait">
              {showCredits ? (
                <motion.div
                  key="credits"
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative flex min-h-[68vh] flex-col items-center justify-center px-2 py-10 text-center"
                >
                  <div className="space-y-5">
                    {creditsLines.map((line, index) => (
                      <motion.p
                        key={line}
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reduceMotion ? 0 : index * 0.35, duration: 0.45 }}
                        className={`${line.endsWith(":") ? "mt-8 text-sm uppercase tracking-[0.28em] text-pink-200/60" : line === "Nora ❤️" ? "text-4xl font-black text-white sm:text-5xl" : "text-xl font-black text-slate-100 sm:text-2xl"}`}
                      >
                        {line}
                      </motion.p>
                    ))}
                    <motion.div
                      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: reduceMotion ? 0 : creditsLines.length * 0.35, duration: 0.5 }}
                      className="pt-6"
                    >
                      <div className="text-6xl">❤️</div>
                      <p className="mt-4 text-2xl font-black text-pink-50">To be continued… ❤️</p>
                      <button
                        type="button"
                        onClick={replayBloopers}
                        className="mt-8 min-h-12 rounded-full bg-red-600 px-6 text-sm font-black text-white shadow-[0_14px_40px_rgba(220,38,38,0.3)] transition hover:-translate-y-0.5 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-200/70"
                      >
                        Replay the Bloopers
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="main"
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28 }}
                  className="relative"
                >
                  <p className="pr-12 text-xs font-black uppercase tracking-[0.3em] text-red-200/60">
                    The final post-credits scene
                  </p>
                  <h2 id="special-thanks-title" className="mt-3 pr-12 text-3xl font-black text-white sm:text-4xl">
                    Before the Credits Roll… ❤️
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                    Every production needs bloopers, chaos, and the people who somehow helped make it happen.
                  </p>

                  <div className="mt-6 overflow-hidden rounded-2xl border border-pink-200/20 bg-black/55 shadow-[0_0_36px_rgba(244,114,182,0.08)]">
                    {videoFailed ? (
                      <div className="flex aspect-video flex-col items-center justify-center px-5 text-center">
                        <p className="text-lg font-black text-white">Bloopers are still being edited by Atna Productions 🎬</p>
                        <p className="mt-2 text-sm text-slate-400">Please imagine several technical difficulties here.</p>
                      </div>
                    ) : (
                      <video
                        ref={videoRef}
                        src={BLOOPERS_VIDEO_SRC}
                        className="aspect-video w-full bg-black"
                        controls
                        muted
                        playsInline
                        onError={() => setVideoFailed(true)}
                      />
                    )}
                  </div>

                  <div className="mt-8">
                    <h3 className="text-2xl font-black text-white">Special Thanks ❤️</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      NoraFlix and Operation Nora Birthday would not have been possible without the unexpected assistance, emotional support, secret-keeping, shopping help, technical support, and general chaos provided by:
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {specialThanksNames.map((name) => (
                        <div key={name} className="rounded-full border border-pink-200/15 bg-pink-200/[0.06] px-4 py-3 text-center text-sm font-black text-pink-50 shadow-[0_0_18px_rgba(244,114,182,0.06)]">
                          {name}
                        </div>
                      ))}
                    </div>
                    <p className="mt-5 text-sm leading-7 text-slate-300">
                      And everyone else who somehow became part of this unnecessarily complicated birthday production. ❤️
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-pink-200/55">
                      Some helped knowingly. Some were recruited without fully understanding the situation.
                    </p>
                  </div>

                  <div className="mt-8 rounded-2xl border border-pink-200/15 bg-pink-200/[0.07] p-5 text-center">
                    <p className="text-lg font-black leading-8 text-pink-50">
                      Most importantly, special thanks to the birthday girl for being worth all the planning, panic, hiding, coding, decorating, and approximately 900 unnecessary details.
                    </p>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">
                      Happy Birthday, bb.{"\n"}This concludes NoraFlix: Birthday Edition.{"\n"}Please remain seated in case Atna has somehow planned another post-credits scene. ❤️
                    </p>
                  </div>

                  <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="min-h-12 rounded-full border border-white/15 bg-white/5 px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-200/70"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        videoRef.current?.pause();
                        setShowCredits(true);
                      }}
                      className="min-h-12 rounded-full bg-red-600 px-6 text-sm font-black text-white shadow-[0_14px_40px_rgba(220,38,38,0.3)] transition hover:-translate-y-0.5 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-200/70"
                    >
                      Roll the Credits 🎬
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function NoraFlixEndingButton() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <section className="flex justify-center py-4">
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        animate={reduceMotion ? undefined : { boxShadow: ["0 0 0 rgba(244,114,182,0)", "0 0 34px rgba(244,114,182,0.22)", "0 0 0 rgba(244,114,182,0)"] }}
        transition={reduceMotion ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="group min-h-12 rounded-full border border-pink-200/25 bg-black/65 px-7 text-base font-black text-pink-50 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur transition hover:-translate-y-0.5 hover:border-pink-200/45 hover:bg-pink-200/10 focus:outline-none focus:ring-2 focus:ring-pink-200/70"
        aria-haspopup="dialog"
      >
        <span className="mr-2 inline-block transition group-hover:rotate-12">✦</span>
        One Last Thing… ❤️
      </motion.button>
      <SpecialThanksModal open={open} onClose={() => setOpen(false)} triggerRef={buttonRef} />
    </section>
  );
}
