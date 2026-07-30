"use client";

import { useEffect, useState } from "react";
import {
  HEART_PING_LABELS,
  HEART_PING_PEOPLE,
  type HeartPingSummary,
} from "../../lib/heart-ping/types";

const STORAGE_KEY = "noraflix-atna-heart-ping-history";

export function readHeartPingHistory(): HeartPingSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function saveHeartPingSummary(summary: HeartPingSummary) {
  const current = readHeartPingHistory();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([summary, ...current].slice(0, 10)));
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

  useEffect(() => {
    setHistory(readHeartPingHistory());
  }, [refreshKey]);

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
            <ul className="space-y-3">
              {history.map((item) => (
                <li key={item.id} className="rounded-2xl bg-white/[0.04] px-4 py-3">
                  {HEART_PING_LABELS[item.messageType]} • From {HEART_PING_PEOPLE[item.sender].name} • {formatDate(item.sentAt)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
