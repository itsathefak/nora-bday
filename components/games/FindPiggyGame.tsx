"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const DEV_TARGET_MODE = false;

interface PiggyTarget {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hint: string;
}

interface FindPiggyData {
  image: string;
  totalPiggies: number;
  timeLimit: number;
  targets: PiggyTarget[];
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
  image: HTMLImageElement
) {
  const containerRect = container.getBoundingClientRect();
  const naturalWidth = image.naturalWidth || containerRect.width;
  const naturalHeight = image.naturalHeight || containerRect.height;
  const scale = Math.min(
    containerRect.width / naturalWidth,
    containerRect.height / naturalHeight
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
  image: HTMLImageElement | null
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

function isPointInsideTarget(point: { x: number; y: number }, target: PiggyTarget) {
  return (
    point.x >= target.x &&
    point.x <= target.x + target.width &&
    point.y >= target.y &&
    point.y <= target.y + target.height
  );
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

export function FindPiggyGame({ data }: { data: FindPiggyData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const markerIdRef = useRef(0);
  const [imageOverlayRect, setImageOverlayRect] =
    useState<ImageOverlayRect | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [foundTargetIds, setFoundTargetIds] = useState<string[]>([]);
  const [remainingTime, setRemainingTime] = useState(data.timeLimit);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameFailed, setGameFailed] = useState(false);
  const [clickMarkers, setClickMarkers] = useState<ClickMarker[]>([]);
  const [toast, setToast] = useState("");
  const [hintTargetId, setHintTargetId] = useState("");
  const [revealRemaining, setRevealRemaining] = useState(false);
  const [devTargets, setDevTargets] = useState<PiggyTarget[]>([]);
  const [devDragStart, setDevDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [devDraftRect, setDevDraftRect] = useState<DevRect | null>(null);

  const foundIds = useMemo(() => new Set(foundTargetIds), [foundTargetIds]);
  const remainingTargets = data.targets.filter((target) => !foundIds.has(target.id));
  const completionTime = data.timeLimit - remainingTime;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1200);
  };

  const resetGame = () => {
    setGameStarted(true);
    setFoundTargetIds([]);
    setRemainingTime(data.timeLimit);
    setWrongClicks(0);
    setHintsRemaining(3);
    setHintsUsed(0);
    setGameCompleted(false);
    setGameFailed(false);
    setClickMarkers([]);
    setToast("");
    setHintTargetId("");
    setRevealRemaining(false);
    setDevDragStart(null);
    setDevDraftRect(null);
  };

  useEffect(() => {
    if (!gameStarted || gameCompleted || gameFailed || DEV_TARGET_MODE) return;

    const interval = window.setInterval(() => {
      setRemainingTime((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [gameCompleted, gameFailed, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameCompleted || gameFailed) return;

    if (foundTargetIds.length >= data.totalPiggies) {
      setGameCompleted(true);
      return;
    }

    if (remainingTime <= 0) {
      setGameFailed(true);
    }
  }, [
    data.totalPiggies,
    foundTargetIds.length,
    gameCompleted,
    gameFailed,
    gameStarted,
    remainingTime,
  ]);

  const addMarker = (point: { x: number; y: number }, type: "wrong" | "found") => {
    const id = markerIdRef.current + 1;
    markerIdRef.current = id;
    setClickMarkers((current) => [...current, { id, x: point.x, y: point.y, type }]);

    if (type === "wrong") {
      window.setTimeout(() => {
        setClickMarkers((current) => current.filter((marker) => marker.id !== id));
      }, 900);
    }
  };

  const handleGameClick = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!gameStarted || gameCompleted || gameFailed) return;

    const point = pointToImagePercent(
      event,
      containerRef.current,
      imageRef.current
    );
    if (!point) return;

    if (DEV_TARGET_MODE) {
      setDevDragStart(point);
      setDevDraftRect({ ...point, width: 0, height: 0 });
      return;
    }

    const target = remainingTargets.find((item) => isPointInsideTarget(point, item));

    if (target) {
      setFoundTargetIds((current) => [...current, target.id]);
      addMarker(
        {
          x: target.x + target.width / 2,
          y: target.y + target.height / 2,
        },
        "found"
      );
      showToast("Piggy found! 🐾");
      return;
    }

    setWrongClicks((value) => value + 1);
    setRemainingTime((value) => Math.max(0, value - 2));
    addMarker(point, "wrong");
    showToast("No Porky here.");
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!DEV_TARGET_MODE || !devDragStart) return;

    const point = pointToImagePercent(
      event,
      containerRef.current,
      imageRef.current
    );
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
          id: `piggy-${nextIndex}`,
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
    if (hintsRemaining <= 0 || !remainingTargets.length || gameCompleted || gameFailed) {
      return;
    }

    const target = remainingTargets[0];
    setHintTargetId(target.id);
    setHintsRemaining((value) => value - 1);
    setHintsUsed((value) => value + 1);
    showToast(target.hint);

    window.setTimeout(() => setHintTargetId(""), 1600);
  };

  const devTargetJson = JSON.stringify(devTargets, null, 2);

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-red-950/30 via-black to-black px-5 py-20 text-white md:px-8">
      <div className="absolute left-[-10rem] top-16 h-96 w-96 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-[-10rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-red-700/15 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div className="absolute left-[8%] top-[20%] text-5xl">🐾</div>
        <div className="absolute right-[12%] top-[16%] text-4xl">🐾</div>
        <div className="absolute bottom-[16%] left-[44%] text-5xl">🐾</div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <Link
          href="/profile/piggy"
          className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Back to Piggy Games
        </Link>

        <AnimatePresence mode="wait">
          {!gameStarted && (
            <motion.section
              key="start"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/50 backdrop-blur"
            >
              <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="flex min-h-[420px] items-center justify-center bg-black/40 p-4">
                  <img
                    src="/videos/piggy/games/find-piggy/find-piggy.png"
                    alt="Find Piggy thumbnail"
                    className="max-h-[560px] w-full object-contain"
                    draggable={false}
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                    Piggy Studios Game
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                    Find Piggy
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-red-100">
                    {data.totalPiggies} Porkies are hiding in one room. Find
                    every last bit of suspicious fluff.
                  </p>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                    There are multiple Piggies hidden in one scene. Click every
                    Piggy you can find before time runs out.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={resetGame}
                      className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                    >
                      Start Searching
                    </button>
                    <Link
                      href="/profile/piggy"
                      className="rounded-md bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15"
                    >
                      Back to Piggy Games
                    </Link>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {gameStarted && (
            <motion.section
              key="game"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="mt-8"
            >
              <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
                    Find Piggy
                  </p>
                  <h1 className="mt-2 text-3xl font-black md:text-5xl">
                    Hidden Porky Investigation
                  </h1>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard
                    label="Found"
                    value={`${foundTargetIds.length} / ${data.totalPiggies}`}
                  />
                  <StatCard label="Timer" value={formatTime(remainingTime)} />
                  <StatCard label="Hints" value={hintsRemaining} />
                  <StatCard label="Wrong" value={wrongClicks} />
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
                    !remainingTargets.length
                  }
                  className="rounded-md bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Use Hint
                </button>
                <Link
                  href="/profile/piggy"
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
                    alt="Hidden-object scene with multiple Piggies"
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
                            initial={{ opacity: 0, scale: 0.75 }}
                            animate={{
                              opacity:
                                target.id === hintTargetId && !found
                                  ? [0.1, 0.55, 0.1]
                                  : 1,
                              scale:
                                target.id === hintTargetId && !found
                                  ? [1, 1.18, 1]
                                  : 1,
                            }}
                            transition={{
                              duration:
                                target.id === hintTargetId && !found ? 0.7 : 0.25,
                              repeat: target.id === hintTargetId && !found ? 2 : 0,
                            }}
                            className={[
                              "absolute rounded-full border-4",
                              found
                                ? "border-emerald-300 shadow-[0_0_24px_rgba(110,231,183,0.75)]"
                                : "border-amber-200/75 shadow-[0_0_26px_rgba(251,191,36,0.55)]",
                            ].join(" ")}
                            style={{
                              left: `${target.x}%`,
                              top: `${target.y}%`,
                              width: `${target.width}%`,
                              height: `${target.height}%`,
                            }}
                          />
                        );
                      })}

                      <AnimatePresence>
                        {clickMarkers.map((marker) => (
                          <motion.div
                            key={marker.id}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={{
                              left: `${marker.x}%`,
                              top: `${marker.y}%`,
                            }}
                          >
                            {marker.type === "found" ? (
                              <motion.span
                                animate={{
                                  opacity: [0, 1, 0],
                                  scale: [0.7, 1.4, 1.8],
                                }}
                                transition={{ duration: 1 }}
                                className="block text-5xl"
                              >
                                ✨🐾
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
                </div>

                <AnimatePresence>
                  {toast && (
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-5 py-3 text-sm font-black text-white shadow-2xl"
                    >
                      {toast}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {(gameCompleted || (gameFailed && !revealRemaining)) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
                    >
                      <div className="max-w-2xl rounded-3xl border border-white/10 bg-zinc-950/95 p-8 text-center shadow-2xl shadow-black">
                        <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                          Investigation Report
                        </p>
                        <h2 className="mt-4 text-4xl font-black md:text-5xl">
                          {gameCompleted
                            ? "Every Porky Found! 🏆"
                            : "Porky Wins This Round"}
                        </h2>
                        <p className="mt-5 text-lg leading-relaxed text-slate-300">
                          {gameCompleted
                            ? "Not one suspicious tuft of fluff escaped your investigation."
                            : `You found ${foundTargetIds.length} out of ${data.totalPiggies}. The remaining Piggies have successfully disappeared into the furniture.`}
                        </p>

                        <div className="mt-7 grid gap-3 sm:grid-cols-3">
                          <StatCard
                            label={gameCompleted ? "Time" : "Found"}
                            value={
                              gameCompleted
                                ? formatTime(completionTime)
                                : `${foundTargetIds.length} / ${data.totalPiggies}`
                            }
                          />
                          <StatCard label="Wrong Clicks" value={wrongClicks} />
                          <StatCard label="Hints Used" value={hintsUsed} />
                        </div>

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
                              className="rounded-md bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-500"
                            >
                              Reveal Remaining Piggies
                            </button>
                          )}
                          <Link
                            href="/profile/piggy"
                            className="rounded-md bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15"
                          >
                            Back to Piggy Games
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
                    Drag rectangles over each Piggy. Copy this array into
                    `data/piggy/findPiggy.json`.
                  </p>
                  <textarea
                    readOnly
                    value={devTargetJson}
                    className="mt-4 h-64 w-full rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(devTargetJson)}
                    className="mt-3 rounded-md bg-white px-5 py-3 font-bold text-black transition hover:bg-slate-200"
                  >
                    Copy Target JSON
                  </button>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default FindPiggyGame;
