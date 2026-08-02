"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  hiddenReminderMessages,
  type ProfileId,
  type ReminderMessage,
} from "../../data/hidden-reminders";

const AUTO_CLOSE_MS = 12000;

type HiddenReminderProps = {
  profile: ProfileId;
  hidden?: boolean;
};

const profileTheme: Record<ProfileId, { tab: string; icon: string; glow: string }> = {
  nora: { tab: "from-pink-300 to-red-500", icon: "♥", glow: "shadow-pink-500/25" },
  piggy: { tab: "from-rose-200 to-red-400", icon: "♥", glow: "shadow-red-300/20" },
  dauda: { tab: "from-amber-200 to-red-400", icon: "♥", glow: "shadow-amber-300/20" },
  atna: { tab: "from-[#ead7b5] to-rose-400", icon: "♥", glow: "shadow-rose-300/25" },
};

const iconMap: Record<NonNullable<ReminderMessage["icon"]>, string> = {
  heart: "♥",
  paw: "🐾",
  star: "✦",
  envelope: "✉",
  sparkle: "✧",
};

function pickOne<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function getMessage(profile: ProfileId) {
  const available = hiddenReminderMessages.filter(
    (message) => !message.profiles || message.profiles.includes(profile),
  );
  const priority = available.find((message) => message.id === "explore-everything");
  return priority ?? pickOne(available);
}

export function HiddenReminder({ profile, hidden = false }: HiddenReminderProps) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState<ReminderMessage | null>(null);
  const [hoveredOrFocused, setHoveredOrFocused] = useState(false);
  const autoCloseRef = useRef<number | null>(null);
  const theme = profileTheme[profile];

  const symbol = useMemo(
    () => iconMap[message?.icon ?? "heart"] ?? theme.icon,
    [message?.icon, theme.icon],
  );

  useEffect(() => {
    const nextMessage = getMessage(profile);
    setMessage(nextMessage);
    setVisible(true);
  }, [profile]);

  useEffect(() => {
    if (!expanded || hoveredOrFocused) return;
    autoCloseRef.current = window.setTimeout(() => setExpanded(false), AUTO_CLOSE_MS);
    return () => {
      if (autoCloseRef.current) window.clearTimeout(autoCloseRef.current);
    };
  }, [expanded, hoveredOrFocused]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!visible || !message || hidden) return null;

  return (
    <div
      className="relative z-10 mx-auto flex max-w-7xl justify-end px-5 pb-12 pt-4 md:px-8"
      onMouseEnter={() => setHoveredOrFocused(true)}
      onMouseLeave={() => setHoveredOrFocused(false)}
      onFocus={() => setHoveredOrFocused(true)}
      onBlur={() => setHoveredOrFocused(false)}
    >
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="bubble"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.28 }}
            className="absolute bottom-28 right-5 w-[min(292px,calc(100vw-32px))] rounded-3xl border border-[#ead7b5]/40 bg-[#f3e4c8] p-4 text-left text-[#25130f] shadow-2xl shadow-red-950/35 md:right-8 sm:w-[330px]"
            aria-live="polite"
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-35 [background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 180 180%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%22.75%22 numOctaves=%223%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%22.25%22/%3E%3C/svg%3E')]" />
            <div className="relative flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-950 text-lg text-pink-100">
                {symbol}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black leading-relaxed">{message.text}</p>
                <p className="mt-3 text-xs font-bold text-red-950/55">okay, continue exploring →</p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-950/10 text-lg text-red-950 outline-none transition hover:bg-red-950/15 focus-visible:ring-4 focus-visible:ring-red-950/20"
                aria-label="Close hidden NoraFlix reminder"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={
          reduceMotion
            ? { opacity: 1 }
            : {
                opacity: 1,
                y: 0,
                rotate: [0, -3, 3, 0],
              }
        }
        transition={{ duration: 0.34, rotate: { delay: 0.45, duration: 0.32 } }}
        className={`relative flex h-[46px] w-[46px] min-h-11 min-w-11 items-center justify-center rounded-full bg-gradient-to-br ${theme.tab} ${theme.glow} text-white shadow-[0_0_28px_rgba(244,114,182,0.3)] outline-none ring-2 ring-white/35 transition hover:scale-105 focus-visible:ring-4 focus-visible:ring-pink-200/35 sm:h-11 sm:w-11`}
        aria-label="Open a hidden NoraFlix reminder"
        aria-expanded={expanded}
      >
        <span className="text-lg" aria-hidden="true">{theme.icon}</span>
      </motion.button>
    </div>
  );
}
