"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { sharedInboxConfig } from "../../data/atna/shared-inbox";
import { AmbientHearts } from "./ambient-hearts";

const purposeCards = [
  {
    icon: "✉",
    title: "Letters for Later",
    text: "Write something today and let future us find it someday.",
  },
  {
    icon: "◉",
    title: "Our Memory Archive",
    text: "Send photos, little stories, screenshots, and moments worth keeping.",
  },
  {
    icon: "♥",
    title: "Tiny Everyday Updates",
    text: "Not everything needs to be important. Sometimes “Piggy did something weird again” is enough.",
  },
  {
    icon: "🐾",
    title: "NoraFlix Mail",
    text: "Heart Pings, special messages, and future surprises can find their way here.",
  },
];

function InboxIllustration() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto flex min-h-[340px] w-full max-w-md items-center justify-center">
      <div className="absolute inset-8 rounded-full bg-rose-400/10 blur-3xl" />
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-full max-w-[330px]"
      >
        <div className="absolute -left-8 top-8 rotate-[-14deg] rounded-2xl border border-amber-100/15 bg-[#f5ead2] px-8 py-5 text-[#4b1c18] shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.22em]">future us</p>
        </div>
        <div className="absolute -right-6 bottom-10 rotate-[12deg] rounded-2xl border border-pink-100/20 bg-[#f7d6df] px-7 py-4 text-[#4b1c18] shadow-2xl">
          <p className="text-2xl">♥</p>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#2a0809] via-[#120606] to-black p-7 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,113,133,0.2),transparent_38%)]" />
          <div className="relative rounded-[1.5rem] border border-amber-100/15 bg-[#160808] p-5">
            <div className="mx-auto h-24 w-44 rounded-t-[2rem] border border-red-200/15 bg-gradient-to-br from-[#3d0b0d] to-[#170607]" />
            <div className="-mt-2 rounded-[1.4rem] border border-red-200/20 bg-[#0b0505] p-5">
              <div className="mx-auto h-3 w-24 rounded-full bg-red-200/20" />
              <div className="mt-5 rounded-2xl bg-[#f6ead3] p-5 text-center text-[#3d2118] shadow-inner">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8a4a44]">our little inbox</p>
                <p className="mt-3 text-3xl">💌</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SharedInboxModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const emailRef = useRef<HTMLParagraphElement | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "fallback">("idle");

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => modalRef.current?.querySelector<HTMLButtonElement>("button")?.focus(), 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
      setCopyState("idle");
    };
  }, [onClose, open]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(sharedInboxConfig.email);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      if (emailRef.current) {
        range.selectNodeContents(emailRef.current);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setCopyState("fallback");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/82 px-3 py-5 text-white backdrop-blur-md sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shared-inbox-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close Our Little Inbox" />
          <motion.div
            ref={modalRef}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="relative max-h-[92vh] w-full max-w-[940px] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#100606] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.66)] sm:p-7"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_20%_0%,rgba(244,114,182,0.16),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(127,29,29,0.28),transparent_34%)]" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-2xl leading-none text-slate-200 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20"
              aria-label="Close"
            >
              ×
            </button>

            <div className="relative z-10">
              <div className="pr-12">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-pink-200/65">Our Little Inbox</p>
                <h2 id="shared-inbox-title" className="mt-3 text-3xl font-black text-white sm:text-5xl">
                  Welcome to Our Little Inbox
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-400">
                  One address. Two people. A lot of future memories.
                </p>
              </div>

              <div className="mt-7 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[1.6rem] border border-[#ead7b5]/25 bg-[#f4ead5] p-5 text-[#2d1911] shadow-2xl">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8d5147]">Our shared email</p>
                  <p ref={emailRef} className="mt-4 break-all font-mono text-xl font-black text-[#210f0b] sm:text-2xl">
                    {sharedInboxConfig.email}
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="min-h-11 rounded-full bg-[#220f0c] px-5 font-black text-white transition hover:bg-[#3d1b15] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-900/20"
                      aria-label="Copy shared inbox email address"
                    >
                      {copyState === "copied" ? "Copied ❤️" : "Copy Address"}
                    </button>
                    <a
                      href={sharedInboxConfig.gmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#3d2118]/15 px-5 font-black text-[#2d1911] transition hover:bg-[#eadbbb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-900/20"
                      aria-label="Open Gmail in a new tab"
                    >
                      Open Gmail
                    </a>
                  </div>
                  <p aria-live="polite" className="mt-3 min-h-5 text-sm font-semibold text-[#8d5147]">
                    {copyState === "fallback" ? "Press Ctrl+C or Command+C to copy" : copyState === "copied" ? "Tiny envelope copied it for you." : ""}
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex gap-4 rounded-2xl border border-white/10 bg-black/28 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/12 text-2xl">🔒</div>
                    <div>
                      <h3 className="font-black text-white">And the password?</h3>
                      <p className="mt-2 rounded-2xl border border-pink-200/10 bg-pink-200/[0.045] px-3 py-2 text-xs font-bold leading-6 text-pink-100/80">
                        Hint: the first place we kissed — 3 numbers — followed by forever. Example: XXXforever
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-400">
                        That part stays between us. I’ll share it with you privately, because some things should never live inside the code.
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-500">
                        Once you sign in, save it securely in your password manager.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {purposeCards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{card.icon}</span>
                      <div>
                        <h3 className="font-black text-white">{card.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{card.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.4rem] border border-pink-100/10 bg-black/30 p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-200/55">Decorative preview</p>
                <div className="mt-4 rounded-2xl bg-[#f3e8d2] p-5 font-serif text-[#2d1911] shadow-inner">
                  <p className="font-mono text-xs text-[#7f5547]">To: Us</p>
                  <p className="mt-1 font-mono text-xs text-[#7f5547]">Subject: Something worth remembering</p>
                  <p className="mt-5 leading-7">
                    Dear future us,
                    <br />
                    <br />
                    Today, we made another tiny memory.
                    <br />
                    <br />
                    Keep this one.
                    <br />
                    <br />
                    — Present us ❤️
                  </p>
                </div>
              </div>

              <div className="mt-7 border-t border-white/10 pt-6">
                <p className="font-serif text-xl leading-8 text-[#f1d8c8]">
                  Maybe years from now, this inbox will be full of ordinary days that became important without us noticing.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Please keep it kind, private, and full of us. ❤️
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="min-h-11 rounded-full border border-white/10 px-5 font-black text-white transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20"
                  >
                    {copyState === "copied" ? "Copied ❤️" : "Copy Address"}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-11 rounded-full border border-white/10 px-5 font-black text-white transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20"
                  >
                    Close
                  </button>
                  <a
                    href={sharedInboxConfig.gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 font-black text-black transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20"
                  >
                    Go to Gmail
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SharedInboxSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-black px-6 py-20 text-white sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,114,182,0.12),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(127,29,29,0.24),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:18px_18px]" />
      <div className="pointer-events-none absolute inset-0 z-0">
        <AmbientHearts count={28} opacityScale={0.7} />
      </div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]"
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-pink-200/60">Our Little Inbox</p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-black leading-tight text-[#fff7ed] sm:text-5xl lg:text-6xl">
            A Place for the Things We Want to Keep
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Not every memory needs a whole movie. Some belong in a message, a photo, a tiny update, or a letter sent on an ordinary day. So I made us one little inbox where our story can keep collecting pieces of itself.
          </p>
          <p className="mt-4 font-serif text-2xl text-[#f1d8c8]">For future us, from present us. 💌</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="min-h-12 rounded-full bg-white px-7 font-black text-black shadow-[0_18px_50px_rgba(244,114,182,0.2)] transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20"
            >
              Open Our Inbox
            </button>
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="min-h-12 rounded-full border border-white/10 px-7 font-black text-white transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20"
              aria-expanded={expanded}
            >
              What is this?
            </button>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -8 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto", y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.32 }}
                className="overflow-hidden"
              >
                <p className="mt-5 rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-sm leading-7 text-slate-300">
                  A shared inbox for the two of us—a place to send letters, save memories, share photos, and leave little messages for the future. It is not public, and the password is never stored inside NoraFlix.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <InboxIllustration />
      </motion.div>

      <SharedInboxModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
