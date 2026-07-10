"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface IntroVideoProps {
  onComplete: () => void;
}

export function IntroVideo({ onComplete }: IntroVideoProps) {
  const [visible, setVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Start muted for autoplay compatibility, then unmute
    video.muted = true;

    const handlePlay = () => {
      video.muted = false;
    };

    video.addEventListener("play", handlePlay, { once: true });
    video.play().catch((error) => {
      console.error("Autoplay failed:", error);
      // If autoplay fails, unmute and try again
      video.muted = false;
      video.play();
    });

    return () => {
      video.removeEventListener("play", handlePlay);
    };
  }, []);

  const handleVideoEnd = () => {
    setVisible(false);
    setTimeout(() => onComplete(), 300); // Wait for fade out
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        >
          <video
            ref={videoRef}
            src="/videos/common/netflix-intro.mp4"
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
          />

          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
