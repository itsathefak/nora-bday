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
  details?: { label: string; value: string }[];
  buttons: { type: string; label: string; icon?: string }[];
  footerText?: string;
  backdropImage?: string;
  backdropVideo?: string;
}

export function HeroBanner({
  data,
  onOpen,
}: {
  data: HeroData;
  onOpen?: (item: any, opts?: any) => void;
}) {
  const [videoError, setVideoError] = useState(false);
  const [, setIsPlaying] = useState(false);

  return (
    <section className="relative w-full min-h-[72vh] md:min-h-[84vh] overflow-hidden">
      {/* Background with optional right-side video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {data.backdropVideo && !videoError ? (
          <>
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={data.backdropImage}
              className="absolute right-0 top-0 h-full w-[58%] min-w-[520px] object-cover opacity-95 pointer-events-none z-0"
              style={{ objectPosition: "center center" }}
              onError={(e) => {
                // mark error so we can fall back to the poster image
                // eslint-disable-next-line no-console
                console.warn("Hero video failed to load", e);
                setVideoError(true);
              }}
            >
              {/* More reliable source element inside video tag */}
              <source src={data.backdropVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-y-0 left-[32%] right-0 bg-gradient-to-r from-[#160000] via-red-950/20 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-[14%] bg-gradient-to-l from-[#160000]/70 to-transparent pointer-events-none" />
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
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 73% 45%, transparent 0%, rgba(120,0,0,0.03) 18%, rgba(120,0,0,0.12) 38%, rgba(95,0,0,0.34) 66%, rgba(0,0,0,0.68) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,0,0,0.92)_0%,rgba(28,0,0,0.76)_38%,rgba(55,0,0,0.18)_63%,rgba(55,0,0,0)_88%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-black/55 pointer-events-none" />

        {/* subtle vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow:
              "inset 0 120px 140px -60px rgba(45,0,0,0.65), inset 0 -120px 140px -60px rgba(20,0,0,0.7)",
          }}
        />

        {/* soft red ambient glow */}
        <div className="absolute left-16 top-24 w-96 h-96 bg-red-900/30 rounded-full blur-3xl pointer-events-none" />

        {/* film grain overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\"0 0 400 400\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" result=\"noise\"/%3E%3C/filter%3E%3Crect width=\"400\" height=\"400\" fill=\"white\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E")',
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
          <p className="text-sm uppercase tracking-[0.4em] text-red-400 font-semibold">
            {data.label}
          </p>
          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold text-white leading-tight">
            {data.title}
          </h2>
          <p className="mt-3 text-sm text-red-300 font-medium">
            {data.matchText}
          </p>

          <p className="mt-6 text-base text-slate-200 whitespace-pre-line">
            {data.description}
          </p>

          {data.details && data.details.length > 0 && (
            <div className="mt-5 grid gap-2 text-sm text-slate-300">
              {data.details.map((detail) => (
                <p key={detail.label}>
                  <span className="font-semibold text-white">
                    {detail.label}:
                  </span>{" "}
                  {detail.value}
                </p>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-4 items-center">
            {data.buttons.map((btn) => (
              <motion.button
                key={btn.type}
                whileHover={{ scale: 1.03 }}
                className={`inline-flex items-center gap-3 px-5 py-3 rounded-md font-semibold transition ${btn.type === "play" || btn.type === "games" ? "bg-white text-black" : "bg-white/10 text-white border border-white/20"}`}
                onClick={() => {
                  if (btn.type === "games") {
                    document
                      .getElementById("profile-rows")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  } else if (btn.type === "play") {
                    if (onOpen) onOpen(data, { autoplay: true });
                    else setIsPlaying(true);
                  } else {
                    if (onOpen) onOpen(data, { autoplay: false });
                  }
                }}
              >
                {btn.icon ?? (btn.type === "play" || btn.type === "games" ? "▶" : "ℹ")} {btn.label}
              </motion.button>
            ))}
          </div>

          {data.footerText && (
            <p className="mt-4 text-xs text-slate-400">{data.footerText}</p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
