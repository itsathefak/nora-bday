"use client";

import { motion } from "framer-motion";
import type { HeartPingMessageType } from "../../lib/heart-ping/types";

type HeartPingMessageOptionProps = {
  id: HeartPingMessageType;
  title: string;
  icon: string;
  description: string;
  selected: boolean;
  onSelect: (id: HeartPingMessageType) => void;
};

export function HeartPingMessageOption({
  id,
  title,
  icon,
  description,
  selected,
  onSelect,
}: HeartPingMessageOptionProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(id)}
      whileHover={{ y: -4 }}
      className={`relative min-h-[172px] rounded-3xl border p-5 text-left outline-none transition focus-visible:ring-4 focus-visible:ring-pink-200/25 ${
        selected
          ? "border-pink-200/70 bg-pink-100/[0.08] shadow-[0_0_34px_rgba(244,114,182,0.16)]"
          : "border-white/10 bg-white/[0.045] hover:border-pink-200/35"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-3xl" aria-hidden="true">{icon}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${selected ? "border-pink-200 bg-pink-100 text-red-950" : "border-white/15 text-transparent"}`}>
          ✓
        </span>
      </div>
      <h4 className="mt-5 text-lg font-black text-white">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
    </motion.button>
  );
}
