"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export function MediaCard({
  item,
  onOpen,
}: {
  item: any;
  onOpen?: (item: any, opts?: any) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const hasImage = !!item?.thumbnail && !imgError;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="overflow-hidden rounded-3xl bg-slate-950/90 shadow-xl shadow-black/40 cursor-pointer"
      onClick={() => {
        if (onOpen) onOpen(item, { autoplay: false });
      }}
    >
      <div className="relative w-full h-40 md:h-48 lg:h-56 bg-slate-900">
        {hasImage ? (
          <img
            src={item.thumbnail}
            alt={item?.title || "Media thumbnail"}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400 text-sm font-medium">
            No image available
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-sm font-semibold text-white">
          {item?.title || "Untitled"}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {item?.subtitle || item?.year || ""}
        </div>
      </div>
    </motion.div>
  );
}

export default MediaCard;
