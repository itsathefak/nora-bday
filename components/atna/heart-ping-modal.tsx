"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  HEART_PING_LABELS,
  HEART_PING_PEOPLE,
  getHeartPingRecipient,
  type HeartPingMessageType,
  type HeartPingSender,
} from "../../lib/heart-ping/types";
import { HeartPingMessageOption } from "./heart-ping-message-option";
import { HeartPingSuccess } from "./heart-ping-success";
import { saveHeartPingSummary } from "./heart-ping-history";

type HeartPingStep = "choose-message" | "write-note" | "preview" | "sending" | "success" | "error";

const options: {
  id: HeartPingMessageType;
  title: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "miss-you",
    title: "I Miss You",
    icon: "☾",
    description: "Just a little reminder that someone is thinking about you.",
  },
  {
    id: "love-you",
    title: "I Love You",
    icon: "♥",
    description: "No big speech. Just something that should never go unsaid.",
  },
  {
    id: "support",
    title: "Necky Want",
    icon: "♡",
    description: "A very serious diplomatic request for one tiny neck massage, please and thank you.",
  },
];

function sanitizeNote(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").slice(0, 300);
}

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function HeartPingModal({
  sender,
  open,
  onClose,
  onSaved,
}: {
  sender: HeartPingSender | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const sendingRef = useRef(false);
  const activeSendingRef = useRef(false);
  const [step, setStep] = useState<HeartPingStep>("choose-message");
  const [messageType, setMessageType] = useState<HeartPingMessageType | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");

  const recipient = sender ? getHeartPingRecipient(sender) : null;
  const senderName = sender ? HEART_PING_PEOPLE[sender].name : "";
  const recipientName = recipient ? HEART_PING_PEOPLE[recipient].name : "";
  const trimmedNote = sanitizeNote(note).trim();
  const selectedOption = options.find((option) => option.id === messageType);
  const activeSending = step === "sending";
  activeSendingRef.current = activeSending;

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => modalRef.current?.querySelector<HTMLButtonElement>("button")?.focus(), 80);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !activeSendingRef.current) onClose();
      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

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
      previousFocusRef.current?.focus();
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setStep("choose-message");
      setMessageType(null);
      setNote("");
      setError("");
      setIdempotencyKey("");
      sendingRef.current = false;
    } else {
      setIdempotencyKey(makeIdempotencyKey());
    }
  }, [open]);

  const chooseMessage = (next: HeartPingMessageType) => {
    setMessageType(next);
    setError("");
    setStep("write-note");
  };

  const sendPing = async () => {
    if (!sender || !messageType || activeSending || sendingRef.current) return;
    if (!navigator.onLine) {
      setError("You appear to be offline. Reconnect before sending the Heart Ping.");
      setStep("error");
      return;
    }

    sendingRef.current = true;
    setStep("sending");
    setError("");

    try {
      const response = await fetch("/api/heart-ping/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-heart-ping-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          sender,
          messageType,
          ...(trimmedNote ? { note: trimmedNote } : {}),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; sendId?: string; error?: string };

      if (!response.ok || !result.ok || !result.sendId) {
        setError(result.error || "The envelope couldn’t leave right now. Nothing was sent—please try again.");
        setStep("error");
        sendingRef.current = false;
        return;
      }

      saveHeartPingSummary({
        id: result.sendId,
        sender,
        messageType,
        sentAt: new Date().toISOString(),
        status: "sent",
      });
      onSaved();
      setStep("success");
      sendingRef.current = false;
    } catch {
      setError("The envelope couldn’t leave right now. Nothing was sent—please try again.");
      setStep("error");
      sendingRef.current = false;
    }
  };

  if (!sender || !recipient) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/82 px-3 py-5 text-white backdrop-blur-md sm:px-6"
          aria-modal="true"
          role="dialog"
          aria-labelledby="heart-ping-title"
        >
          <button type="button" className="absolute inset-0 cursor-default" onClick={activeSending ? undefined : onClose} aria-label="Close Heart Ping" disabled={activeSending} />
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            className="relative max-h-[92vh] w-full max-w-[850px] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#100606] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.6)] sm:p-7"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_18%_0%,rgba(244,114,182,0.16),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(127,29,29,0.24),transparent_30%)]" />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-pink-200/65">Heart Ping</p>
                  <h2 id="heart-ping-title" className="mt-2 text-3xl font-black text-white sm:text-4xl">What do you want them to know?</h2>
                  <p className="mt-3 text-sm text-slate-400">From {senderName} → To {recipientName}</p>
                </div>
                <button type="button" onClick={onClose} disabled={activeSending} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20 disabled:opacity-40" aria-label="Close">
                  ×
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-pink-100/10 bg-rose-50/[0.04] p-4 text-xs leading-relaxed text-slate-400">
                Your note is used only to create this email and is not displayed publicly.
              </div>

              {step === "choose-message" && (
                <div className="mt-7 grid gap-4 md:grid-cols-3">
                  {options.map((option) => (
                    <HeartPingMessageOption key={option.id} {...option} selected={messageType === option.id} onSelect={chooseMessage} />
                  ))}
                </div>
              )}

              {step === "write-note" && (
                <div className="mt-7">
                  <div className="grid gap-4 md:grid-cols-3">
                    {options.map((option) => (
                      <HeartPingMessageOption key={option.id} {...option} selected={messageType === option.id} onSelect={chooseMessage} />
                    ))}
                  </div>
                  <label className="mt-6 block">
                    <span className="text-sm font-black text-white">Add a little note</span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(sanitizeNote(event.target.value))}
                      maxLength={300}
                      placeholder="Write something short, or leave this blank and let the message speak for itself."
                      className="mt-3 min-h-[130px] w-full resize-none rounded-3xl border border-white/10 bg-black/35 p-4 text-sm leading-relaxed text-white outline-none transition placeholder:text-slate-600 focus:border-pink-200/60 focus:ring-4 focus:ring-pink-200/15"
                    />
                    <span className="mt-2 block text-right text-xs text-slate-500">{note.length}/300</span>
                  </label>
                  <div className="sticky bottom-0 -mx-5 mt-6 flex justify-end gap-3 bg-gradient-to-t from-[#100606] via-[#100606] to-transparent px-5 pb-1 pt-6 sm:static sm:mx-0 sm:bg-none sm:px-0 sm:pt-0">
                    <button type="button" onClick={() => setStep("choose-message")} className="min-h-11 rounded-full border border-white/10 px-5 font-black text-white transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20">Go Back</button>
                    <button type="button" onClick={() => setStep("preview")} disabled={!messageType} className="min-h-11 rounded-full bg-white px-6 font-black text-black transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20 disabled:opacity-45">Preview</button>
                  </div>
                </div>
              )}

              {step === "preview" && selectedOption && (
                <div className="mt-7 grid gap-5 md:grid-cols-[1fr_260px]">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                    <dl className="space-y-4 text-sm">
                      <div><dt className="font-black text-white">Sender</dt><dd className="mt-1 text-slate-400">{senderName}</dd></div>
                      <div><dt className="font-black text-white">Recipient</dt><dd className="mt-1 text-slate-400">{recipientName}</dd></div>
                      <div><dt className="font-black text-white">Selected message</dt><dd className="mt-1 text-slate-400">{HEART_PING_LABELS[selectedOption.id]}</dd></div>
                      <div><dt className="font-black text-white">Optional note</dt><dd className="mt-1 whitespace-pre-line text-slate-400">{trimmedNote || "No note added."}</dd></div>
                    </dl>
                  </div>
                  <div className="overflow-hidden rounded-3xl border border-[#e7d5af]/20 bg-[#eadbbb] text-[#2d1911] shadow-2xl">
                    <div className="h-20 bg-gradient-to-r from-red-950 via-rose-900 to-pink-300" />
                    <div className="p-5">
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-red-900/60">A Heart Ping</p>
                      <h3 className="mt-3 font-serif text-2xl">{selectedOption.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-[#5a392a]">{selectedOption.description}</p>
                    </div>
                  </div>
                  <div className="sticky bottom-0 -mx-5 flex justify-end gap-3 bg-gradient-to-t from-[#100606] via-[#100606] to-transparent px-5 pb-1 pt-6 md:col-span-2 sm:static sm:mx-0 sm:bg-none sm:px-0 sm:pt-0">
                    <button type="button" onClick={() => setStep("write-note")} className="min-h-11 rounded-full border border-white/10 px-5 font-black text-white transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20">Go Back</button>
                    <button type="button" onClick={sendPing} className="min-h-11 rounded-full bg-white px-6 font-black text-black transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20">Send Heart Ping</button>
                  </div>
                </div>
              )}

              {step === "sending" && (
                <div className="py-16 text-center" aria-live="polite">
                  <motion.div
                    animate={reduceMotion ? { opacity: [0.7, 1, 0.7] } : { x: [0, 130, -30, 0], y: [0, -16, 8, 0], rotate: [0, 8, -4, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="mx-auto text-7xl"
                  >
                    💌
                  </motion.div>
                  <p className="mt-7 text-xl font-black text-white">Preparing your message…</p>
                </div>
              )}

              {step === "success" && (
                <HeartPingSuccess
                  onDone={onClose}
                  onSendAnother={() => {
                    setMessageType(null);
                    setNote("");
                    setIdempotencyKey(makeIdempotencyKey());
                    setStep("choose-message");
                  }}
                />
              )}

              {step === "error" && (
                <div className="py-12 text-center" aria-live="assertive">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-4xl">✉</div>
                  <h3 className="mt-6 text-2xl font-black text-white">The message could not be sent.</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">{error}</p>
                  <div className="mt-7 flex justify-center gap-3">
                    <button type="button" onClick={() => setStep("preview")} className="min-h-11 rounded-full bg-white px-6 font-black text-black transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20">Go Back</button>
                    <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-white/10 px-6 font-black text-white transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20">Done</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
