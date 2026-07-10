"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { MediaCard } from "./MediaCard";

export function ContentRow({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: any[];
  onOpen?: (item: any, opts?: any) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    const el = ref.current;
    const offset = el.clientWidth * 0.7;
    el.scrollBy({
      left: dir === "left" ? -offset : offset,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-full bg-black/60"
        >
          ◀
        </button>

        <div
          ref={ref}
          className="flex gap-4 overflow-x-auto hide-scrollbar py-2"
        >
          {items.map((it) => (
            <motion.div
              key={it?.id || Math.random()}
              whileHover={{ scale: 1.05 }}
              className="min-w-[220px] md:min-w-[260px]"
            >
              <MediaCard item={it} onOpen={onOpen} />
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-full bg-black/60"
        >
          ▶
        </button>
      </div>
    </section>
  );
}

export default ContentRow;
