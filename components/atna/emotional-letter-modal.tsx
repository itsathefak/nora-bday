"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { atnaLetter } from "../../data/atna/letter-content";

const chapterTitles = [
  "Thank you for continuing to love an imperfect Atna",
  "Every little memory means something to me",
  "The Atna people do not always see",
  "The page that kept me grounded",
  "I have not been ignoring you",
  "My mind is constantly trying to love you better",
  "I have been missing our closeness",
  "I do not want us to live in the past",
  "The questions anxiety creates",
  "Affection, intimacy, and understanding each other",
  "A difficult memory I have carried",
  "NoraFlix was harder to make than it looks",
  "What the last few days taught me about our future",
  "What I am asking from you",
  "What I am promising myself",
  "I hope you can see the love behind the effort",
  "I want to love you without losing the present",
  "Love does not need to look perfect",
  "About the future",
  "Please take your time with this",
  "If you made it this far...",
  "No matter what happens after this",
  "Thank you for making me believe in love",
  "One final promise",
];

type LetterPage = {
  title: string;
  paragraphs: string[];
  chapterNumber?: number;
  isPreface?: boolean;
};

function buildLetterPages() {
  const pages: LetterPage[] = [];
  const preface: string[] = [];
  let currentPage: LetterPage | null = null;
  const chapterTitleSet = new Set(chapterTitles);

  atnaLetter.paragraphs.forEach((paragraph) => {
    if (chapterTitleSet.has(paragraph)) {
      if (currentPage) {
        pages.push(currentPage);
      }
      currentPage = {
        title: paragraph,
        paragraphs: [],
        chapterNumber: chapterTitles.indexOf(paragraph) + 1,
      };
      return;
    }

    if (!currentPage) {
      preface.push(paragraph);
    } else {
      currentPage.paragraphs.push(paragraph);
    }
  });

  if (currentPage) pages.push(currentPage);

  return [
    {
      title: "24 chapters for your 24th birthday.",
      paragraphs: preface,
      isPreface: true,
    },
    ...pages,
  ];
}

export function EmotionalLetterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const pages = useMemo(() => buildLetterPages(), []);
  const totalPages = pages.length;
  const currentPage = pages[pageIndex] ?? pages[0];
  const currentParagraphs = currentPage?.paragraphs ?? [];
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === totalPages - 1;

  const goToPage = useCallback((nextPage: number) => {
    const safePage = Math.max(0, Math.min(totalPages - 1, nextPage));
    if (safePage === pageIndex) return;
    setDirection(safePage > pageIndex ? 1 : -1);
    setPageIndex(safePage);
    articleRef.current?.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [pageIndex, reduceMotion, totalPages]);

  useEffect(() => {
    if (!open) return;
    setPageIndex(0);
    setDirection(1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goToPage(pageIndex + 1);
      if (event.key === "ArrowLeft") goToPage(pageIndex - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [goToPage, onClose, open, pageIndex]);

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
            ref={articleRef}
            initial={{ opacity: 0, y: 45, rotateX: -5 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: 25 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto max-h-[92vh] max-w-3xl overflow-y-auto rounded-sm bg-[#eee1c5] px-7 py-12 text-[#382d24] shadow-[0_30px_100px_rgba(0,0,0,.8)] sm:px-14 md:px-20 md:py-16"
          >
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(4deg,transparent_0,transparent_5px,rgba(80,55,30,.055)_6px)]" />
            <div className="pointer-events-none absolute inset-3 border border-[#806848]/20" />
            <button ref={closeRef} onClick={onClose} className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#5d4935]/20 text-xl text-[#5d4935] transition hover:bg-black/5" aria-label="Close letter">×</button>

            <div className="relative">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.36em] text-[#8a6d50]">{atnaLetter.date}</p>
              <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-[#9a7958]">Page {pageIndex + 1} of {totalPages}</p>
              <div className="mx-auto mt-7 h-px w-20 bg-[#9a7958]/40" />

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={pageIndex}
                  custom={direction}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? 54 : -54, rotateY: direction > 0 ? -8 : 8 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, rotateY: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? -54 : 54, rotateY: direction > 0 ? 8 : -8 }}
                  transition={{ duration: reduceMotion ? 0.18 : 0.48, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-9 min-h-[48vh]"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {currentPage?.isPreface ? (
                    <>
                      <p className="text-center text-[10px] font-black uppercase tracking-[0.32em] text-[#9a7958]">A preface before the first page</p>
                      <h2 id="atna-letter-title" className="mx-auto mt-4 max-w-xl text-center font-serif text-3xl font-black leading-tight text-[#3b271f] sm:text-4xl">
                        {currentPage.title}
                      </h2>
                      <div className="mt-10 space-y-7 font-serif text-[17px] leading-[1.95] sm:text-[18px]">
                        <p className="text-2xl italic sm:text-3xl">{atnaLetter.salutation}</p>
                        {currentParagraphs.map((paragraph) => (
                          <div key={paragraph}>
                            <p className="whitespace-pre-line">{paragraph}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-center text-[10px] font-black uppercase tracking-[0.32em] text-[#9a7958]">
                        Chapter {currentPage?.chapterNumber} of 24
                      </p>
                      <h2 id="atna-letter-title" className="mx-auto mt-4 max-w-2xl text-center font-serif text-3xl font-black leading-tight text-[#3b271f] sm:text-4xl">
                        {currentPage?.title}
                      </h2>
                      <div className="mx-auto mt-6 h-px w-16 bg-[#9a7958]/35" />
                      <div className="mt-9 space-y-7 font-serif text-[17px] leading-[1.95] sm:text-[18px]">
                        {currentParagraphs.map((paragraph) => (
                          <div key={paragraph}>
                            <p className="whitespace-pre-line">{paragraph}</p>
                          </div>
                        ))}

                        {isLastPage && (atnaLetter.closing || atnaLetter.signature) && (
                          <div className="mt-14 font-serif text-lg italic">
                            {atnaLetter.closing && <p>{atnaLetter.closing}</p>}
                            {atnaLetter.signature && <p className="mt-5 text-3xl text-[#782727]">{atnaLetter.signature}</p>}
                          </div>
                        )}

                        {isLastPage && <div className="mx-auto mt-16 flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#a53333,#681111)] font-serif italic text-red-100 shadow-[0_5px_18px_rgba(80,0,0,.3)]">A</div>}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="-mx-7 mt-12 flex items-center justify-between gap-3 border-t border-[#806848]/15 bg-[#eee1c5] px-7 py-4 sm:-mx-14 sm:px-14 md:-mx-20 md:px-20">
                <button
                  type="button"
                  onClick={() => goToPage(pageIndex - 1)}
                  disabled={isFirstPage}
                  className="min-h-11 rounded-full border border-[#806848]/20 px-5 text-sm font-black text-[#5d4935] transition hover:bg-black/5 disabled:opacity-35"
                >
                  Previous
                </button>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#806848]/12">
                  <div className="h-full rounded-full bg-[#782727] transition-all duration-500" style={{ width: `${((pageIndex + 1) / totalPages) * 100}%` }} />
                </div>
                <button
                  type="button"
                  onClick={() => goToPage(pageIndex + 1)}
                  disabled={isLastPage}
                  className="min-h-11 rounded-full bg-[#782727] px-5 text-sm font-black text-red-50 shadow-[0_8px_24px_rgba(120,39,39,0.22)] transition hover:bg-[#8c3030] disabled:bg-[#806848]/20 disabled:text-[#5d4935] disabled:opacity-45"
                >
                  {isLastPage ? "The End" : "Next Page"}
                </button>
              </div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
