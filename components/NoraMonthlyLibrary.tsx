"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { OurSongsSection } from "./OurSongsSection";

export interface MonthlyMovie {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  monthLabel: string;
  year: number;
  video: string | null;
  thumbnail: string;
  description: string;
  duration: string;
  available: boolean;
  featured: boolean;
  order: number;
}

interface ProgressRecord {
  id: string;
  currentTime: number;
  duration: number;
  completed: boolean;
  lastWatchedAt: string;
}

const KEEP_FOREVER_KEY = "noraflix-nora-keep-forever";
const PROGRESS_KEY = "noraflix-nora-progress";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getProgressPercent(progress?: ProgressRecord) {
  if (!progress?.duration) return 0;
  return Math.max(0, Math.min(100, (progress.currentTime / progress.duration) * 100));
}

function isContinueWatching(progress?: ProgressRecord) {
  const percent = getProgressPercent(progress);
  return percent > 5 && percent < 95 && !progress?.completed;
}

function PlaceholderThumbnail({ movie }: { movie: MonthlyMovie }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_65%_25%,rgba(239,68,68,0.35),transparent_34%),linear-gradient(135deg,#210305,#080808_54%,#3c0508)] p-5 text-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
          NoraFlix
        </p>
        <p className="mt-3 text-2xl font-black text-white">{movie.title}</p>
        <p className="mt-2 text-sm font-semibold text-slate-300">
          {movie.available ? movie.monthLabel : "Coming Soon"}
        </p>
      </div>
    </div>
  );
}

function SafeThumbnail({
  movie,
  className,
}: {
  movie: MonthlyMovie;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !movie.thumbnail) {
    return (
      <div className={className}>
        <PlaceholderThumbnail movie={movie} />
      </div>
    );
  }

  return (
    <img
      src={movie.thumbnail}
      alt={`${movie.title} thumbnail`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
      draggable={false}
    />
  );
}

function KeepForeverButton({
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
      aria-label={saved ? "Remove from Keep Forever" : "Keep Forever"}
      className={[
        "inline-flex items-center gap-2 rounded-full font-black transition",
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

function ProgressBar({ progress }: { progress?: ProgressRecord }) {
  const percent = getProgressPercent(progress);
  if (percent <= 0) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 h-1 bg-black/70">
      <div className="h-full bg-red-600" style={{ width: `${percent}%` }} />
    </div>
  );
}

function MonthlyMovieCard({
  movie,
  saved,
  progress,
  onOpen,
  onToggleKeep,
  onPlay,
}: {
  movie: MonthlyMovie;
  saved: boolean;
  progress?: ProgressRecord;
  onOpen: (movie: MonthlyMovie) => void;
  onToggleKeep: (movie: MonthlyMovie) => void;
  onPlay: (movie: MonthlyMovie) => void;
}) {
  const open = () => {
    if (movie.available) onOpen(movie);
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
      aria-label={
        movie.available
          ? `Open ${movie.title}`
          : `${movie.title}, coming soon`
      }
      onClick={open}
      onKeyDown={onKeyDown}
      whileHover={movie.available ? { scale: 1.06, y: -8 } : { scale: 1.02 }}
      className={[
        "group relative w-[78vw] flex-none cursor-pointer rounded-lg outline-none sm:w-[360px] md:w-[420px] lg:w-[460px]",
        movie.available ? "focus-visible:ring-4 focus-visible:ring-red-500" : "cursor-default opacity-80",
      ].join(" ")}
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-950 shadow-2xl shadow-black/50">
        <SafeThumbnail
          movie={movie}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        {!movie.available && (
          <div className="absolute left-3 top-3 rounded-full bg-black/75 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-red-100">
            Coming Soon
          </div>
        )}
        {movie.available && (
          <div className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
            Available
          </div>
        )}
        <ProgressBar progress={progress} />
        <div className="absolute bottom-0 left-0 right-0 p-4 transition duration-200 group-hover:pb-24 md:group-hover:pb-28">
          <h3 className="text-xl font-black text-white">{movie.title}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-300">
            {movie.monthLabel}
            {movie.duration ? ` • ${movie.duration}` : ""}
          </p>
        </div>

        {movie.available && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-4 bg-gradient-to-t from-black via-black/88 to-transparent p-4 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
            <p className="line-clamp-2 max-w-[92%] text-sm leading-relaxed text-slate-300">
              {movie.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onPlay(movie);
                }}
                aria-label={`Play ${movie.title}`}
                className="rounded-full bg-white px-4 py-2 text-sm font-black text-black hover:bg-slate-200"
              >
                ▶ Play
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(movie);
                }}
                aria-label={`More info for ${movie.title}`}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15"
              >
                More Info
              </button>
              <KeepForeverButton
                saved={saved}
                compact
                onToggle={() => onToggleKeep(movie)}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MonthlyMovieRow({
  title,
  items,
  savedIds,
  progressMap,
  onOpen,
  onPlay,
  onToggleKeep,
}: {
  title: string;
  items: MonthlyMovie[];
  savedIds: string[];
  progressMap: Record<string, ProgressRecord>;
  onOpen: (movie: MonthlyMovie) => void;
  onPlay: (movie: MonthlyMovie) => void;
  onToggleKeep: (movie: MonthlyMovie) => void;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: "left" | "right") => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({
      left: direction === "left" ? -row.clientWidth * 0.72 : row.clientWidth * 0.72,
      behavior: "smooth",
    });
  };

  if (!items.length) return null;

  return (
    <section className="relative">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-black text-white md:text-3xl">{title}</h2>
      </div>
      <div className="relative">
        <button
          type="button"
          aria-label={`Scroll ${title} left`}
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-40 hidden h-16 w-11 -translate-y-1/2 items-center justify-center rounded-r-lg bg-black/70 text-2xl font-black text-white transition hover:bg-black/90 md:flex"
        >
          ‹
        </button>
        <div
          ref={rowRef}
          className="hide-scrollbar flex gap-4 overflow-x-auto overflow-y-visible px-1 pb-8 pt-2"
        >
          {items.map((movie) => (
            <MonthlyMovieCard
              key={movie.id}
              movie={movie}
              saved={savedIds.includes(movie.id)}
              progress={progressMap[movie.id]}
              onOpen={onOpen}
              onPlay={onPlay}
              onToggleKeep={onToggleKeep}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label={`Scroll ${title} right`}
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-40 hidden h-16 w-11 -translate-y-1/2 items-center justify-center rounded-l-lg bg-black/70 text-2xl font-black text-white transition hover:bg-black/90 md:flex"
        >
          ›
        </button>
      </div>
    </section>
  );
}

interface VideoPlayerHandle {
  playFullscreen: (startTime?: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, {
  movie: MonthlyMovie;
  initialStartAt: number;
  onProgress: (progress: ProgressRecord) => void;
}>(function VideoPlayer({
  movie,
  initialStartAt,
  onProgress,
}, ref) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const initializedMovieIdRef = useRef("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (initializedMovieIdRef.current === movie.id) return;
    initializedMovieIdRef.current = movie.id;
    video.currentTime = initialStartAt > 0 ? initialStartAt : 0;
  }, [movie.id, initialStartAt]);

  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (!video) return;
      video.pause();
      video.currentTime = 0;
    };
  }, []);

  const save = () => {
    const video = videoRef.current;
    if (!video) return;
    onProgress({
      id: movie.id,
      currentTime: video.currentTime,
      duration: video.duration || 0,
      completed: !!video.duration && video.currentTime / video.duration >= 0.95,
      lastWatchedAt: new Date().toISOString(),
    });
  };

  const requestFullscreen = () => {
    const video = videoRef.current as (HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    }) | null;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen().catch(() => undefined);
    } else if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  };

  useImperativeHandle(ref, () => ({
    playFullscreen(startTime?: number) {
      const video = videoRef.current;
      if (!video) return;
      if (typeof startTime === "number") {
        video.currentTime = Math.max(0, startTime);
      }
      video.muted = false;
      video.play().catch(() => undefined);
      requestFullscreen();
    },
  }));

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        src={movie.video || undefined}
        controls
        playsInline
        preload="metadata"
        onTimeUpdate={save}
        onLoadedMetadata={save}
        onEnded={save}
        onDoubleClick={requestFullscreen}
        className="h-full w-full bg-black object-contain"
      />
      <button
        type="button"
        onClick={requestFullscreen}
        aria-label="Enter fullscreen"
        className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-2 text-sm font-black text-white hover:bg-black"
      >
        ⛶
      </button>
    </div>
  );
});

function NoraMediaModal({
  movie,
  movies,
  saved,
  progress,
  onClose,
  onToggleKeep,
  onSaveProgress,
  onSelectMovie,
  initialPlay,
}: {
  movie: MonthlyMovie | null;
  movies: MonthlyMovie[];
  saved: boolean;
  progress?: ProgressRecord;
  onClose: () => void;
  onToggleKeep: (movie: MonthlyMovie) => void;
  onSaveProgress: (progress: ProgressRecord) => void;
  onSelectMovie: (movie: MonthlyMovie) => void;
  initialPlay: boolean;
}) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<VideoPlayerHandle | null>(null);
  const autoFullscreenMovieIdRef = useRef("");

  useEffect(() => {
    if (!initialPlay || !movie) return;
    if (autoFullscreenMovieIdRef.current === movie.id) return;
    autoFullscreenMovieIdRef.current = movie.id;
    const resumeTime = progress?.currentTime || 0;
    window.setTimeout(() => {
      playerRef.current?.playFullscreen(resumeTime);
    }, 0);
  }, [initialPlay, movie]);

  useEffect(() => {
    if (!movie) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], video, [tabindex]:not([tabindex="-1"])',
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
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => modalRef.current?.querySelector<HTMLElement>("button")?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [movie, onClose]);

  if (!movie) return null;

  const availableMovies = movies.filter((item) => item.available);
  const currentIndex = availableMovies.findIndex((item) => item.id === movie.id);
  const previousMovie = currentIndex > 0 ? availableMovies[currentIndex - 1] : null;
  const nextMovie =
    currentIndex >= 0 && currentIndex < availableMovies.length - 1
      ? availableMovies[currentIndex + 1]
      : null;
  const hasProgress = !!progress && getProgressPercent(progress) > 5;
  const startAt = hasProgress ? progress?.currentTime || 0 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8"
      >
        <button
          type="button"
          aria-label="Close modal backdrop"
          onClick={onClose}
          className="absolute inset-0 cursor-default bg-black/80"
        />
        <motion.div
          ref={modalRef}
          initial={{ y: 28, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 18, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="relative z-10 max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-neutral-950 text-white shadow-2xl shadow-black"
        >
          <button
            type="button"
            aria-label="Close movie modal"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-full bg-black/75 px-3 py-2 font-black text-white hover:bg-black"
          >
            ✕
          </button>
          <div className="h-[42vh] min-h-[280px] bg-black md:h-[56vh]">
            {movie.video ? (
              <VideoPlayer
                ref={playerRef}
                movie={movie}
                initialStartAt={startAt}
                onProgress={onSaveProgress}
              />
            ) : (
              <div className="relative h-full w-full bg-black">
                <SafeThumbnail
                  movie={movie}
                  className="h-full w-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-neutral-950 to-transparent" />
              </div>
            )}
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-red-400">
                  {movie.monthLabel}
                </p>
                <h2 className="mt-2 text-3xl font-black md:text-5xl">
                  {movie.title}
                </h2>
                <p className="mt-2 text-lg font-semibold text-slate-200">
                  {movie.subtitle}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-400">
                  <span>{movie.year}</span>
                  {movie.duration ? <span>• {movie.duration}</span> : null}
                  <span>• Monthly Movie</span>
                </div>
                <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300">
                  {movie.description}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 md:max-w-[260px] md:justify-end">
                <button
                  type="button"
                  onClick={() => playerRef.current?.playFullscreen(startAt)}
                  disabled={!movie.video}
                  aria-label={hasProgress ? `Resume ${movie.title}` : `Play ${movie.title}`}
                  className="rounded-full bg-white px-5 py-3 font-black text-black hover:bg-slate-200 disabled:opacity-50"
                >
                  {hasProgress ? "▶ Resume" : "▶ Play"}
                </button>
                {hasProgress && (
                  <button
                    type="button"
                    onClick={() => {
                      onSaveProgress({
                        id: movie.id,
                        currentTime: 0,
                        duration: progress?.duration || 0,
                        completed: false,
                        lastWatchedAt: new Date().toISOString(),
                      });
                      playerRef.current?.playFullscreen(0);
                    }}
                    aria-label={`Restart ${movie.title}`}
                    className="rounded-full bg-white/10 px-5 py-3 font-black text-white hover:bg-white/15"
                  >
                    Restart
                  </button>
                )}
                <KeepForeverButton
                  saved={saved}
                  onToggle={() => onToggleKeep(movie)}
                />
              </div>
            </div>

            <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                disabled={!previousMovie}
                onClick={() => previousMovie && onSelectMovie(previousMovie)}
                aria-label="Previous monthly movie"
                className="rounded-full bg-white/10 px-4 py-2 font-black text-white hover:bg-white/15 disabled:opacity-35"
              >
                ‹ Previous
              </button>
              <button
                type="button"
                disabled={!nextMovie}
                onClick={() => nextMovie && onSelectMovie(nextMovie)}
                aria-label="Next monthly movie"
                className="rounded-full bg-white/10 px-4 py-2 font-black text-white hover:bg-white/15 disabled:opacity-35"
              >
                Next ›
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function NoraMonthlyLibrary({
  movies,
  featuredMovies = [],
}: {
  movies: MonthlyMovie[];
  featuredMovies?: MonthlyMovie[];
}) {
  const sortedMovies = useMemo(
    () => [...movies].sort((a, b) => a.order - b.order),
    [movies],
  );
  const sortedFeaturedMovies = useMemo(
    () => [...featuredMovies].sort((a, b) => a.order - b.order),
    [featuredMovies],
  );
  const playableMovies = useMemo(
    () => [...sortedFeaturedMovies, ...sortedMovies],
    [sortedFeaturedMovies, sortedMovies],
  );
  const [selectedMovie, setSelectedMovie] = useState<MonthlyMovie | null>(null);
  const [initialPlay, setInitialPlay] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ProgressRecord>>({});
  const [toastMovieId, setToastMovieId] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEEP_FOREVER_KEY);
      setSavedIds(saved ? JSON.parse(saved) : []);
    } catch {
      setSavedIds([]);
    }

    try {
      const savedProgress = localStorage.getItem(PROGRESS_KEY);
      setProgressMap(savedProgress ? JSON.parse(savedProgress) : {});
    } catch {
      setProgressMap({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEEP_FOREVER_KEY, JSON.stringify(savedIds));
  }, [savedIds]);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap));
  }, [progressMap]);

  const toggleKeep = (movie: MonthlyMovie) => {
    if (!movie.available) return;
    const willSave = !savedIds.includes(movie.id);
    setSavedIds((current) =>
      current.includes(movie.id)
        ? current.filter((id) => id !== movie.id)
        : [...current, movie.id],
    );
    if (willSave) {
      setToastMovieId(movie.id);
      window.setTimeout(() => setToastMovieId(""), 1300);
    }
  };

  const openMovie = (movie: MonthlyMovie, play = false) => {
    if (!movie.available) return;
    setSelectedMovie(movie);
    setInitialPlay(play);
  };

  const closeMovie = () => {
    setSelectedMovie(null);
    setInitialPlay(false);
  };

  const saveProgress = (progress: ProgressRecord) => {
    setProgressMap((current) => ({ ...current, [progress.id]: progress }));
  };

  const keepForeverMovies = playableMovies.filter((movie) => savedIds.includes(movie.id));
  const continueWatchingMovies = playableMovies.filter((movie) =>
    isContinueWatching(progressMap[movie.id]),
  );
  const originals: MonthlyMovie[] = [];

  return (
    <>
      <div className="mx-auto max-w-[1680px] space-y-2 px-4 py-12 md:px-8">
        {keepForeverMovies.length > 0 && (
          <MonthlyMovieRow
            title="Keep Forever"
            items={keepForeverMovies}
            savedIds={savedIds}
            progressMap={progressMap}
            onOpen={(movie) => openMovie(movie)}
            onPlay={(movie) => openMovie(movie, true)}
            onToggleKeep={toggleKeep}
          />
        )}

        {continueWatchingMovies.length > 0 && (
          <MonthlyMovieRow
            title="Continue Watching"
            items={continueWatchingMovies}
            savedIds={savedIds}
            progressMap={progressMap}
            onOpen={(movie) => openMovie(movie)}
            onPlay={(movie) => openMovie(movie, true)}
            onToggleKeep={toggleKeep}
          />
        )}

        {sortedFeaturedMovies.length > 0 && (
          <MonthlyMovieRow
            title="Featured"
            items={sortedFeaturedMovies}
            savedIds={savedIds}
            progressMap={progressMap}
            onOpen={(movie) => openMovie(movie)}
            onPlay={(movie) => openMovie(movie, true)}
            onToggleKeep={toggleKeep}
          />
        )}

        <MonthlyMovieRow
          title="Our Story, Month by Month"
          items={sortedMovies}
          savedIds={savedIds}
          progressMap={progressMap}
          onOpen={(movie) => openMovie(movie)}
          onPlay={(movie) => openMovie(movie, true)}
          onToggleKeep={toggleKeep}
        />

        <OurSongsSection />

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white md:text-3xl">
                NoraFlix Originals
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                Future specials, trailers, best moments, birthday edits, bloopers,
                and other NoraFlix originals will live here.
              </p>
            </div>
            <span className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-100">
              Coming Soon
            </span>
          </div>
          {originals.length > 0 ? null : (
            <div className="mt-6 aspect-[16/4] rounded-xl bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.18),transparent_38%),linear-gradient(135deg,#111,#030303)]" />
          )}
        </section>
      </div>

      <NoraMediaModal
        movie={selectedMovie}
        movies={playableMovies}
        saved={!!selectedMovie && savedIds.includes(selectedMovie.id)}
        progress={selectedMovie ? progressMap[selectedMovie.id] : undefined}
        initialPlay={initialPlay}
        onClose={closeMovie}
        onToggleKeep={toggleKeep}
        onSaveProgress={saveProgress}
        onSelectMovie={(movie) => openMovie(movie)}
      />

      <AnimatePresence>
        {toastMovieId && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.94 }}
            className="fixed bottom-8 left-1/2 z-[120] -translate-x-1/2 rounded-full border border-red-400/30 bg-black/90 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-red-950/50"
          >
            ♥ Kept Forever
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default NoraMonthlyLibrary;
