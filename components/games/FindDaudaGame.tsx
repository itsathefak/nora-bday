"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const DEV_TARGET_MODE = false;
const BEST_KEY = "dauda-find-dauda-best";
const THUMBNAIL = "/videos/dauda/games/find-dauda/find-dauda.png";
const AUDIO = {
  found: "/sounds/dauda/found.mp3",
  wrong: "/sounds/dauda/wrong.mp3",
  hint: "/sounds/dauda/hint.mp3",
  complete: "/sounds/dauda/complete.mp3",
};

interface DaudaTarget {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hint: string;
}

interface FindDaudaData {
  image: string;
  totalTargets: number;
  timeLimit: number;
  maxHints: number;
  targets: DaudaTarget[];
}

interface BestResult {
  bestTime: number;
  bestScore: number;
  fewestWrongClicks: number;
}

interface ClickMarker {
  id: number;
  x: number;
  y: number;
  type: "wrong" | "found";
}

interface DevRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageOverlayRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getContainedImageRect(
  container: HTMLDivElement,
  image: HTMLImageElement,
) {
  const containerRect = container.getBoundingClientRect();
  const naturalWidth = image.naturalWidth || containerRect.width;
  const naturalHeight = image.naturalHeight || containerRect.height;
  const scale = Math.min(
    containerRect.width / naturalWidth,
    containerRect.height / naturalHeight,
  );
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const left = containerRect.left + (containerRect.width - width) / 2;
  const top = containerRect.top + (containerRect.height - height) / 2;
  return { left, top, width, height };
}

function pointToImagePercent(
  event: React.PointerEvent,
  container: HTMLDivElement | null,
  image: HTMLImageElement | null,
) {
  if (!container || !image) return null;

  const rect = getContainedImageRect(container, image);
  const clientX = event.clientX;
  const clientY = event.clientY;

  if (
    clientX < rect.left ||
    clientX > rect.left + rect.width ||
    clientY < rect.top ||
    clientY > rect.top + rect.height
  ) {
    return null;
  }

  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
  };
}

function isPointInsideTarget(point: { x: number; y: number }, target: DaudaTarget) {
  return (
    point.x >= target.x &&
    point.x <= target.x + target.width &&
    point.y >= target.y &&
    point.y <= target.y + target.height
  );
}

function getTargetArea(target: DaudaTarget) {
  return target.width * target.height;
}

function getWrongMessage() {
  const messages = [
    "No Dauda here.",
    "Only bedding and disappointment.",
    "Tiny hamster not detected.",
    "Dauda remains hidden from management.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function calculateScore({
  data,
  wrongClicks,
  hintsUsed,
  remainingTime,
}: {
  data: FindDaudaData;
  wrongClicks: number;
  hintsUsed: number;
  remainingTime: number;
}) {
  const elapsed = data.timeLimit - remainingTime;
  let score = 600;
  score -= wrongClicks * 20;
  score -= hintsUsed * 50;
  score -= Math.floor(elapsed / 10) * 15;
  if (wrongClicks === 0) score += 100;
  if (hintsUsed === 0) score += 100;
  if (remainingTime > 30) score += 100;
  return Math.max(100, Math.min(900, score));
}

function getResultMessage(score: number) {
  if (score >= 820) {
    return {
      title: "Supreme Dauda Detective 🏆",
      message: "No tunnel, house, or bedding pile can hide her from you.",
    };
  }
  if (score >= 650) {
    return {
      title: "Certified Tiny-Hamster Tracker 🐹",
      message: "Dauda may need to improve her hiding strategy.",
    };
  }
  if (score >= 420) {
    return {
      title: "Assistant Habitat Investigator",
      message: "You found her eventually.",
    };
  }
  return {
    title: "Suspiciously Bad at Finding Hamsters",
    message: "Dauda recommends checking the obvious tunnel next time.",
  };
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function SafeImage({
  src,
  alt,
  fallback,
  className,
  onLoad,
}: {
  src: string;
  alt: string;
  fallback: string;
  className: string;
  onLoad?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={[
          className,
          "flex items-center justify-center bg-gradient-to-br from-amber-950/70 via-black to-red-950/50 text-7xl",
        ].join(" ")}
        aria-label={alt}
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setFailed(true)}
      onLoad={onLoad}
      className={className}
    />
  );
}

export function FindDaudaGame({ data }: { data: FindDaudaData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const markerIdRef = useRef(0);
  const wrongTimeoutsRef = useRef<number[]>([]);
  const [imageOverlayRect, setImageOverlayRect] =
    useState<ImageOverlayRect | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameFailed, setGameFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [foundTargetIds, setFoundTargetIds] = useState<string[]>([]);
  const [remainingTime, setRemainingTime] = useState(data.timeLimit);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(data.maxHints);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [clickMarkers, setClickMarkers] = useState<ClickMarker[]>([]);
  const [toast, setToast] = useState("");
  const [hintTargetId, setHintTargetId] = useState("");
  const [revealRemaining, setRevealRemaining] = useState(false);
  const [bestResult, setBestResult] = useState<BestResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [devTargets, setDevTargets] = useState<DaudaTarget[]>([]);
  const [devDragStart, setDevDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [devDraftRect, setDevDraftRect] = useState<DevRect | null>(null);

  const foundIds = useMemo(() => new Set(foundTargetIds), [foundTargetIds]);
  const remainingTargets = data.targets.filter((target) => !foundIds.has(target.id));
  const completionTime = data.timeLimit - remainingTime;
  const score = calculateScore({ data, wrongClicks, hintsUsed, remainingTime });
  const result = getResultMessage(score);

  const playSound = (src: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(src);
    audio.volume = 0.25;
    audio.play().catch(() => undefined);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1400);
  };

  const resetGame = () => {
    wrongTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
    wrongTimeoutsRef.current = [];
    setGameStarted(true);
    setGameCompleted(false);
    setGameFailed(false);
    setPaused(false);
    setFoundTargetIds([]);
    setRemainingTime(data.timeLimit);
    setWrongClicks(0);
    setHintsRemaining(data.maxHints);
    setHintsUsed(0);
    setClickMarkers([]);
    setToast("");
    setHintTargetId("");
    setRevealRemaining(false);
    setDevDragStart(null);
    setDevDraftRect(null);
  };

  useEffect(() => {
    const saved = window.localStorage.getItem(BEST_KEY);
    if (!saved) return;
    try {
      setBestResult(JSON.parse(saved) as BestResult);
    } catch {
      setBestResult(null);
    }
  }, []);

  useEffect(() => {
    if (
      !gameStarted ||
      gameCompleted ||
      gameFailed ||
      paused ||
      DEV_TARGET_MODE
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        setRemainingTime((value) => Math.max(0, value - 1));
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [gameCompleted, gameFailed, gameStarted, paused]);

  useEffect(() => {
    if (!gameStarted || gameCompleted || gameFailed || DEV_TARGET_MODE) return;

    if (foundTargetIds.length >= data.totalTargets) {
      setGameCompleted(true);
      playSound(AUDIO.complete);
      setBestResult((current) => {
        const next: BestResult = {
          bestTime:
            !current?.bestTime || completionTime < current.bestTime
              ? completionTime
              : current.bestTime,
          bestScore:
            !current?.bestScore || score > current.bestScore
              ? score
              : current.bestScore,
          fewestWrongClicks:
            current?.fewestWrongClicks === undefined ||
            wrongClicks < current.fewestWrongClicks
              ? wrongClicks
              : current.fewestWrongClicks,
        };
        window.localStorage.setItem(BEST_KEY, JSON.stringify(next));
        return next;
      });
      return;
    }

    if (remainingTime <= 0) {
      setGameFailed(true);
    }
  }, [
    completionTime,
    data.totalTargets,
    foundTargetIds.length,
    gameCompleted,
    gameFailed,
    gameStarted,
    remainingTime,
    score,
    wrongClicks,
  ]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(
    () => () => {
      wrongTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
    },
    [],
  );

  const updateImageOverlayRect = () => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return;

    const imageRect = getContainedImageRect(container, image);
    const containerRect = container.getBoundingClientRect();
    setImageOverlayRect({
      left: imageRect.left - containerRect.left,
      top: imageRect.top - containerRect.top,
      width: imageRect.width,
      height: imageRect.height,
    });
  };

  useEffect(() => {
    if (!gameStarted) return;
    updateImageOverlayRect();
    window.addEventListener("resize", updateImageOverlayRect);
    return () => window.removeEventListener("resize", updateImageOverlayRect);
  }, [gameStarted]);

  const addMarker = (point: { x: number; y: number }, type: "wrong" | "found") => {
    const id = markerIdRef.current + 1;
    markerIdRef.current = id;
    setClickMarkers((current) => [...current, { id, x: point.x, y: point.y, type }]);

    if (type === "wrong") {
      const timeout = window.setTimeout(() => {
        setClickMarkers((current) => current.filter((marker) => marker.id !== id));
      }, 950);
      wrongTimeoutsRef.current.push(timeout);
    }
  };

  const handleGameClick = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!gameStarted || gameCompleted || gameFailed || paused) return;

    const point = pointToImagePercent(event, containerRef.current, imageRef.current);
    if (!point) return;

    if (DEV_TARGET_MODE) {
      setDevDragStart(point);
      setDevDraftRect({ ...point, width: 0, height: 0 });
      return;
    }

    const matchingTargets = remainingTargets
      .filter((target) => isPointInsideTarget(point, target))
      .sort((a, b) => getTargetArea(a) - getTargetArea(b));
    const target = matchingTargets[0];

    if (target) {
      setFoundTargetIds((current) => [...current, target.id]);
      addMarker(
        {
          x: target.x + target.width / 2,
          y: target.y + target.height / 2,
        },
        "found",
      );
      setRemainingTime((value) => Math.min(data.timeLimit, value + 2));
      showToast("Dauda found! 🐹");
      playSound(AUDIO.found);
      return;
    }

    setWrongClicks((value) => value + 1);
    setRemainingTime((value) => Math.max(0, value - 2));
    addMarker(point, "wrong");
    showToast(getWrongMessage());
    playSound(AUDIO.wrong);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!DEV_TARGET_MODE || !devDragStart) return;

    const point = pointToImagePercent(event, containerRef.current, imageRef.current);
    if (!point) return;

    setDevDraftRect({
      x: Math.min(devDragStart.x, point.x),
      y: Math.min(devDragStart.y, point.y),
      width: Math.abs(point.x - devDragStart.x),
      height: Math.abs(point.y - devDragStart.y),
    });
  };

  const handlePointerUp = () => {
    if (!DEV_TARGET_MODE || !devDraftRect) return;

    if (devDraftRect.width > 0.5 && devDraftRect.height > 0.5) {
      const nextIndex = devTargets.length + 1;
      setDevTargets((current) => [
        ...current,
        {
          id: `dauda-${nextIndex}`,
          x: Number(devDraftRect.x.toFixed(2)),
          y: Number(devDraftRect.y.toFixed(2)),
          width: Number(devDraftRect.width.toFixed(2)),
          height: Number(devDraftRect.height.toFixed(2)),
          hint: "Add a hint here.",
        },
      ]);
    }

    setDevDragStart(null);
    setDevDraftRect(null);
  };

  const useHint = () => {
    if (
      hintsRemaining <= 0 ||
      !remainingTargets.length ||
      gameCompleted ||
      gameFailed ||
      paused
    ) {
      return;
    }

    const target = remainingTargets[0];
    setHintTargetId(target.id);
    setHintsRemaining((value) => value - 1);
    setHintsUsed((value) => value + 1);
    showToast(target.hint);
    playSound(AUDIO.hint);

    window.setTimeout(() => setHintTargetId(""), 1700);
  };

  const devTargetJson = JSON.stringify(devTargets, null, 2);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-950/25 via-black to-black px-5 py-20 text-white md:px-8">
      <div className="absolute left-[-10rem] top-16 h-96 w-96 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-[-10rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-400/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
        <div className="absolute left-[8%] top-[20%] text-5xl">🌻</div>
        <div className="absolute right-[12%] top-[16%] text-4xl">🐹</div>
        <div className="absolute bottom-[16%] left-[44%] text-5xl">🌻</div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <Link
          href="/profile/dauda"
          className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Back to Dauda Games
        </Link>

        <AnimatePresence mode="wait">
          {!gameStarted && (
            <motion.section
              key="start"
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
              exit={reducedMotion ? {} : { opacity: 0, y: -18 }}
              className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/50 backdrop-blur"
            >
              <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="flex min-h-[420px] items-center justify-center bg-black/40 p-4">
                  <SafeImage
                    src={THUMBNAIL}
                    alt="Find Dauda thumbnail"
                    fallback="🐹"
                    className="max-h-[560px] w-full object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">
                    Dauda Studios Game
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                    Find Dauda
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-amber-100">
                    Six tiny Daudas are hiding in one habitat. Find them before
                    they disappear into the bedding.
                  </p>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                    Search Dauda’s habitat, click every hidden hamster, and prove
                    that no bedding pile can fool you.
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <StatCard
                      label="Best time"
                      value={bestResult ? formatTime(bestResult.bestTime) : "--"}
                    />
                    <StatCard
                      label="Best score"
                      value={bestResult?.bestScore ?? "--"}
                    />
                    <StatCard
                      label="Fewest wrong"
                      value={bestResult?.fewestWrongClicks ?? "--"}
                    />
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={resetGame}
                      className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                    >
                      Start Searching
                    </button>
                    <Link
                      href="/profile/dauda"
                      className="rounded-md bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15"
                    >
                      Back to Dauda Games
                    </Link>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {gameStarted && (
            <motion.section
              key="game"
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
              exit={reducedMotion ? {} : { opacity: 0, y: -18 }}
              className="mt-8"
            >
              <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
                    Find Dauda
                  </p>
                  <h1 className="mt-2 text-3xl font-black md:text-5xl">
                    Tiny Habitat Investigation
                  </h1>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <StatCard
                    label="Found"
                    value={`${foundTargetIds.length} / ${data.totalTargets}`}
                  />
                  <StatCard label="Timer" value={formatTime(remainingTime)} />
                  <StatCard label="Hints" value={hintsRemaining} />
                  <StatCard label="Wrong" value={wrongClicks} />
                  <StatCard label="Best" value={bestResult?.bestScore ?? "--"} />
                </div>
              </header>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetGame}
                  className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                >
                  Restart
                </button>
                <button
                  type="button"
                  onClick={useHint}
                  disabled={
                    hintsRemaining <= 0 ||
                    gameCompleted ||
                    gameFailed ||
                    paused ||
                    !remainingTargets.length
                  }
                  className="rounded-md bg-amber-500 px-5 py-3 font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Use Hint
                </button>
                <button
                  type="button"
                  onClick={() => setPaused((value) => !value)}
                  disabled={gameCompleted || gameFailed}
                  className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15 disabled:opacity-45"
                >
                  {paused ? "Resume" : "Pause"}
                </button>
                <button
                  type="button"
                  onClick={() => setReducedMotion((value) => !value)}
                  className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                >
                  Reduced Motion: {reducedMotion ? "On" : "Off"}
                </button>
                <button
                  type="button"
                  onClick={() => setSoundEnabled((value) => !value)}
                  className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                >
                  Sound: {soundEnabled ? "On" : "Muted"}
                </button>
                <Link
                  href="/profile/dauda"
                  className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                >
                  Back
                </Link>
              </div>

              <div className="relative mt-5 overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-black/55">
                <div
                  ref={containerRef}
                  onPointerDown={handleGameClick}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="relative flex h-[72vh] min-h-[420px] touch-manipulation items-center justify-center overflow-hidden bg-black cursor-[crosshair]"
                >
                  <img
                    ref={imageRef}
                    src={data.image}
                    alt="Hidden-object habitat scene with six hidden Daudas"
                    className="h-full w-full object-contain"
                    draggable={false}
                    onLoad={updateImageOverlayRect}
                  />

                  {imageOverlayRect && (
                    <div
                      className="pointer-events-none absolute"
                      style={{
                        left: imageOverlayRect.left,
                        top: imageOverlayRect.top,
                        width: imageOverlayRect.width,
                        height: imageOverlayRect.height,
                      }}
                    >
                      {data.targets.map((target) => {
                        const found = foundIds.has(target.id);
                        const reveal =
                          found || revealRemaining || target.id === hintTargetId;
                        if (!reveal && !DEV_TARGET_MODE) return null;

                        return (
                          <motion.div
                            key={target.id}
                            initial={reducedMotion ? false : { opacity: 0, scale: 0.75 }}
                            animate={
                              reducedMotion
                                ? {}
                                : {
                                    opacity:
                                      target.id === hintTargetId && !found
                                        ? [0.08, 0.48, 0.08]
                                        : 1,
                                    scale:
                                      target.id === hintTargetId && !found
                                        ? [1, 1.18, 1]
                                        : 1,
                                  }
                            }
                            transition={{
                              duration:
                                target.id === hintTargetId && !found ? 0.7 : 0.25,
                              repeat:
                                target.id === hintTargetId && !found && !reducedMotion
                                  ? 2
                                  : 0,
                            }}
                            className={[
                              "absolute rounded-full border-4",
                              found
                                ? "border-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.8)]"
                                : "border-red-300/75 shadow-[0_0_26px_rgba(248,113,113,0.55)]",
                            ].join(" ")}
                            style={{
                              left: `${target.x}%`,
                              top: `${target.y}%`,
                              width: `${target.width}%`,
                              height: `${target.height}%`,
                            }}
                          >
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2 py-1 text-xs font-black text-white">
                              {found ? "Found" : "Not found"}
                            </span>
                          </motion.div>
                        );
                      })}

                      <AnimatePresence>
                        {clickMarkers.map((marker) => (
                          <motion.div
                            key={marker.id}
                            initial={reducedMotion ? false : { opacity: 0, scale: 0.5 }}
                            animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
                            exit={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={{
                              left: `${marker.x}%`,
                              top: `${marker.y}%`,
                            }}
                          >
                            {marker.type === "found" ? (
                              <motion.span
                                animate={
                                  reducedMotion
                                    ? {}
                                    : {
                                        opacity: [0, 1, 0],
                                        scale: [0.7, 1.4, 1.8],
                                      }
                                }
                                transition={{ duration: 1 }}
                                className="block text-5xl"
                              >
                                ✨🌻
                              </motion.span>
                            ) : (
                              <span className="block rounded-full bg-red-600 px-3 py-1 text-2xl font-black text-white shadow-2xl shadow-red-950/60">
                                ×
                              </span>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {DEV_TARGET_MODE && devDraftRect && (
                        <div
                          className="absolute border-2 border-sky-300 bg-sky-400/15"
                          style={{
                            left: `${devDraftRect.x}%`,
                            top: `${devDraftRect.y}%`,
                            width: `${devDraftRect.width}%`,
                            height: `${devDraftRect.height}%`,
                          }}
                        />
                      )}
                    </div>
                  )}

                  {paused && !gameCompleted && !gameFailed ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => setPaused(false)}
                        className="rounded-2xl bg-white px-6 py-4 text-xl font-black text-black"
                      >
                        Resume Search
                      </button>
                    </div>
                  ) : null}
                </div>

                <AnimatePresence>
                  {toast && (
                    <motion.div
                      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                      animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                      exit={reducedMotion ? {} : { opacity: 0, y: 12 }}
                      className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-5 py-3 text-sm font-black text-white shadow-2xl"
                    >
                      {toast}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {(gameCompleted || (gameFailed && !revealRemaining)) && (
                    <motion.div
                      initial={reducedMotion ? false : { opacity: 0 }}
                      animate={reducedMotion ? {} : { opacity: 1 }}
                      exit={reducedMotion ? {} : { opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
                    >
                      <div className="max-w-2xl rounded-3xl border border-white/10 bg-zinc-950/95 p-8 text-center shadow-2xl shadow-black">
                        <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">
                          Investigation Report
                        </p>
                        <h2 className="mt-4 text-4xl font-black md:text-5xl">
                          {gameCompleted ? "All Daudas Found! 🏆" : "Dauda Wins This Round"}
                        </h2>
                        <p className="mt-5 text-lg leading-relaxed text-slate-300">
                          {gameCompleted
                            ? "Not one tiny hamster escaped your investigation."
                            : `You found ${foundTargetIds.length} out of ${data.totalTargets}. The remaining Daudas have successfully vanished into the habitat.`}
                        </p>
                        {gameCompleted ? (
                          <p className="mt-4 text-lg font-black text-amber-100">
                            {result.title}
                          </p>
                        ) : null}

                        <div className="mt-7 grid gap-3 sm:grid-cols-5">
                          <StatCard
                            label={gameCompleted ? "Time" : "Found"}
                            value={
                              gameCompleted
                                ? formatTime(completionTime)
                                : `${foundTargetIds.length} / ${data.totalTargets}`
                            }
                          />
                          <StatCard label="Wrong" value={wrongClicks} />
                          <StatCard label="Hints" value={hintsUsed} />
                          <StatCard label="Score" value={gameCompleted ? score : "--"} />
                          <StatCard
                            label="Best"
                            value={bestResult ? bestResult.bestScore : "--"}
                          />
                        </div>

                        {gameCompleted ? (
                          <p className="mt-5 text-slate-300">{result.message}</p>
                        ) : null}

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                          <button
                            type="button"
                            onClick={resetGame}
                            className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                          >
                            {gameCompleted ? "Play Again" : "Try Again"}
                          </button>
                          {gameFailed && (
                            <button
                              type="button"
                              onClick={() => setRevealRemaining(true)}
                              className="rounded-md bg-amber-500 px-6 py-3 text-base font-bold text-black transition hover:bg-amber-400"
                            >
                              Reveal Remaining Daudas
                            </button>
                          )}
                          <Link
                            href="/profile/dauda"
                            className="rounded-md bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15"
                          >
                            Back to Dauda Games
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {DEV_TARGET_MODE && (
                <div className="mt-5 rounded-3xl border border-sky-300/30 bg-sky-950/25 p-5">
                  <h2 className="text-lg font-black text-white">
                    Dev Target Setup Mode
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Drag rectangles over each Dauda. Copy this array into
                    `data/dauda/findDauda.json`.
                  </p>
                  <textarea
                    readOnly
                    value={devTargetJson}
                    className="mt-4 h-64 w-full rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-slate-100"
                  />
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(devTargetJson)}
                      className="rounded-md bg-white px-5 py-3 font-bold text-black transition hover:bg-slate-200"
                    >
                      Copy Target JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setDevTargets((current) => current.slice(0, -1))}
                      className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                    >
                      Delete Last
                    </button>
                    <button
                      type="button"
                      onClick={() => setDevTargets([])}
                      className="rounded-md bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-500"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
