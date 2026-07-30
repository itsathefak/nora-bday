"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { atnaLetter } from "../../data/atna/letter-content";
import { LetterImageBlock } from "./letter-image-block";

export function EmotionalLetterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] overflow-y-auto bg-black/92 px-3 py-6 backdrop-blur-xl sm:px-6 sm:py-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="atna-letter-title"
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.article
            initial={{ opacity: 0, y: 45, rotateX: -5 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: 25 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto max-w-3xl overflow-hidden rounded-sm bg-[#eee1c5] px-7 py-14 text-[#382d24] shadow-[0_30px_100px_rgba(0,0,0,.8)] sm:px-14 md:px-20 md:py-20"
          >
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(4deg,transparent_0,transparent_5px,rgba(80,55,30,.055)_6px)]" />
            <div className="pointer-events-none absolute inset-3 border border-[#806848]/20" />
            <button ref={closeRef} onClick={onClose} className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#5d4935]/20 text-xl text-[#5d4935] transition hover:bg-black/5" aria-label="Close letter">×</button>

            <div className="relative">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.36em] text-[#8a6d50]">{atnaLetter.date}</p>
              <div className="mx-auto mt-7 h-px w-20 bg-[#9a7958]/40" />
              <h2 id="atna-letter-title" className="mt-10 font-serif text-3xl italic sm:text-4xl">{atnaLetter.salutation}</h2>

              <div className="mt-9 space-y-7 font-serif text-[17px] leading-[1.95] sm:text-[18px]">
                {atnaLetter.paragraphs.map((paragraph, index) => (
                  <div key={paragraph}>
                    <p>{paragraph}</p>
                    {index === 3 && <LetterImageBlock />}
                  </div>
                ))}
              </div>

              <div className="mt-14 font-serif text-lg italic">
                <p>{atnaLetter.closing}</p>
                <p className="mt-5 text-3xl text-[#782727]">{atnaLetter.signature}</p>
              </div>
              <div className="mx-auto mt-16 flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#a53333,#681111)] font-serif italic text-red-100 shadow-[0_5px_18px_rgba(80,0,0,.3)]">A</div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
