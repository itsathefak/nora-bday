"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { PawPrints } from "./PawPrints";
import { FloatingParticles } from "./FloatingParticles";

interface HeroData {
  label: string;
  title: string;
  matchText: string;
  description: string;
  buttons: { type: string; label: string }[];
  footerText?: string;
  backdropImage?: string;
  backdropVideo?: string;
}

export function HeroBanner({ data, onOpen }: { data: HeroData; onOpen?: (item: any, opts?: any) => void }) {
  const [videoError, setVideoError] = useState(false);
  const [, setIsPlaying] = useState(false);

  return (
    <section className="relative w-full min-h-[72vh] md:min-h-[84vh] overflow-hidden">
      {/* Background with optional right-side video */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {data.backdropVideo && !videoError ? (
          <>
            <div className="absolute inset-y-0 left-0 w-[46%] bg-gradient-to-r from-black/95 via-black/16 to-transparent pointer-events-none" />
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={data.backdropImage}
              className="absolute right-0 top-0 h-full w-[70%] min-w-[520px] object-cover opacity-100 pointer-events-none z-0"
              style={{ objectPosition: 'center right' }}
              onError={(e) => {
                // mark error so we can fall back to the poster image
                // eslint-disable-next-line no-console
                console.warn('Hero video failed to load', e);
                setVideoError(true);
              }}
            >
              {/* More reliable source element inside video tag */}
              <source src={data.backdropVideo} type="video/mp4" />
            </video>
          </>
        ) : (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1.06 }}
            transition={{ duration: 45, ease: "linear", repeat: Infinity }}
            className="absolute inset-0"
          >
            <img
              src={data.backdropImage || "/images/nora/movie-1.svg"}
              alt={data.title}
              className="object-cover w-full h-full"
            />
          </motion.div>
        )}

        {/* Gradient overlays for readability */}
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/95 via-black/16 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/45 pointer-events-none" />
        <div className="absolute inset-0 mix-blend-multiply opacity-4 pointer-events-none bg-gradient-to-b from-black to-transparent" />

        {/* subtle vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 120px 140px -60px rgba(0,0,0,0.8), inset 0 -120px 140px -60px rgba(0,0,0,0.8)' }} />

        {/* soft red ambient glow */}
        <div className="absolute left-16 top-24 w-96 h-96 bg-red-900/30 rounded-full blur-3xl pointer-events-none" />

        {/* film grain overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\"0 0 400 400\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" result=\"noise\"/%3E%3C/filter%3E%3Crect width=\"400\" height=\"400\" fill=\"white\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E")'
          }}
        />

        <FloatingParticles />
        <PawPrints />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl px-6 py-20 lg:py-28 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <p className="text-sm uppercase tracking-[0.4em] text-red-400 font-semibold">{data.label}</p>
          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold text-white leading-tight">{data.title}</h2>
          <p className="mt-3 text-sm text-red-300 font-medium">{data.matchText}</p>

          <p className="mt-6 text-base text-slate-200 whitespace-pre-line">{data.description}</p>

          <div className="mt-6 flex gap-4 items-center">
            {data.buttons.map((btn) => (
              <motion.button
                key={btn.type}
                whileHover={{ scale: 1.03 }}
                className={`inline-flex items-center gap-3 px-5 py-3 rounded-md font-semibold transition ${btn.type === 'play' ? 'bg-white text-black' : 'bg-white/10 text-white border border-white/20'}`}
                onClick={() => {
                  if (btn.type === 'play') {
                    if (onOpen) onOpen(data, { autoplay: true });
                    else setIsPlaying(true);
                  } else {
                    if (onOpen) onOpen(data, { autoplay: false });
                  }
                }}
              >
                {btn.type === 'play' ? '▶' : 'ℹ'} {btn.label}
              </motion.button>
            ))}
          </div>

          {data.footerText && <p className="mt-4 text-xs text-slate-400">{data.footerText}</p>}
        </motion.div>
      </div>
    </section>
  );
}
