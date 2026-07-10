"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface ProfileCardProps {
  name: string;
  subtitle: string;
  image: string;
  href: string;
  accent: string;
}

export function ProfileCard({
  name,
  subtitle,
  image,
  href,
  accent,
}: ProfileCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      className="group rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 transition duration-300"
      style={{ borderColor: "rgba(255,255,255,0.12)" }}
    >
      <Link
        href={href}
        className="block rounded-3xl p-4 transition duration-300 hover:bg-white/5"
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-slate-900"
            style={{ boxShadow: `0 0 35px ${accent}22` }}
          >
            <img
              src={image}
              alt={`${name} avatar`}
              className="h-14 w-14 object-contain"
            />
          </div>
          <div className="space-y-1 text-left">
            <p className="text-lg font-semibold text-white">{name}</p>
            <p className="text-sm text-slate-300">{subtitle}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
