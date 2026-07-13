"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "easy" | "normal" | "chaos";
type Direction = "up" | "down" | "left" | "right";

interface Position {
  row: number;
  column: number;
}

interface Seed extends Position {
  id: string;
}

interface MazeDefinition {
  label: string;
  rows: number;
  columns: number;
  timeLimit: number;
  baseScore: number;
  optimalMoves: number;
  start: Position;
  exit: Position;
  seeds: Seed[];
  maze: string[];
}

interface HamsterMazeData {
  difficulties: Record<Difficulty, MazeDefinition>;
}

const BEST_KEY = "dauda-hamster-maze-best";
const ASSETS = {
  thumbnail: "/videos/dauda/games/hamster-maze/hamster-maze.png",
  dauda: "/videos/dauda/games/hamster-maze/dauda.png",
  seed: "/videos/dauda/games/hamster-maze/seed.png",
  house: "/videos/dauda/games/hamster-maze/house.png",
  blueTunnel: "/videos/dauda/games/hamster-maze/tunnel-blue.png",
  greenTunnel: "/videos/dauda/games/hamster-maze/tunnel-green.png",
};
const AUDIO = {
  move: "/sounds/dauda/move.mp3",
  seed: "/sounds/dauda/seed.mp3",
  wall: "/sounds/dauda/wall.mp3",
  home: "/sounds/dauda/home.mp3",
};

function positionKey(position: Position) {
  return `${position.row}:${position.column}`;
}

function getRank(score: number) {
  if (score >= 1300) {
    return {
      title: "Tiny Maze Master 🏆",
      message:
        "Dauda collected every seed and returned home like a true professional.",
    };
  }
  if (score >= 850) {
    return {
      title: "Certified Tunnel Explorer 🐹",
      message: "Strong navigation. Excellent snack awareness.",
    };
  }
  if (score >= 450) {
    return {
      title: "Part-Time Seed Scout",
      message: "Dauda made it home, eventually.",
    };
  }
  return {
    title: "Lost in the Bedding",
    message:
      "Dauda recommends more maze training and immediate sunflower seeds.",
  };
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function manhattan(a: Position, b: Position) {
  return Math.abs(a.row - b.row) + Math.abs(a.column - b.column);
}

function AssetImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setFailed(true)}
      className={className}
    />
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

function isWall(definition: MazeDefinition, position: Position) {
  const row = definition.maze[position.row];
  if (!row) return true;
  const cell = row[position.column];
  return !cell || cell === "#";
}

function findPath(
  definition: MazeDefinition,
  start: Position,
  goal: Position
) {
  const queue: Position[] = [start];
  const visited = new Set([positionKey(start)]);
  const parent = new Map<string, string>();

  while (queue.length) {
    const current = queue.shift()!;
    if (current.row === goal.row && current.column === goal.column) {
      const path: Position[] = [current];
      let key = positionKey(current);
      while (parent.has(key)) {
        key = parent.get(key)!;
        const [row, column] = key.split(":").map(Number);
        path.unshift({ row, column });
      }
      return path;
    }

    const nextPositions = [
      { row: current.row - 1, column: current.column },
      { row: current.row + 1, column: current.column },
      { row: current.row, column: current.column - 1 },
      { row: current.row, column: current.column + 1 },
    ];

    nextPositions.forEach((next) => {
      const key = positionKey(next);
      if (visited.has(key) || isWall(definition, next)) return;
      visited.add(key);
      parent.set(key, positionKey(current));
      queue.push(next);
    });
  }

  return [];
}

export function HamsterMazeGame({ data }: { data: HamsterMazeData }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameFailed, setGameFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [playerPosition, setPlayerPosition] = useState<Position>(
    data.difficulties.normal.start
  );
  const [collectedSeedIds, setCollectedSeedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [remainingTime, setRemainingTime] = useState(
    data.difficulties.normal.timeLimit
  );
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(data.difficulties.normal.baseScore);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [message, setMessage] = useState("");
  const [hintPath, setHintPath] = useState<Position[]>([]);
  const [bump, setBump] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const timerRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const definition = data.difficulties[difficulty];
  const collectedSet = useMemo(
    () => new Set(collectedSeedIds),
    [collectedSeedIds]
  );
  const allSeedsCollected = collectedSeedIds.length === definition.seeds.length;
  const elapsedTime = definition.timeLimit - remainingTime;
  const rank = getRank(score);

  const playSound = (src: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(src);
    audio.volume = 0.28;
    audio.play().catch(() => undefined);
  };

  const clearTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const calculateScore = useCallback(
    (finalMoves: number, finalHintsUsed: number, finalRemainingTime: number) => {
      const extraMoves = Math.max(0, finalMoves - definition.optimalMoves);
      const movePenalty = Math.floor(extraMoves / 5) * 20;
      const hintPenalty = finalHintsUsed * 100;
      const timePenalty = Math.floor(
        (definition.timeLimit - finalRemainingTime) / 10
      ) * 25;
      const noHintBonus = finalHintsUsed === 0 ? 150 : 0;
      const fastBonus = Math.max(0, Math.floor(finalRemainingTime * 4));

      return Math.max(
        100,
        definition.baseScore - movePenalty - hintPenalty - timePenalty + noHintBonus + fastBonus
      );
    },
    [definition.baseScore, definition.optimalMoves, definition.timeLimit]
  );

  const resetForDifficulty = (nextDifficulty = difficulty) => {
    const nextDefinition = data.difficulties[nextDifficulty];
    completedRef.current = false;
    clearTimer();
    setGameStarted(true);
    setGameCompleted(false);
    setGameFailed(false);
    setPaused(false);
    setPlayerPosition(nextDefinition.start);
    setCollectedSeedIds([]);
    setMoves(0);
    setRemainingTime(nextDefinition.timeLimit);
    setHintsRemaining(3);
    setHintsUsed(0);
    setScore(nextDefinition.baseScore);
    setMessage("");
    setHintPath([]);
    setShowSolution(false);
    setBump(false);
  };

  const completeGame = (finalMoves: number, finalHintsUsed: number) => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimer();
    const finalScore = calculateScore(finalMoves, finalHintsUsed, remainingTime);
    const completionTime = definition.timeLimit - remainingTime;
    setScore(finalScore);
    setGameCompleted(true);
    setPaused(false);
    playSound(AUDIO.home);
    setBestScore((current) => {
      const next = Math.max(current, finalScore);
      return next;
    });
    setBestTime((current) => {
      const next =
        current === null || completionTime < current ? completionTime : current;
      window.localStorage.setItem(
        BEST_KEY,
        JSON.stringify({
          time: next,
          score: Math.max(bestScore, finalScore),
        })
      );
      return next;
    });
  };

  const movePlayer = useCallback(
    (direction: Direction) => {
      if (!gameStarted || gameCompleted || gameFailed || paused) return;

      const delta =
        direction === "up"
          ? { row: -1, column: 0 }
          : direction === "down"
            ? { row: 1, column: 0 }
            : direction === "left"
              ? { row: 0, column: -1 }
              : { row: 0, column: 1 };
      const nextPosition = {
        row: playerPosition.row + delta.row,
        column: playerPosition.column + delta.column,
      };

      if (isWall(definition, nextPosition)) {
        setBump(true);
        setMessage("Closed tunnel. Dauda gently disagrees.");
        window.setTimeout(() => setBump(false), 220);
        window.setTimeout(() => setMessage(""), 1100);
        playSound(AUDIO.wall);
        return;
      }

      const nextMoves = moves + 1;
      setMoves(nextMoves);
      setPlayerPosition(nextPosition);
      setHintPath([]);
      playSound(AUDIO.move);

      const seed = definition.seeds.find(
        (item) =>
          item.row === nextPosition.row &&
          item.column === nextPosition.column &&
          !collectedSet.has(item.id)
      );

      let nextCollectedIds = collectedSeedIds;
      if (seed) {
        nextCollectedIds = [...collectedSeedIds, seed.id];
        setCollectedSeedIds(nextCollectedIds);
        setRemainingTime((value) => Math.min(definition.timeLimit, value + 2));
        setMessage("Seed collected!");
        playSound(AUDIO.seed);
        window.setTimeout(() => setMessage(""), 1000);
      }

      const reachedExit =
        nextPosition.row === definition.exit.row &&
        nextPosition.column === definition.exit.column;

      if (reachedExit && nextCollectedIds.length !== definition.seeds.length) {
        setMessage("Dauda refuses to go home without every snack.");
        window.setTimeout(() => setMessage(""), 1500);
        return;
      }

      if (reachedExit && nextCollectedIds.length === definition.seeds.length) {
        completeGame(nextMoves, hintsUsed);
      }
    },
    [
      collectedSeedIds,
      collectedSet,
      completeGame,
      definition,
      gameCompleted,
      gameFailed,
      gameStarted,
      hintsUsed,
      moves,
      paused,
      playerPosition,
    ]
  );

  const useHint = () => {
    if (hintsRemaining <= 0 || gameCompleted || gameFailed) return;

    const remainingSeeds = definition.seeds.filter(
      (seed) => !collectedSet.has(seed.id)
    );
    const target = remainingSeeds.length
      ? remainingSeeds.sort(
          (a, b) => manhattan(playerPosition, a) - manhattan(playerPosition, b)
        )[0]
      : definition.exit;
    const path = findPath(definition, playerPosition, target).slice(0, 7);
    const nextHintsUsed = hintsUsed + 1;
    setHintsRemaining((value) => value - 1);
    setHintsUsed(nextHintsUsed);
    setScore((value) => Math.max(100, value - 100));
    setHintPath(path);
    setMessage(remainingSeeds.length ? "Nearest seed direction highlighted." : "Home is glowing. Go, tiny legend.");
    window.setTimeout(() => {
      setHintPath([]);
      setMessage("");
    }, 2200);
  };

  const revealSolution = () => {
    const remainingSeeds = definition.seeds.filter(
      (seed) => !collectedSet.has(seed.id)
    );
    let cursor = playerPosition;
    let fullPath: Position[] = [];

    remainingSeeds.forEach((seed) => {
      const path = findPath(definition, cursor, seed);
      fullPath = [...fullPath, ...path.slice(1)];
      cursor = seed;
    });

    const homePath = findPath(definition, cursor, definition.exit);
    fullPath = [...fullPath, ...homePath.slice(1)];
    setHintPath(fullPath);
    setShowSolution(true);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(BEST_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      setBestTime(typeof parsed.time === "number" ? parsed.time : null);
      setBestScore(Number(parsed.score) || 0);
    } catch {
      setBestTime(null);
      setBestScore(0);
    }
  }, []);

  useEffect(() => {
    if (!gameStarted || gameCompleted || gameFailed || paused) return;
    clearTimer();
    timerRef.current = window.setInterval(() => {
      setRemainingTime((value) => {
        if (value <= 1) {
          clearTimer();
          setGameFailed(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return clearTimer;
  }, [gameCompleted, gameFailed, gameStarted, paused]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const direction =
        key === "arrowup" || key === "w"
          ? "up"
          : key === "arrowdown" || key === "s"
            ? "down"
            : key === "arrowleft" || key === "a"
              ? "left"
              : key === "arrowright" || key === "d"
                ? "right"
                : null;
      if (!direction) return;
      event.preventDefault();
      movePlayer(direction);
    };
    const handleVisibility = () => {
      if (document.hidden && gameStarted && !gameCompleted && !gameFailed) {
        setPaused(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearTimer();
    };
  }, [gameCompleted, gameFailed, gameStarted, movePlayer]);

  const renderCell = (row: number, column: number) => {
    const position = { row, column };
    const key = positionKey(position);
    const cell = definition.maze[row][column];
    const seed = definition.seeds.find(
      (item) => item.row === row && item.column === column && !collectedSet.has(item.id)
    );
    const isPlayer = playerPosition.row === row && playerPosition.column === column;
    const isExit = definition.exit.row === row && definition.exit.column === column;
    const isHint = hintPath.some((item) => item.row === row && item.column === column);
    const isWallCell = cell === "#";

    return (
      <div
        key={key}
        aria-label={
          isWallCell
            ? "Maze wall"
            : isExit
              ? "Hamster house"
              : seed
                ? "Sunflower seed"
                : "Open tunnel"
        }
        className={[
          "relative aspect-square overflow-hidden border border-black/25",
          isWallCell
            ? "bg-[linear-gradient(135deg,rgba(91,52,27,0.95),rgba(42,24,15,0.95))]"
            : "bg-[radial-gradient(circle,rgba(251,191,36,0.14),rgba(20,12,8,0.94))]",
          isHint ? "ring-2 ring-amber-200" : "",
          isExit && allSeedsCollected ? "shadow-[0_0_20px_rgba(251,191,36,0.65)]" : "",
        ].join(" ")}
      >
        {!isWallCell && !seed && !isExit && (
          <span className="absolute inset-0 flex items-center justify-center text-[0.6rem] text-amber-100/18">
            ·
          </span>
        )}
        {seed && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: reducedMotion ? 1 : [0.9, 1.12, 0.9] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="absolute inset-[18%]"
          >
            <AssetImage
              src={ASSETS.seed}
              alt="Sunflower seed"
              className="h-full w-full object-contain"
              fallback={<div className="flex h-full w-full items-center justify-center text-lg">🌻</div>}
            />
          </motion.div>
        )}
        {isExit && (
          <div className="absolute inset-[12%]">
            <AssetImage
              src={ASSETS.house}
              alt="Dauda's tiny house"
              className="h-full w-full object-contain"
              fallback={<div className="flex h-full w-full items-center justify-center text-lg">⌂</div>}
            />
          </div>
        )}
        {isPlayer && (
          <motion.div
            layout
            animate={bump && !reducedMotion ? { x: [0, -4, 4, 0] } : { x: 0 }}
            className="absolute inset-[10%] z-20"
          >
            <AssetImage
              src={ASSETS.dauda}
              alt="Dauda"
              className="h-full w-full object-contain drop-shadow-lg"
              fallback={<div className="flex h-full w-full items-center justify-center rounded-full bg-amber-200 text-lg shadow-lg">🐹</div>}
            />
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-950/25 via-black to-black px-5 py-20 text-white md:px-8">
      <div className="absolute left-[-10rem] top-10 h-96 w-96 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-[-8rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-400/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <Link href="/profile/dauda" className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
          Back to Dauda Games
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
                <div className="flex min-h-[420px] items-center justify-center bg-black/45 p-5">
                  <AssetImage
                    src={ASSETS.thumbnail}
                    alt="Hamster Maze thumbnail"
                    className="h-full max-h-[25rem] w-full object-contain"
                    fallback={<div className="flex h-72 w-full items-center justify-center rounded-3xl border border-amber-300/20 bg-[radial-gradient(circle,rgba(251,191,36,0.16),rgba(0,0,0,0.8))] text-7xl">🐹</div>}
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">Dauda Studios Game</p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Hamster Maze</h1>
                  <p className="mt-4 text-lg font-semibold text-amber-100">
                    Dauda is lost, the seeds are scattered, and the tiny house is somewhere ahead.
                  </p>
                  <fieldset className="mt-8">
                    <legend className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-slate-400">Difficulty</legend>
                    <div className="flex flex-wrap gap-3">
                      {(Object.keys(data.difficulties) as Difficulty[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={difficulty === key}
                          onClick={() => {
                            setDifficulty(key);
                            setRemainingTime(data.difficulties[key].timeLimit);
                            setPlayerPosition(data.difficulties[key].start);
                            setScore(data.difficulties[key].baseScore);
                          }}
                          className={[
                            "rounded-md px-5 py-3 font-bold transition",
                            difficulty === key ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/15",
                          ].join(" ")}
                        >
                          {data.difficulties[key].label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <StatCard label="Best Time" value={bestTime === null ? "—" : formatTime(bestTime)} />
                    <StatCard label="Best Score" value={bestScore} />
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button type="button" onClick={() => resetForDifficulty()} className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200">
                      Start Maze
                    </button>
                    <Link href="/profile/dauda" className="rounded-md bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15">
                      Back to Dauda Games
                    </Link>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {gameStarted && (
            <motion.section key="game" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="mt-8">
              <header className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Time" value={formatTime(remainingTime)} />
                <StatCard label="Seeds" value={`${collectedSeedIds.length} / ${definition.seeds.length}`} />
                <StatCard label="Moves" value={moves} />
                <StatCard label="Mode" value={definition.label} />
                <StatCard label="Hints" value={hintsRemaining} />
                <StatCard label="Best" value={bestTime === null ? "—" : formatTime(bestTime)} />
              </header>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_22rem]">
                <section className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(251,191,36,0.14),transparent_32%),linear-gradient(180deg,rgba(48,25,10,0.92),rgba(5,5,5,0.96))] p-3 shadow-2xl shadow-black/55 md:p-5">
                  <div className="mb-4 flex min-h-[3.25rem] items-center justify-center rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-center text-sm font-black text-white">
                    <motion.span
                      key={message || "empty-message"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: message ? 1 : 0 }}
                      transition={{ duration: 0.16 }}
                    >
                      {message || " "}
                    </motion.span>
                  </div>
                  <div
                    role="grid"
                    aria-label="Hamster maze"
                    className="mx-auto grid max-w-[min(88vw,46rem)] overflow-hidden rounded-2xl border border-white/10 bg-black/60"
                    style={{ gridTemplateColumns: `repeat(${definition.columns}, minmax(0, 1fr))` }}
                  >
                    {definition.maze.map((row, rowIndex) =>
                      row.split("").map((_, columnIndex) => renderCell(rowIndex, columnIndex))
                    )}
                  </div>
                </section>

                <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/45 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">Maze Controls</p>
                  <h2 className="mt-3 text-3xl font-black">Guide Dauda Home</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Use Arrow keys, WASD, or the buttons. Collect every seed before entering the house.
                  </p>
                  <div className="mx-auto mt-6 grid max-w-56 grid-cols-3 gap-3">
                    <div />
                    <button type="button" aria-label="Move up" onClick={() => movePlayer("up")} className="rounded-2xl bg-white px-4 py-4 text-xl font-black text-black focus:outline-none focus:ring-4 focus:ring-amber-200">↑</button>
                    <div />
                    <button type="button" aria-label="Move left" onClick={() => movePlayer("left")} className="rounded-2xl bg-white px-4 py-4 text-xl font-black text-black focus:outline-none focus:ring-4 focus:ring-amber-200">←</button>
                    <button type="button" aria-label="Move down" onClick={() => movePlayer("down")} className="rounded-2xl bg-white px-4 py-4 text-xl font-black text-black focus:outline-none focus:ring-4 focus:ring-amber-200">↓</button>
                    <button type="button" aria-label="Move right" onClick={() => movePlayer("right")} className="rounded-2xl bg-white px-4 py-4 text-xl font-black text-black focus:outline-none focus:ring-4 focus:ring-amber-200">→</button>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" onClick={useHint} disabled={hintsRemaining <= 0 || gameCompleted || gameFailed} className="rounded-md bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-500 disabled:opacity-45">
                      Hint ({hintsRemaining})
                    </button>
                    <button type="button" onClick={() => setPaused((value) => !value)} disabled={gameCompleted || gameFailed} className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15 disabled:opacity-45">
                      {paused ? "Resume" : "Pause"}
                    </button>
                    <button type="button" onClick={() => resetForDifficulty()} className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15">
                      Restart
                    </button>
                    <button type="button" onClick={() => setReducedMotion((value) => !value)} className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15">
                      Reduced Motion: {reducedMotion ? "On" : "Off"}
                    </button>
                    <button type="button" onClick={() => setSoundEnabled((value) => !value)} className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15">
                      Sound: {soundEnabled ? "On" : "Muted"}
                    </button>
                  </div>
                </aside>
              </div>

              {(paused || gameCompleted || gameFailed) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm">
                  <div className="max-w-4xl rounded-3xl border border-white/10 bg-zinc-950/95 p-8 text-center shadow-2xl shadow-black">
                    {gameCompleted ? (
                      <>
                        <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">Maze Complete</p>
                        <h2 className="mt-4 text-4xl font-black md:text-5xl">{rank.title}</h2>
                        <p className="mx-auto mt-3 max-w-xl text-slate-300">{rank.message}</p>
                        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <StatCard label="Final Score" value={score} />
                          <StatCard label="Time" value={formatTime(elapsedTime)} />
                          <StatCard label="Moves" value={moves} />
                          <StatCard label="Seeds" value={`${collectedSeedIds.length} / ${definition.seeds.length}`} />
                          <StatCard label="Hints Used" value={hintsUsed} />
                          <StatCard label="Difficulty" value={definition.label} />
                          <StatCard label="Best Time" value={bestTime === null ? "—" : formatTime(bestTime)} />
                          <StatCard label="Best Score" value={Math.max(bestScore, score)} />
                        </div>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                          <button type="button" onClick={() => resetForDifficulty()} className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200">Play Again</button>
                          <button type="button" onClick={() => { setGameStarted(false); setGameCompleted(false); }} className="rounded-md bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15">Try Another Difficulty</button>
                          <Link href="/profile/dauda" className="rounded-md bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-500">Back to Dauda Games</Link>
                        </div>
                      </>
                    ) : gameFailed ? (
                      <>
                        <h2 className="text-4xl font-black">Dauda Got Distracted</h2>
                        <p className="mx-auto mt-3 max-w-xl text-slate-300">
                          He found several interesting corners but not the way home.
                        </p>
                        {showSolution && <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-amber-200">Solution path highlighted on the maze.</p>}
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                          <button type="button" onClick={() => resetForDifficulty()} className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200">Try Again</button>
                          <button type="button" onClick={revealSolution} className="rounded-md bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15">Show Solution</button>
                          <Link href="/profile/dauda" className="rounded-md bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-500">Back to Dauda Games</Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="text-4xl font-black">Paused</h2>
                        <p className="mt-3 text-slate-300">Dauda is inspecting one very important corner.</p>
                        <button type="button" onClick={() => setPaused(false)} className="mt-7 rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200">Resume</button>
                      </>
                    )}
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

export default HamsterMazeGame;
