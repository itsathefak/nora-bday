"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface MediaItem {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  thumbnail?: string;
  backdropImage?: string;
  backdropVideo?: string;
  trailer?: string;
  video?: string;
  type?: string;
  month?: string;
  year?: number;
  runtime?: string;
  tags?: string[];
  ratingText?: string;
  personalNote?: string;
  locked?: boolean;
}

export function MediaModal({
  open,
  item,
  onClose,
  autoplay = false,
  onToggleFavorite,
  isFavorite,
}: {
  open: boolean;
  item?: MediaItem | null;
  onClose: () => void;
  autoplay?: boolean;
  onToggleFavorite?: (item?: MediaItem | null) => void;
  isFavorite?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setIsPlaying(autoplay && !!(item?.video || item?.backdropVideo || item?.trailer));
    } else {
      document.body.style.overflow = "auto";
      setIsPlaying(false);
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open, autoplay, item]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!item) return null;

  const videoSrc = item.video || item.backdropVideo || item.trailer;
  const previewVideo = isPlaying ? videoSrc : undefined;

  const playFullscreen = () => {
    if (!videoSrc) return;

    setIsPlaying(true);

    setTimeout(() => {
      const video = videoRef.current as (HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
      }) | null;

      if (!video) return;

      video.muted = false;
      video.play().catch(() => {});

      if (video.requestFullscreen) {
        video.requestFullscreen().catch(() => {});
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    }, 50);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black"
            onClick={onClose}
          />

          {/* modal */}
          <motion.div
            ref={containerRef}
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="relative z-60 w-[95%] md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-auto rounded-2xl bg-neutral-900 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              aria-label="Close"
              onClick={onClose}
              className="absolute right-4 top-4 z-30 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              ✕
            </button>

            {/* preview area */}
            <div className="relative w-full h-[44vh] md:h-[48vh] lg:h-[48vh] rounded-t-2xl overflow-hidden bg-black">
              {previewVideo ? (
                <video
                  ref={videoRef}
                  src={previewVideo}
                  autoPlay
                  muted
                  controls
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              ) : item.backdropImage ? (
                <img src={item.backdropImage} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-300">This memory is still being edited ❤️</div>
              )}

              {/* faded gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/90 to-transparent" />
            </div>

            {/* content */}
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold">{item.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                    {item.ratingText && <span className="uppercase text-xs bg-white/6 px-2 py-1 rounded">{item.ratingText}</span>}
                    {(item.year || item.month) && <span>{item.month ? `${item.month} ` : ""}{item.year}</span>}
                    {item.runtime && <span>• {item.runtime}</span>}
                    {item.tags && item.tags.length > 0 && <span>• {item.tags.slice(0, 3).join(" • ")}</span>}
                  </div>

                  <p className="mt-4 text-slate-300 whitespace-pre-line">{item.description}</p>

                  {item.personalNote && (
                    <div className="mt-4 p-3 bg-white/5 rounded">
                      <strong className="block text-sm text-slate-100">Personal note</strong>
                      <p className="text-sm text-slate-200 mt-1">{item.personalNote}</p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      onClick={playFullscreen}
                      disabled={!videoSrc}
                      className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-black font-semibold"
                    >
                      ▶ Play
                    </button>

                    <button
                      onClick={() => onToggleFavorite && onToggleFavorite(item)}
                      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 font-semibold transition ${
                        isFavorite
                          ? "bg-red-600 text-white hover:bg-red-500"
                          : "bg-white/6 text-white/90 hover:bg-white/10"
                      }`}
                    >
                      {isFavorite ? "❤️ Kept Forever" : "❤️ Keep Forever"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MediaModal;
