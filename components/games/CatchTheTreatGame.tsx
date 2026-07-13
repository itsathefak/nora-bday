"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "easy" | "normal" | "chaos";

interface CatchItemData {
  id: string;
  name: string;
  image: string;
  isGood: boolean;
  points?: number;
  penalty?: number;
}

interface FallingItem {
  uniqueId: number;
  itemId: string;
  x: number;
  y: number;
  speed: number;
  size: number;
}

interface FloatingLabel {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: "good" | "bad";
}

interface GameState {
  score: number;
  timeRemaining: number;
  lives: number;
  combo: number;
  bestCombo: number;
  caughtGood: number;
  caughtBad: number;
  missedGood: number;
  caughtDauda: number;
  badBurstCount: number;
  badBurstWindowStartedAt: number;
}

const BEST_SCORE_KEY = "piggy-catch-the-treat-best";
const GAME_DURATION = 60;
const PIGGY_SPRITE = "/videos/piggy/games/catch-treat/piggy-catcher.png";
const AUDIO = {
  catch: "/sounds/piggy/catch.mp3",
  wrong: "/sounds/piggy/wrong.mp3",
  combo: "/sounds/piggy/combo.mp3",
  gameOver: "/sounds/piggy/game-over.mp3",
};

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    label: string;
    baseSpeed: number;
    spawnMs: number;
    goodChance: number;
    piggyWidth: number;
    waveChance: number;
  }
> = {
  easy: {
    label: "Easy",
    baseSpeed: 115,
    spawnMs: 900,
    goodChance: 0.74,
    piggyWidth: 126,
    waveChance: 0.03,
  },
  normal: {
    label: "Normal",
    baseSpeed: 155,
    spawnMs: 740,
    goodChance: 0.56,
    piggyWidth: 112,
    waveChance: 0.08,
  },
  chaos: {
    label: "Chaos",
    baseSpeed: 205,
    spawnMs: 560,
    goodChance: 0.42,
    piggyWidth: 96,
    waveChance: 0.2,
  },
};

const INITIAL_GAME_STATE: GameState = {
  score: 0,
  timeRemaining: GAME_DURATION,
  lives: 3,
  combo: 0,
  bestCombo: 0,
  caughtGood: 0,
  caughtBad: 0,
  missedGood: 0,
  caughtDauda: 0,
  badBurstCount: 0,
  badBurstWindowStartedAt: 0,
};

function getComboMultiplier(combo: number) {
  if (combo >= 8) return 2;
  if (combo >= 5) return 1.5;
  if (combo >= 3) return 1.25;
  return 1;
}

function getBadMessage(item: CatchItemData) {
  if (item.id === "broccoli") return "Vegetable emergency.";
  if (item.id === "dauda") return "Dauda is not a snack.";
  if (item.id === "lemon") return "Why is it sour?";
  if (item.id === "cucumber") return "Suspicious green object.";
  if (item.id === "dry-toast") return "Porky expected better.";
  return "Porky rejects this offering.";
}

function getGoodMessage() {
  const messages = ["Porky approves.", "Snack secured.", "Duck neck acquired."];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getFinalMessage(score: number, daudaCaught: number) {
  if (daudaCaught >= 2) {
    return {
      title: "Important reminder: Dauda is a coworker, not dinner.",
      message: "Porky has been asked to attend additional workplace training.",
    };
  }

  if (score >= 700) {
    return {
      title: "Supreme Porky Snack Champion 🏆",
      message: "Every premium snack reached its rightful owner.",
    };
  }

  if (score >= 420) {
    return {
      title: "Certified Treat Catcher 🐾",
      message: "Porky is pleased with today’s food service.",
    };
  }

  if (score >= 180) {
    return {
      title: "Assistant Food Beggar",
      message: "Acceptable work, but several snacks were tragically lost.",
    };
  }

  return {
    title: "Kitchen Access Suspended",
    message: "Piggy recommends additional training and one duck neck.",
  };
}

function SafeImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={[
          className,
          "flex items-center justify-center bg-gradient-to-br from-red-950/50 via-slate-950 to-black text-4xl",
        ].join(" ")}
        aria-label={alt}
      >
        🐾
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      onError={() => setFailed(true)}
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

export function CatchTheTreatGame({ items }: { items: CatchItemData[] }) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const nextItemIdRef = useRef(1);
  const labelIdRef = useRef(1);
  const keysRef = useRef({ left: false, right: false });
  const fallingItemsRef = useRef<FallingItem[]>([]);
  const piggyXRef = useRef(50);
  const stateRef = useRef<GameState>(INITIAL_GAME_STATE);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [bestScore, setBestScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [piggyX, setPiggyX] = useState(50);
  const [floatingLabels, setFloatingLabels] = useState<FloatingLabel[]>([]);
  const [message, setMessage] = useState("");
  const [shakePiggy, setShakePiggy] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];
  const goodItems = useMemo(() => items.filter((item) => item.isGood), [items]);
  const badItems = useMemo(() => items.filter((item) => !item.isGood), [items]);
  const finalResult = getFinalMessage(gameState.score, gameState.caughtDauda);
  const accuracy =
    gameState.caughtGood + gameState.missedGood === 0
      ? 0
      : Math.round(
          (gameState.caughtGood /
            (gameState.caughtGood + gameState.missedGood)) *
            100
        );

  const syncState = (next: GameState) => {
    stateRef.current = next;
    setGameState(next);
  };

  const playSound = (src: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(src);
    audio.volume = 0.35;
    audio.play().catch(() => undefined);
  };

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 1200);
  };

  const addFloatingLabel = (
    x: number,
    y: number,
    text: string,
    kind: "good" | "bad"
  ) => {
    const id = labelIdRef.current + 1;
    labelIdRef.current = id;
    setFloatingLabels((current) => [...current, { id, x, y, text, kind }]);
    window.setTimeout(() => {
      setFloatingLabels((current) => current.filter((label) => label.id !== id));
    }, 950);
  };

  const chooseItem = () => {
    const useGood = Math.random() < config.goodChance;
    const pool = useGood ? goodItems : badItems;
    const fallbackPool = pool.length ? pool : items;
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  };

  const spawnItem = (elapsedSeconds: number, forceWave = false) => {
    const arena = arenaRef.current;
    if (!arena) return;

    const width = arena.clientWidth;
    const speedBoost = elapsedSeconds * 2.1;
    const count = forceWave ? (difficulty === "chaos" ? 3 : 2) : 1;
    const nextItems: FallingItem[] = [];

    for (let index = 0; index < count; index += 1) {
      const item = chooseItem();
      const size = difficulty === "chaos" ? 52 : difficulty === "easy" ? 64 : 58;
      const x = Math.max(
        8,
        Math.min(width - size - 8, Math.random() * (width - size))
      );
      nextItems.push({
        uniqueId: nextItemIdRef.current + index,
        itemId: item.id,
        x,
        y: -size - index * 18,
        speed: config.baseSpeed + speedBoost + Math.random() * 70,
        size,
      });
    }

    nextItemIdRef.current += count;
    fallingItemsRef.current = [...fallingItemsRef.current, ...nextItems];
  };

  const endGame = () => {
    setGameOver(true);
    setPaused(false);
    playSound(AUDIO.gameOver);
    const currentScore = stateRef.current.score;
    if (currentScore > bestScore) {
      setBestScore(currentScore);
      window.localStorage.setItem(BEST_SCORE_KEY, String(currentScore));
    }
  };

  const handleGoodCatch = (item: CatchItemData, fallingItem: FallingItem) => {
    const nextCombo = stateRef.current.combo + 1;
    const multiplier = getComboMultiplier(nextCombo);
    const points = Math.round((item.points || 0) * multiplier);
    const next: GameState = {
      ...stateRef.current,
      score: stateRef.current.score + points,
      combo: nextCombo,
      bestCombo: Math.max(stateRef.current.bestCombo, nextCombo),
      caughtGood: stateRef.current.caughtGood + 1,
    };
    syncState(next);
    addFloatingLabel(fallingItem.x, fallingItem.y, `+${points}`, "good");
    showMessage(getGoodMessage());
    playSound(nextCombo >= 3 ? AUDIO.combo : AUDIO.catch);
  };

  const handleBadCatch = (item: CatchItemData, fallingItem: FallingItem) => {
    const now = performance.now();
    const isSameBurst = now - stateRef.current.badBurstWindowStartedAt < 3000;
    const badBurstCount = isSameBurst ? stateRef.current.badBurstCount + 1 : 1;
    const losesLife = item.id === "dauda" || badBurstCount >= 3;
    const next: GameState = {
      ...stateRef.current,
      score: Math.max(0, stateRef.current.score + (item.penalty || 0)),
      combo: 0,
      lives: Math.max(0, stateRef.current.lives - (losesLife ? 1 : 0)),
      caughtBad: stateRef.current.caughtBad + 1,
      caughtDauda:
        stateRef.current.caughtDauda + (item.id === "dauda" ? 1 : 0),
      badBurstCount: losesLife ? 0 : badBurstCount,
      badBurstWindowStartedAt: isSameBurst
        ? stateRef.current.badBurstWindowStartedAt
        : now,
    };
    syncState(next);
    addFloatingLabel(fallingItem.x, fallingItem.y, `${item.penalty || 0}`, "bad");
    showMessage(getBadMessage(item));
    setShakePiggy(true);
    window.setTimeout(() => setShakePiggy(false), 360);
    playSound(AUDIO.wrong);
  };

  const tick = (time: number) => {
    if (!gameStarted || gameOver || paused) return;

    const arena = arenaRef.current;
    if (!arena) return;

    const delta = lastFrameRef.current
      ? Math.min(0.04, (time - lastFrameRef.current) / 1000)
      : 0;
    lastFrameRef.current = time;

    const nextTime = Math.max(0, stateRef.current.timeRemaining - delta);
    if (Math.floor(nextTime) !== Math.floor(stateRef.current.timeRemaining)) {
      syncState({ ...stateRef.current, timeRemaining: nextTime });
    } else {
      stateRef.current = { ...stateRef.current, timeRemaining: nextTime };
    }

    if (nextTime <= 0 || stateRef.current.lives <= 0) {
      syncState({ ...stateRef.current, timeRemaining: 0 });
      endGame();
      return;
    }

    const elapsed = GAME_DURATION - nextTime;
    const spawnEvery = reducedMotion ? config.spawnMs * 1.25 : config.spawnMs;
    if (time - lastSpawnRef.current > spawnEvery) {
      const wave = Math.random() < config.waveChance;
      spawnItem(elapsed, wave);
      lastSpawnRef.current = time;
    }

    const arenaWidth = arena.clientWidth;
    const arenaHeight = arena.clientHeight;
    const piggyWidth = config.piggyWidth;
    const piggyHeight = 92;
    const keyMovement = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
    if (keyMovement !== 0) {
      piggyXRef.current = Math.max(
        0,
        Math.min(arenaWidth - piggyWidth, piggyXRef.current + keyMovement * 430 * delta)
      );
    }

    const piggyRect = {
      x: piggyXRef.current,
      y: arenaHeight - piggyHeight - 20,
      width: piggyWidth,
      height: piggyHeight,
    };

    const remaining: FallingItem[] = [];
    fallingItemsRef.current.forEach((fallingItem) => {
      const nextItem = {
        ...fallingItem,
        y: fallingItem.y + fallingItem.speed * delta,
      };
      const item = items.find((candidate) => candidate.id === nextItem.itemId);
      if (!item) return;

      const collided =
        nextItem.x < piggyRect.x + piggyRect.width &&
        nextItem.x + nextItem.size > piggyRect.x &&
        nextItem.y < piggyRect.y + piggyRect.height &&
        nextItem.y + nextItem.size > piggyRect.y;

      if (collided) {
        if (item.isGood) {
          handleGoodCatch(item, nextItem);
        } else {
          handleBadCatch(item, nextItem);
        }
        return;
      }

      if (nextItem.y > arenaHeight + nextItem.size) {
        if (item.isGood) {
          syncState({
            ...stateRef.current,
            combo: 0,
            missedGood: stateRef.current.missedGood + 1,
          });
        }
        return;
      }

      remaining.push(nextItem);
    });

    fallingItemsRef.current = remaining;
    setFallingItems(remaining);
    setPiggyX(piggyXRef.current);
    animationRef.current = requestAnimationFrame(tick);
  };

  const startGame = () => {
    const arena = arenaRef.current;
    const startX = arena ? arena.clientWidth / 2 - config.piggyWidth / 2 : 50;
    piggyXRef.current = Math.max(0, startX);
    fallingItemsRef.current = [];
    lastFrameRef.current = 0;
    lastSpawnRef.current = 0;
    nextItemIdRef.current = 1;
    syncState(INITIAL_GAME_STATE);
    setFallingItems([]);
    setFloatingLabels([]);
    setMessage("");
    setPiggyX(piggyXRef.current);
    setGameStarted(true);
    setGameOver(false);
    setPaused(false);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(BEST_SCORE_KEY);
    if (stored) setBestScore(Number(stored) || 0);
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver || paused) return;
    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keysRef.current.left = true;
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keysRef.current.right = true;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keysRef.current.left = false;
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keysRef.current.right = false;
      }
    };
    const handleVisibility = () => {
      if (document.hidden) setPaused(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const movePiggyByButton = (direction: -1 | 1) => {
    const arena = arenaRef.current;
    if (!arena) return;
    piggyXRef.current = Math.max(
      0,
      Math.min(
        arena.clientWidth - config.piggyWidth,
        piggyXRef.current + direction * 44
      )
    );
    setPiggyX(piggyXRef.current);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!gameStarted || gameOver || paused) return;
    const arena = arenaRef.current;
    if (!arena) return;
    const rect = arena.getBoundingClientRect();
    piggyXRef.current = Math.max(
      0,
      Math.min(
        arena.clientWidth - config.piggyWidth,
        event.clientX - rect.left - config.piggyWidth / 2
      )
    );
    setPiggyX(piggyXRef.current);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-red-950/30 via-black to-black px-5 py-20 text-white md:px-8">
      <div className="absolute left-[-10rem] top-16 h-96 w-96 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-[-10rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div className="absolute left-[8%] top-[20%] text-5xl">🐾</div>
        <div className="absolute right-[12%] top-[16%] text-4xl">🐾</div>
        <div className="absolute bottom-[16%] left-[44%] text-5xl">🐾</div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/profile/piggy"
            className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Back to Piggy Games
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={soundEnabled}
              onClick={() => setSoundEnabled((value) => !value)}
              className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Sound: {soundEnabled ? "On" : "Muted"}
            </button>
            <button
              type="button"
              aria-pressed={reducedMotion}
              onClick={() => setReducedMotion((value) => !value)}
              className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Reduced Motion: {reducedMotion ? "On" : "Off"}
            </button>
          </div>
        </div>

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
                  <SafeImage
                    src="/videos/piggy/games/catch-treat/catch-the-treat.png"
                    alt="Catch the Treat thumbnail"
                    className="max-h-[560px] w-full object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                    Piggy Studios Game
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                    Catch the Treat
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-red-100">
                    Porky is hungry. Catch the good snacks and avoid the
                    suspicious offerings.
                  </p>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                    Help Porky catch his favourite foods while avoiding the
                    terrible things someone keeps throwing at him.
                  </p>

                  <fieldset className="mt-8">
                    <legend className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
                      Difficulty
                    </legend>
                    <div className="flex flex-wrap gap-3">
                      {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={difficulty === key}
                          onClick={() => setDifficulty(key)}
                          className={[
                            "rounded-md px-5 py-3 font-bold transition",
                            difficulty === key
                              ? "bg-white text-black"
                              : "bg-white/10 text-white hover:bg-white/15",
                          ].join(" ")}
                        >
                          {DIFFICULTY_CONFIG[key].label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                      Best Score
                    </p>
                    <p className="mt-1 text-3xl font-black text-white">
                      {bestScore}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={startGame}
                      className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                    >
                      Start Game
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
              <header className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Score" value={gameState.score} />
                <StatCard label="Best" value={bestScore} />
                <StatCard label="Time" value={Math.ceil(gameState.timeRemaining)} />
                <StatCard label="Lives" value={"❤️".repeat(gameState.lives) || "0"} />
                <StatCard label="Combo" value={gameState.combo ? `${gameState.combo}x` : "0"} />
                <StatCard label="Mode" value={config.label} />
              </header>

              <div
                ref={arenaRef}
                onPointerMove={handlePointerMove}
                className="relative mt-5 h-[68vh] min-h-[520px] touch-none overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_15%,rgba(245,158,11,0.16),transparent_28%),linear-gradient(180deg,rgba(127,29,29,0.22),rgba(0,0,0,0.9))] shadow-2xl shadow-black/55"
              >
                <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
                  <div className="absolute left-[12%] top-[18%] text-5xl">🐾</div>
                  <div className="absolute right-[16%] top-[28%] text-4xl">🐾</div>
                  <div className="absolute bottom-[20%] left-[46%] text-5xl">🐾</div>
                </div>

                {fallingItems.map((fallingItem) => {
                  const item = items.find((candidate) => candidate.id === fallingItem.itemId);
                  if (!item) return null;

                  return (
                    <div
                      key={fallingItem.uniqueId}
                      className="absolute rounded-2xl border border-white/10 bg-black/40 p-1 shadow-2xl"
                      style={{
                        left: fallingItem.x,
                        top: fallingItem.y,
                        width: fallingItem.size,
                        height: fallingItem.size,
                      }}
                      aria-label={item.name}
                    >
                      <SafeImage
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full rounded-xl object-contain"
                      />
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                        {item.name}
                      </span>
                    </div>
                  );
                })}

                <motion.div
                  animate={shakePiggy ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute bottom-5 z-10"
                  style={{ left: piggyX, width: config.piggyWidth }}
                >
                  <div className="rounded-3xl border border-red-200/20 bg-black/40 p-2 shadow-2xl shadow-black">
                    <SafeImage
                      src={PIGGY_SPRITE}
                      alt="Piggy catcher"
                      className="h-24 w-full object-contain"
                    />
                  </div>
                </motion.div>

                <AnimatePresence>
                  {floatingLabels.map((label) => (
                    <motion.div
                      key={label.id}
                      initial={{ opacity: 0, y: 0, scale: 0.8 }}
                      animate={{ opacity: [0, 1, 0], y: -48, scale: [0.8, 1.1, 1] }}
                      exit={{ opacity: 0 }}
                      className={[
                        "pointer-events-none absolute z-20 rounded-full px-3 py-1 text-sm font-black shadow-2xl",
                        label.kind === "good"
                          ? "bg-emerald-400 text-black"
                          : "bg-red-600 text-white",
                      ].join(" ")}
                      style={{ left: label.x, top: label.y }}
                    >
                      {label.text}
                    </motion.div>
                  ))}
                </AnimatePresence>

                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-5 py-3 text-sm font-black text-white shadow-2xl"
                    >
                      {message}
                    </motion.div>
                  )}
                </AnimatePresence>

                {(paused || gameOver) && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
                    <div className="max-w-2xl rounded-3xl border border-white/10 bg-zinc-950/95 p-8 text-center shadow-2xl shadow-black">
                      {gameOver ? (
                        <>
                          <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                            Final Score
                          </p>
                          <h2 className="mt-4 text-5xl font-black">
                            {gameState.score}
                          </h2>
                          <h3 className="mt-6 text-2xl font-black text-white">
                            {finalResult.title}
                          </h3>
                          <p className="mx-auto mt-3 max-w-xl text-slate-300">
                            {finalResult.message}
                          </p>
                          <div className="mt-7 grid gap-3 sm:grid-cols-3">
                            <StatCard label="Best Combo" value={gameState.bestCombo} />
                            <StatCard label="Good Caught" value={gameState.caughtGood} />
                            <StatCard label="Bad Caught" value={gameState.caughtBad} />
                            <StatCard label="Accuracy" value={`${accuracy}%`} />
                            <StatCard label="Difficulty" value={config.label} />
                            <StatCard label="Best Score" value={Math.max(bestScore, gameState.score)} />
                          </div>
                          <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <button
                              type="button"
                              onClick={startGame}
                              className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                            >
                              Play Again
                            </button>
                            <Link
                              href="/profile/piggy"
                              className="rounded-md bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-500"
                            >
                              Back to Piggy Games
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <h2 className="text-4xl font-black">Paused</h2>
                          <p className="mt-3 text-slate-300">
                            Porky is temporarily reviewing the snack safety policy.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              lastFrameRef.current = 0;
                              setPaused(false);
                            }}
                            className="mt-7 rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                          >
                            Resume
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap justify-between gap-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => movePiggyByButton(-1)}
                    className="rounded-md bg-white/10 px-8 py-4 text-xl font-black text-white transition hover:bg-white/15"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => movePiggyByButton(1)}
                    className="rounded-md bg-white/10 px-8 py-4 text-xl font-black text-white transition hover:bg-white/15"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPaused((value) => !value)}
                  disabled={gameOver}
                  className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15 disabled:opacity-40"
                >
                  {paused ? "Resume" : "Pause"}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default CatchTheTreatGame;
