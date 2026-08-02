"use client";

import { useEffect, useState } from "react";
import {
  HEART_PING_PEOPLE,
  getHeartPingLabel,
  type HeartPingMessageType,
  type HeartPingSender,
  type HeartPingSummary,
} from "../../lib/heart-ping/types";

const STORAGE_KEY = "noraflix-atna-heart-ping-history";
const MAX_STORED_PINGS = 100;
const PAGE_SIZE = 8;
type SenderFilter = "all" | HeartPingSender;
type MessageFilter = "all" | HeartPingMessageType;

export function readHeartPingHistory(): HeartPingSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, MAX_STORED_PINGS) : [];
  } catch {
    return [];
  }
}

export function saveHeartPingSummary(summary: HeartPingSummary) {
  const current = readHeartPingHistory();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([summary, ...current].slice(0, MAX_STORED_PINGS)));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function HeartPingHistory({ refreshKey }: { refreshKey: number }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<HeartPingSummary[]>([]);
  const [senderFilter, setSenderFilter] = useState<SenderFilter>("all");
  const [messageFilter, setMessageFilter] = useState<MessageFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setHistory(readHeartPingHistory());
  }, [refreshKey]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [senderFilter, messageFilter, open]);

  const filteredHistory = history.filter((item) => {
    const senderMatches = senderFilter === "all" || item.sender === senderFilter;
    const messageMatches = messageFilter === "all" || item.messageType === messageFilter;
    return senderMatches && messageMatches;
  });
  const visibleHistory = filteredHistory.slice(0, visibleCount);

  return (
    <div className="mx-auto mt-16 max-w-2xl text-left">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="mx-auto flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-slate-300 outline-none transition hover:bg-white/[0.06] focus-visible:ring-4 focus-visible:ring-pink-200/20"
        aria-expanded={open}
      >
        Previously sent pings
      </button>

      {open && (
        <div className="mt-5 rounded-3xl border border-white/10 bg-black/35 p-5 text-sm text-slate-300">
          {history.length === 0 ? (
            <p className="text-center text-slate-500">No pings yet. The little envelope is waiting.</p>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-pink-200/55">
                  Showing {filteredHistory.length} of {history.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "Everyone" },
                    { value: "atna", label: "From Atna" },
                    { value: "nora", label: "From Nora" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setSenderFilter(filter.value as SenderFilter)}
                      className={`min-h-10 rounded-full border px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20 ${
                        senderFilter === filter.value
                          ? "border-pink-200/45 bg-pink-200/15 text-pink-100"
                          : "border-white/10 bg-white/[0.035] text-slate-400 hover:bg-white/[0.06]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All pings" },
                  { value: "love-you", label: "Love" },
                  { value: "miss-you", label: "Miss" },
                  { value: "support", label: "Huggie / Necky" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setMessageFilter(filter.value as MessageFilter)}
                    className={`min-h-10 rounded-full border px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20 ${
                      messageFilter === filter.value
                        ? "border-rose-200/45 bg-rose-200/15 text-rose-100"
                        : "border-white/10 bg-white/[0.035] text-slate-400 hover:bg-white/[0.06]"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {filteredHistory.length === 0 ? (
                <p className="mt-5 rounded-2xl bg-white/[0.04] px-4 py-4 text-center text-slate-500">
                  No pings match this filter yet.
                </p>
              ) : (
                <ul className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {visibleHistory.map((item) => (
                    <li key={item.id} className="rounded-2xl bg-white/[0.04] px-4 py-3">
                      {getHeartPingLabel(item.sender, item.messageType)} • From {HEART_PING_PEOPLE[item.sender].name} • {formatDate(item.sentAt)}
                    </li>
                  ))}
                </ul>
              )}

              {visibleCount < filteredHistory.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="mx-auto mt-5 flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-4 text-xs font-black text-slate-300 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200/20"
                >
                  Show more pings
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
