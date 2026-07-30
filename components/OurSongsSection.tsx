"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { NoraSong, noraSongs } from "../data/nora/ourSongs";

type SavedSong = {
  id: string;
  title: string;
  artist: string;
  year: number;
  thumbnail: string;
};

const SONG_KEEP_FOREVER_KEY = "noraflix-nora-songs-keep-forever";

function formatSongTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || target.isContentEditable;
}

function getRandomPhotoIndex(photoCount: number) {
  if (photoCount <= 1) return 0;
  return Math.floor(Math.random() * photoCount);
}

function getNextPhotoIndex(current: number, total: number) {
  if (total <= 1) return 0;
  return (current + 1) % total;
}

function saveSongShape(song: NoraSong): SavedSong {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    year: song.year,
    thumbnail: song.thumbnail,
  };
}

function SongFallback({ song }: { song: NoraSong }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_70%_20%,rgba(248,113,113,0.34),transparent_34%),linear-gradient(135deg,#220306,#080808_55%,#3b0608)] p-6 text-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.34em] text-red-300">
          NoraFlix Mix
        </p>
        <p className="mt-3 text-3xl font-black text-white">{song.title}</p>
        <p className="mt-2 text-sm font-bold text-slate-300">
          {song.artist} • {song.year}
        </p>
      </div>
    </div>
  );
}

function SafeSongImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

function KeepSongForeverButton({
  saved,
  onToggle,
  compact = false,
}: {
  saved: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      aria-label={saved ? "Remove song from Keep Forever" : "Keep song forever"}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400",
        saved
          ? "bg-red-600 text-white hover:bg-red-500"
          : "bg-white/10 text-white hover:bg-white/15",
        compact ? "px-3 py-2 text-xs" : "px-4 py-2 text-sm",
      ].join(" ")}
    >
      {saved ? "♥ Kept Forever" : "♡ Keep Forever"}
    </button>
  );
}

function SongCard({
  song,
  saved,
  onOpen,
  onPlay,
  onToggleKeep,
}: {
  song: NoraSong;
  saved: boolean;
  onOpen: (song: NoraSong, play?: boolean) => void;
  onPlay: (song: NoraSong) => void;
  onToggleKeep: (song: NoraSong) => void;
}) {
  const open = () => {
    if (song.available) onOpen(song);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  };

  return (
    <motion.div
      tabIndex={0}
      role="button"
      aria-label={`Open ${song.title} by ${song.artist}`}
      onClick={open}
      onKeyDown={onKeyDown}
      whileHover={song.available ? { scale: 1.045, y: -8 } : { scale: 1.01 }}
      className={[
        "group relative w-[82vw] flex-none cursor-pointer rounded-lg outline-none sm:w-[440px] lg:w-[520px]",
        song.available
          ? "focus-visible:ring-4 focus-visible:ring-red-500"
          : "cursor-default opacity-75",
      ].join(" ")}
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-950 shadow-2xl shadow-black/60">
        <SafeSongImage
          src={song.thumbnail}
          alt={`${song.title} thumbnail`}
          fallback={<SongFallback song={song} />}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-red-100">
          {song.year}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-black text-white">
          ♪ Our Song of {song.year}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 transition duration-200 group-hover:pb-24">
          <h3 className="text-2xl font-black text-white">{song.title}</h3>
          <p className="mt-1 text-sm font-bold text-slate-300">{song.artist}</p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-4 bg-gradient-to-t from-black via-black/88 to-transparent p-4 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-300">
            {song.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPlay(song);
              }}
              className="rounded-full bg-white px-4 py-2 text-sm font-black text-black hover:bg-slate-200"
              aria-label={`Play ${song.title}`}
            >
              ▶ Play
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpen(song);
              }}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15"
              aria-label={`Open player for ${song.title}`}
            >
              Open Player
            </button>
            <KeepSongForeverButton
              saved={saved}
              compact
              onToggle={() => onToggleKeep(song)}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SongProgressBar({
  currentTime,
  duration,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}) {
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <label className="block flex-1">
      <span className="sr-only">Song progress</span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || currentTime)}
        onChange={(event) => onSeek(Number(event.target.value))}
        className="song-range h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15"
        style={{
          background: `linear-gradient(90deg, #dc2626 0%, #dc2626 ${percent}%, rgba(255,255,255,0.16) ${percent}%, rgba(255,255,255,0.16) 100%)`,
        }}
      />
    </label>
  );
}

function PhotoSlideshow({
  song,
  photos,
  photoIndex,
  reducedMotion,
}: {
  song: NoraSong;
  photos: string[];
  photoIndex: number;
  reducedMotion: boolean;
}) {
  if (photos.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-black text-sm font-bold text-slate-400">
        Add images to public/images/bb
      </div>
    );
  }

  const src = photos[photoIndex];
  const nextSrc = photos[(photoIndex + 1) % photos.length];

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <link rel="preload" as="image" href={nextSrc} />
      <AnimatePresence mode="wait">
        <motion.img
          key={`${song.id}-${src}`}
          src={src}
          alt={`${song.title} slideshow photo ${photoIndex + 1}`}
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.015 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.18 : 0.55 }}
          className="absolute inset-0 h-full w-full object-contain"
        />
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.36)_100%)]" />
    </div>
  );
}

function NoraMusicModal({
  song,
  photos,
  saved,
  initialPlay,
  onClose,
  onToggleKeep,
}: {
  song: NoraSong | null;
  photos: string[];
  saved: boolean;
  initialPlay: boolean;
  onClose: () => void;
  onToggleKeep: (song: NoraSong) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const controlsHideTimerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    if (!song) return;
    setPhotoIndex(getRandomPhotoIndex(photos.length));
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [song, photos.length]);

  useEffect(() => {
    if (!song) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === " ") {
        event.preventDefault();
        togglePlayback();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seekBy(-5);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        seekBy(5);
      } else if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        toggleMute();
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        requestFullscreen();
      } else if (event.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === playerShellRef.current);
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.setTimeout(
      () => modalRef.current?.querySelector<HTMLElement>("button")?.focus(),
      0,
    );

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (controlsHideTimerRef.current)
        window.clearTimeout(controlsHideTimerRef.current);
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined);
      }
    };
  }, [song, onClose]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !song) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted, song]);

  useEffect(() => {
    if (!song || !initialPlay) return;
    window.setTimeout(() => {
      audioRef.current?.play().catch(() => undefined);
    }, 0);
  }, [song, initialPlay]);

  useEffect(() => {
    if (!song || !playing) return;
    const interval = window.setInterval(() => {
      setPhotoIndex((current) => getNextPhotoIndex(current, photos.length));
    }, 1500);
    return () => window.clearInterval(interval);
  }, [song, photos.length, playing, reducedMotion]);

  if (!song) return null;

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(time, audio.duration || time));
    setCurrentTime(audio.currentTime);
  };

  function seekBy(amount: number) {
    const audio = audioRef.current;
    if (!audio) return;
    seekTo(audio.currentTime + amount);
  }

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }

  function toggleMute() {
    setMuted((current) => !current);
  }

  function requestFullscreen() {
    const shell = playerShellRef.current;
    if (!shell) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      shell.requestFullscreen().catch(() => undefined);
    }
  }

  const showFullscreenControls = () => {
    setControlsVisible(true);
    if (controlsHideTimerRef.current)
      window.clearTimeout(controlsHideTimerRef.current);
    if (isFullscreen) {
      controlsHideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 2200);
    }
  };

  const playerControls = (
    <div
      className={[
        "transition duration-300",
        isFullscreen
          ? "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-4 md:p-8"
          : "mt-5",
        isFullscreen && !controlsVisible
          ? "translate-y-4 opacity-0"
          : "translate-y-0 opacity-100",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            setPhotoIndex((current) =>
              photos.length === 0
                ? 0
                : (current - 1 + photos.length) % photos.length,
            )
          }
          aria-label="Previous photo"
          className="rounded-full bg-white/10 px-4 py-3 font-black text-white hover:bg-white/15"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={playing ? "Pause song" : "Play song"}
          className="h-14 w-14 rounded-full bg-white text-xl font-black text-black hover:bg-slate-200"
        >
          {playing ? "Ⅱ" : "▶"}
        </button>
        <button
          type="button"
          onClick={() =>
            setPhotoIndex((current) =>
              photos.length === 0 ? 0 : (current + 1) % photos.length,
            )
          }
          aria-label="Next photo"
          className="rounded-full bg-white/10 px-4 py-3 font-black text-white hover:bg-white/15"
        >
          ›
        </button>
        <button
          type="button"
          onClick={() => {
            seekTo(0);
            setPhotoIndex(0);
          }}
          aria-label="Restart song"
          className="rounded-full bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15"
        >
          Restart
        </button>

        <div className="order-last flex w-full items-center gap-3 md:order-none md:min-w-[260px] md:flex-1">
          <span className="w-11 text-right text-xs font-bold text-slate-300">
            {formatSongTime(currentTime)}
          </span>
          <SongProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={seekTo}
          />
          <span className="w-11 text-xs font-bold text-slate-300">
            {formatSongTime(duration)}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute song" : "Mute song"}
          className="rounded-full bg-white/10 px-4 py-3 font-black text-white hover:bg-white/15"
        >
          {muted ? "Muted" : "Vol"}
        </button>
        <label className="hidden items-center gap-2 md:flex">
          <span className="sr-only">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="h-2 w-24 cursor-pointer appearance-none rounded-full bg-white/20 accent-red-600"
          />
        </label>
        <button
          type="button"
          onClick={requestFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="rounded-full bg-white/10 px-4 py-3 font-black text-white hover:bg-white/15"
        >
          ⛶
        </button>
        <KeepSongForeverButton
          saved={saved}
          onToggle={() => onToggleKeep(song)}
        />
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[95] flex items-center justify-center px-3 py-5 md:px-6"
      >
        <button
          type="button"
          aria-label="Close music player backdrop"
          onClick={onClose}
          className="absolute inset-0 cursor-default bg-black/82"
        />
        <motion.div
          ref={modalRef}
          initial={{ y: 28, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 18, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="relative z-10 max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-white/10 bg-neutral-950 p-4 text-white shadow-2xl shadow-black md:p-6"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close music player"
            className="absolute right-5 top-5 z-20 rounded-full bg-black/70 px-3 py-2 font-black text-white hover:bg-black"
          >
            ✕
          </button>

          <div className="mb-4 pr-12">
            <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-red-200">
              {song.year}
            </span>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              {song.title}
            </h2>
            <p className="mt-1 text-lg font-bold text-slate-300">
              {song.artist}
            </p>
          </div>

          <div
            ref={playerShellRef}
            onMouseMove={showFullscreenControls}
            onPointerDown={showFullscreenControls}
            className={[
              "relative rounded-xl bg-black",
              isFullscreen
                ? "flex h-screen w-screen flex-col justify-center p-4"
                : "",
            ].join(" ")}
          >
            <PhotoSlideshow
              song={song}
              photos={photos}
              photoIndex={photoIndex}
              reducedMotion={reducedMotion}
            />
            {isFullscreen ? playerControls : null}
          </div>

          {!isFullscreen ? (
            <div className="pt-1">
              <div className="mt-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-2xl font-black">{song.title}</h3>
                  <p className="font-bold text-slate-300">
                    {song.artist} • Our Song of {song.year}
                  </p>
                </div>
                <p className="max-w-xl text-sm leading-relaxed text-slate-400">
                  {song.description}
                </p>
              </div>
              {playerControls}
            </div>
          ) : null}

          <audio
            ref={audioRef}
            src={song.audio}
            preload="metadata"
            loop={song.loop}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onLoadedMetadata={(event) =>
              setDuration(event.currentTarget.duration || 0)
            }
            onTimeUpdate={(event) =>
              setCurrentTime(event.currentTarget.currentTime)
            }
            onEnded={() => {
              setPlaying(false);
              if (!song.loop) setCurrentTime(0);
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function OurSongsSection() {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [selectedSong, setSelectedSong] = useState<NoraSong | null>(null);
  const [initialPlay, setInitialPlay] = useState(false);
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>([]);
  const [toastSongId, setToastSongId] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/song-photos", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { photos?: string[] }) => setPhotos(data.photos ?? []))
      .catch(() => setPhotos([]));
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SONG_KEEP_FOREVER_KEY);
      setSavedSongs(saved ? JSON.parse(saved) : []);
    } catch {
      setSavedSongs([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SONG_KEEP_FOREVER_KEY, JSON.stringify(savedSongs));
  }, [savedSongs]);

  const savedIds = useMemo(
    () => savedSongs.map((song) => song.id),
    [savedSongs],
  );

  const scroll = (direction: "left" | "right") => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({
      left:
        direction === "left" ? -row.clientWidth * 0.72 : row.clientWidth * 0.72,
      behavior: "smooth",
    });
  };

  const openSong = (song: NoraSong, play = false) => {
    if (!song.available) return;
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSelectedSong(song);
    setInitialPlay(play);
  };

  const closeSong = () => {
    setSelectedSong(null);
    setInitialPlay(false);
    window.setTimeout(() => openerRef.current?.focus(), 0);
  };

  const toggleKeep = (song: NoraSong) => {
    const willSave = !savedIds.includes(song.id);
    setSavedSongs((current) =>
      current.some((saved) => saved.id === song.id)
        ? current.filter((saved) => saved.id !== song.id)
        : [...current, saveSongShape(song)],
    );
    if (willSave) {
      setToastSongId(song.id);
      window.setTimeout(() => setToastSongId(""), 1300);
    }
  };

  return (
    <section className="relative">
      <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white md:text-3xl">
            Our Songs
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            Two years. Two songs. One story.
          </p>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Scroll Our Songs left"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-40 hidden h-16 w-11 -translate-y-1/2 items-center justify-center rounded-r-lg bg-black/70 text-2xl font-black text-white transition hover:bg-black/90 md:flex"
        >
          ‹
        </button>
        <div
          ref={rowRef}
          className="hide-scrollbar flex gap-4 overflow-x-auto overflow-y-visible px-1 pb-8 pt-2"
        >
          {noraSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              saved={savedIds.includes(song.id)}
              onOpen={openSong}
              onPlay={(song) => openSong(song, true)}
              onToggleKeep={toggleKeep}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Scroll Our Songs right"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-40 hidden h-16 w-11 -translate-y-1/2 items-center justify-center rounded-l-lg bg-black/70 text-2xl font-black text-white transition hover:bg-black/90 md:flex"
        >
          ›
        </button>
      </div>

      <NoraMusicModal
        song={selectedSong}
        photos={photos}
        saved={!!selectedSong && savedIds.includes(selectedSong.id)}
        initialPlay={initialPlay}
        onClose={closeSong}
        onToggleKeep={toggleKeep}
      />

      <AnimatePresence>
        {toastSongId && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.94 }}
            className="fixed bottom-8 left-1/2 z-[120] -translate-x-1/2 rounded-full border border-red-400/30 bg-black/90 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-red-950/50"
          >
            ♥ Song Kept Forever
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default OurSongsSection;
