"use client";

import { motion } from "framer-motion";
import type { HeartPingSender } from "../../lib/heart-ping/types";

type HeartPingSenderCardProps = {
  sender: HeartPingSender;
  title: string;
  label: string;
  image: string;
  onSelect: () => void;
};

export function HeartPingSenderCard({
  title,
  label,
  image,
  onSelect,
}: HeartPingSenderCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -6 }}
      whileFocus={{ y: -4 }}
      className="group relative min-h-[210px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#130707]/90 p-5 text-left shadow-[0_24px_80px_rgba(0,0,0,0.45)] outline-none transition focus-visible:border-pink-200 focus-visible:ring-4 focus-visible:ring-pink-200/20"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.22),transparent_28%),linear-gradient(135deg,rgba(127,29,29,0.28),transparent)] opacity-70 transition group-hover:opacity-100" />
      <div className="absolute right-5 top-5 text-3xl transition duration-300 group-hover:rotate-[-10deg] group-hover:scale-110" aria-hidden="true">
        💌
      </div>
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="h-24 w-24 overflow-hidden rounded-3xl border border-rose-100/20 bg-black/40 shadow-2xl shadow-red-950/40">
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-pink-200/70">{label}</p>
          <h3 className="mt-2 text-3xl font-black text-white">{title}</h3>
        </div>
      </div>
    </motion.button>
  );
}
