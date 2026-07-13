"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

export function GameCard({ item }: { item: any }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="h-full overflow-hidden rounded-3xl bg-slate-950/90 shadow-xl shadow-black/40"
    >
      <Link href={item.href as any} className="block h-full">
        <div className="relative h-40 w-full bg-slate-900 md:h-48 lg:h-56">
          {item.thumbnail && !imgError ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-800 text-sm font-medium text-slate-400">
              Game coming soon
            </div>
          )}
        </div>

        <div className="space-y-2 p-4">
          <h4 className="text-sm font-semibold text-white">{item.title}</h4>
          <p className="line-clamp-3 text-xs leading-relaxed text-slate-400">
            {item.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export default GameCard;
