"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { MediaCard } from "./MediaCard";
import { GameCard } from "./GameCard";

export function ContentRow({
  title,
  items,
  onOpen,
  layout,
}: {
  title: string;
  items: any[];
  onOpen?: (item: any, opts?: any) => void;
  layout?: "grid" | "carousel";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const hasGameCards = items.some((item) => item?.href);
  const isGameGrid = hasGameCards && layout !== "carousel";
  const showArrows = !isGameGrid;

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
        {showArrows && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-full bg-black/60"
          >
            ◀
          </button>
        )}

        <div
          ref={ref}
          className={
            isGameGrid
              ? "grid grid-cols-1 gap-5 py-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex gap-4 overflow-x-auto hide-scrollbar py-2"
          }
        >
          {items.map((it) => (
            <motion.div
              key={it?.id || Math.random()}
              whileHover={{ scale: 1.05 }}
              className={isGameGrid ? "min-w-0" : "min-w-[220px] md:min-w-[260px]"}
            >
              {it?.href ? (
                <GameCard item={it} />
              ) : (
                <MediaCard item={it} onOpen={onOpen} />
              )}
            </motion.div>
          ))}
        </div>

        {showArrows && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-full bg-black/60"
          >
            ▶
          </button>
        )}
      </div>
    </section>
  );
}

export default ContentRow;
