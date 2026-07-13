"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "cozy" | "normal" | "chaos";
type ItemType = "good" | "bad" | string;

interface SeedItem {
  id: string;
  name: string;
  image: string;
  type: ItemType;
  points: number;
}

interface CatchSeedsData {
  duration: number;
  startingLives: number;
  items: SeedItem[];
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
  goodCaught: number;
  badCaught: number;
  missedGood: number;
  cheeseCaught: number;
  badBurstCount: number;
  badBurstWindowStartedAt: number;
}

const BEST_SCORE_KEY = "dauda-catch-the-seeds-best";
const DAUDA_SPRITE = "/videos/dauda/games/catch-seeds/dauda-catcher.png";
const THUMBNAIL = "/videos/dauda/games/catch-seeds/catch-the-seeds.png";
const AUDIO = {
  catch: "/sounds/dauda/seed-catch.mp3",
  wrong: "/sounds/dauda/wrong.mp3",
  rush: "/sounds/dauda/seed-rush.mp3",
  gameOver: "/sounds/dauda/game-over.mp3",
};

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    label: string;
    duration: number;
    baseSpeed: number;
    spawnMs: number;
    goodChance: number;
    daudaWidth: number;
    waveChance: number;
    scoreMultiplier: number;
  }
> = {
  cozy: {
    label: "Cozy",
    duration: 75,
    baseSpeed: 105,
    spawnMs: 890,
    goodChance: 0.78,
    daudaWidth: 126,
    waveChance: 0.03,
    scoreMultiplier: 0.9,
  },
  normal: {
    label: "Normal",
    duration: 60,
    baseSpeed: 150,
    spawnMs: 720,
    goodChance: 0.58,
    daudaWidth: 112,
    waveChance: 0.08,
    scoreMultiplier: 1,
  },
  chaos: {
    label: "Tiny Chaos",
    duration: 45,
    baseSpeed: 205,
    spawnMs: 540,
    goodChance: 0.42,
    daudaWidth: 96,
    waveChance: 0.22,
    scoreMultiplier: 1.25,
  },
};

function initialState(duration: number, lives: number): GameState {
  return {
    score: 0,
    timeRemaining: duration,
    lives,
    combo: 0,
    bestCombo: 0,
    goodCaught: 0,
    badCaught: 0,
    missedGood: 0,
    cheeseCaught: 0,
    badBurstCount: 0,
    badBurstWindowStartedAt: 0,
  };
}

function getComboMultiplier(combo: number) {
  if (combo >= 12) return 3;
  if (combo >= 8) return 2;
  if (combo >= 5) return 1.5;
  if (combo >= 3) return 1.25;
  return 1;
}

function getGoodMessage() {
  const messages = [
    "Seed secured!",
    "Tiny snack acquired.",
    "Dauda approves.",
    "Emergency food storage updated.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getBadMessage(item: SeedItem) {
  if (item.id === "broccoli") return "Tiny green tree rejected.";
  if (item.id === "lemon") return "Too sour for the seed department.";
  if (item.id === "cucumber") return "Suspicious green cylinder.";
  if (item.id === "cheese") return "Wrong rodent stereotype detected.";
  if (item.id === "plastic-bag") return "Dauda has left the collection zone.";
  return "Suspicious item rejected.";
}

function getFinalMessage(score: number, cheeseCaught: number) {
  if (cheeseCaught >= 3) {
    return {
      title: "Important notice: Dauda is a hamster, not a cartoon mouse.",
      message: "The cheese department has been politely redirected.",
    };
  }
  if (score >= 900) {
    return {
      title: "Supreme Seed Collector 🏆",
      message: "Dauda now has enough snacks hidden for several imaginary winters.",
    };
  }
  if (score >= 520) {
    return {
      title: "Certified Snack Catcher 🐹",
      message: "Tiny paws, excellent reflexes.",
    };
  }
  if (score >= 220) {
    return {
      title: "Assistant Seed Gatherer",
      message: "Dauda accepts the results but requests more practice.",
    };
  }
  return {
    title: "Food Storage Emergency",
    message: "Several premium seeds were tragically lost.",
  };
}

function SafeImage({
  src,
  alt,
  className,
  fallback = "🌻",
}: {
  src: string;
  alt: string;
  className: string;
  fallback?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={[
          className,
          "flex items-center justify-center bg-gradient-to-br from-amber-950/60 via-black to-red-950/40 text-4xl",
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

export function CatchTheSeedsGame({ data }: { data: CatchSeedsData }) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const rushUntilRef = useRef(0);
  const nextRushAtRef = useRef(0);
  const nextItemIdRef = useRef(1);
  const labelIdRef = useRef(1);
  const keysRef = useRef({ left: false, right: false });
  const fallingItemsRef = useRef<FallingItem[]>([]);
  const daudaXRef = useRef(50);
  const stateRef = useRef<GameState>(initialState(data.duration, data.startingLives));
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [bestScore, setBestScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>(
    initialState(DIFFICULTY_CONFIG.normal.duration, data.startingLives)
  );
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [daudaX, setDaudaX] = useState(50);
  const [floatingLabels, setFloatingLabels] = useState<FloatingLabel[]>([]);
  const [message, setMessage] = useState("");
  const [shakeDauda, setShakeDauda] = useState(false);
  const [seedRushActive, setSeedRushActive] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];
  const goodItems = useMemo(
    () => data.items.filter((item) => item.type === "good"),
    [data.items]
  );
  const badItems = useMemo(
    () => data.items.filter((item) => item.type === "bad"),
    [data.items]
  );
  const finalResult = getFinalMessage(gameState.score, gameState.cheeseCaught);
  const accuracy =
    gameState.goodCaught + gameState.missedGood === 0
      ? 0
      : Math.round(
          (gameState.goodCaught /
            (gameState.goodCaught + gameState.missedGood)) *
            100
        );

  const syncState = (next: GameState) => {
    stateRef.current = next;
    setGameState(next);
  };

  const playSound = (src: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(src);
    audio.volume = 0.32;
    audio.play().catch(() => undefined);
  };

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 1300);
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
    const rush = performance.now() < rushUntilRef.current;
    const useGood = Math.random() < (rush ? 0.9 : config.goodChance);
    const pool = useGood ? goodItems : badItems;
    const fallbackPool = pool.length ? pool : data.items;
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  };

  const spawnItem = (elapsedSeconds: number, forceWave = false) => {
    const arena = arenaRef.current;
    if (!arena) return;
    const width = arena.clientWidth;
    const speedBoost = elapsedSeconds * 2;
    const count = forceWave ? (difficulty === "chaos" ? 3 : 2) : 1;
    const nextItems: FallingItem[] = [];

    for (let index = 0; index < count; index += 1) {
      const item = chooseItem();
      const size = difficulty === "chaos" ? 50 : difficulty === "cozy" ? 64 : 58;
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

  const handleGoodCatch = (item: SeedItem, fallingItem: FallingItem) => {
    const nextCombo = stateRef.current.combo + 1;
    const comboMultiplier = getComboMultiplier(nextCombo);
    const rushMultiplier = seedRushActive ? 2 : 1;
    const points = Math.round(
      item.points * comboMultiplier * rushMultiplier * config.scoreMultiplier
    );
    syncState({
      ...stateRef.current,
      score: stateRef.current.score + points,
      combo: nextCombo,
      bestCombo: Math.max(stateRef.current.bestCombo, nextCombo),
      goodCaught: stateRef.current.goodCaught + 1,
    });
    addFloatingLabel(fallingItem.x, fallingItem.y, `+${points}`, "good");
    showMessage(getGoodMessage());
    playSound(AUDIO.catch);
  };

  const handleBadCatch = (item: SeedItem, fallingItem: FallingItem) => {
    const now = performance.now();
    const isSameBurst = now - stateRef.current.badBurstWindowStartedAt < 3200;
    const badBurstCount = isSameBurst ? stateRef.current.badBurstCount + 1 : 1;
    const losesLife = item.id === "plastic-bag" || badBurstCount >= 3;
    syncState({
      ...stateRef.current,
      score: Math.max(0, stateRef.current.score + item.points),
      combo: 0,
      lives: Math.max(0, stateRef.current.lives - (losesLife ? 1 : 0)),
      badCaught: stateRef.current.badCaught + 1,
      cheeseCaught:
        stateRef.current.cheeseCaught + (item.id === "cheese" ? 1 : 0),
      badBurstCount: losesLife ? 0 : badBurstCount,
      badBurstWindowStartedAt: isSameBurst
        ? stateRef.current.badBurstWindowStartedAt
        : now,
    });
    addFloatingLabel(fallingItem.x, fallingItem.y, `${item.points}`, "bad");
    showMessage(getBadMessage(item));
    setShakeDauda(true);
    window.setTimeout(() => setShakeDauda(false), 360);
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

    const rushActiveNow = time < rushUntilRef.current;
    if (rushActiveNow !== seedRushActive) setSeedRushActive(rushActiveNow);
    if (time > nextRushAtRef.current && !rushActiveNow && Math.random() < 0.006) {
      rushUntilRef.current = time + 5000;
      nextRushAtRef.current = time + 16000 + Math.random() * 9000;
      setSeedRushActive(true);
      showMessage("SEED RUSH!");
      playSound(AUDIO.rush);
    }

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

    const elapsed = config.duration - nextTime;
    const spawnEvery = reducedMotion ? config.spawnMs * 1.25 : config.spawnMs;
    if (time - lastSpawnRef.current > (rushActiveNow ? spawnEvery * 0.55 : spawnEvery)) {
      spawnItem(elapsed, rushActiveNow || Math.random() < config.waveChance);
      lastSpawnRef.current = time;
    }

    const arenaWidth = arena.clientWidth;
    const arenaHeight = arena.clientHeight;
    const daudaWidth = config.daudaWidth;
    const daudaHeight = 90;
    const keyMovement =
      (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
    if (keyMovement !== 0) {
      daudaXRef.current = Math.max(
        0,
        Math.min(arenaWidth - daudaWidth, daudaXRef.current + keyMovement * 430 * delta)
      );
    }

    const daudaRect = {
      x: daudaXRef.current,
      y: arenaHeight - daudaHeight - 20,
      width: daudaWidth,
      height: daudaHeight,
    };
    const remaining: FallingItem[] = [];
    fallingItemsRef.current.forEach((fallingItem) => {
      const nextItem = {
        ...fallingItem,
        y: fallingItem.y + fallingItem.speed * delta,
      };
      const item = data.items.find((candidate) => candidate.id === nextItem.itemId);
      if (!item) return;

      const collided =
        nextItem.x < daudaRect.x + daudaRect.width &&
        nextItem.x + nextItem.size > daudaRect.x &&
        nextItem.y < daudaRect.y + daudaRect.height &&
        nextItem.y + nextItem.size > daudaRect.y;

      if (collided) {
        if (item.type === "good") handleGoodCatch(item, nextItem);
        else handleBadCatch(item, nextItem);
        return;
      }

      if (nextItem.y > arenaHeight + nextItem.size) {
        if (item.type === "good") {
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
    setDaudaX(daudaXRef.current);
    animationRef.current = requestAnimationFrame(tick);
  };

  const startGame = () => {
    const arena = arenaRef.current;
    const startX = arena ? arena.clientWidth / 2 - config.daudaWidth / 2 : 50;
    daudaXRef.current = Math.max(0, startX);
    fallingItemsRef.current = [];
    lastFrameRef.current = 0;
    lastSpawnRef.current = 0;
    rushUntilRef.current = 0;
    nextRushAtRef.current = performance.now() + 9000;
    nextItemIdRef.current = 1;
    syncState(initialState(config.duration, data.startingLives));
    setFallingItems([]);
    setFloatingLabels([]);
    setMessage("");
    setSeedRushActive(false);
    setDaudaX(daudaXRef.current);
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
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const moveByButton = (direction: "left" | "right") => {
    const arena = arenaRef.current;
    if (!arena) return;
    const delta = direction === "left" ? -58 : 58;
    daudaXRef.current = Math.max(
      0,
      Math.min(arena.clientWidth - config.daudaWidth, daudaXRef.current + delta)
    );
    setDaudaX(daudaXRef.current);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-950/25 via-black to-black px-5 py-20 text-white md:px-8">
      <div className="absolute left-[-10rem] top-10 h-96 w-96 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-[-8rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-400/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/profile/dauda" className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
            Back to Dauda Games
          </Link>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={soundEnabled} onClick={() => setSoundEnabled((value) => !value)} className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
              Sound: {soundEnabled ? "On" : "Muted"}
            </button>
            <button type="button" aria-pressed={reducedMotion} onClick={() => setReducedMotion((value) => !value)} className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
              Reduced Motion: {reducedMotion ? "On" : "Off"}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!gameStarted && (
            <motion.section key="start" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/50 backdrop-blur">
              <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="flex min-h-[420px] items-center justify-center bg-black/45 p-5">
                  <SafeImage src={THUMBNAIL} alt="Catch the Seeds thumbnail" className="h-full max-h-[25rem] w-full object-contain" fallback="🌻" />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">Dauda Studios Game</p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Catch the Seeds</h1>
                  <p className="mt-4 text-lg font-semibold text-amber-100">Dauda is hungry, the seeds are falling, and absolutely no one organized this properly.</p>
                  <fieldset className="mt-8">
                    <legend className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-slate-400">Difficulty</legend>
                    <div className="flex flex-wrap gap-3">
                      {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => (
                        <button key={key} type="button" aria-pressed={difficulty === key} onClick={() => setDifficulty(key)} className={["rounded-md px-5 py-3 font-bold transition", difficulty === key ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/15"].join(" ")}>
                          {DIFFICULTY_CONFIG[key].label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Best Score</p>
                    <p className="mt-1 text-3xl font-black text-white">{bestScore}</p>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button type="button" onClick={startGame} className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200">
                      Start Catching
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
                <StatCard label="Score" value={gameState.score} />
                <StatCard label="Time" value={Math.ceil(gameState.timeRemaining)} />
                <StatCard label="Lives" value={"❤️".repeat(gameState.lives) || "0"} />
                <StatCard label="Combo" value={gameState.combo ? `${gameState.combo} / x${getComboMultiplier(gameState.combo)}` : "0"} />
                <StatCard label="Best" value={bestScore} />
                <StatCard label="Mode" value={config.label} />
              </header>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
                <section
                  ref={arenaRef}
                  onPointerMove={(event) => {
                    if (!gameStarted || gameOver || paused || !arenaRef.current) return;
                    const rect = arenaRef.current.getBoundingClientRect();
                    daudaXRef.current = Math.max(
                      0,
                      Math.min(rect.width - config.daudaWidth, event.clientX - rect.left - config.daudaWidth / 2)
                    );
                    setDaudaX(daudaXRef.current);
                  }}
                  className={[
                    "relative h-[34rem] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_12%,rgba(251,191,36,0.16),transparent_30%),linear-gradient(180deg,rgba(50,24,8,0.92),rgba(5,5,5,0.96))] shadow-2xl shadow-black/55 touch-none",
                    seedRushActive ? "ring-2 ring-yellow-200 shadow-yellow-900/30" : "",
                  ].join(" ")}
                >
                  <AnimatePresence>
                    {floatingLabels.map((label) => (
                      <motion.div key={label.id} initial={{ opacity: 0, y: 0, scale: 0.8 }} animate={{ opacity: [0, 1, 0], y: -44, scale: [0.8, 1.12, 1] }} className={["pointer-events-none absolute z-30 rounded-full px-3 py-1 text-sm font-black", label.kind === "good" ? "bg-emerald-300 text-black" : "bg-red-600 text-white"].join(" ")} style={{ left: label.x, top: label.y }}>
                        {label.text}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {seedRushActive && <div className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full bg-yellow-200 px-5 py-2 text-sm font-black text-black">SEED RUSH!</div>}
                  {message && <div className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/75 px-5 py-3 text-sm font-black text-white">{message}</div>}
                  {fallingItems.map((fallingItem) => {
                    const item = data.items.find((candidate) => candidate.id === fallingItem.itemId);
                    if (!item) return null;
                    return (
                      <div key={fallingItem.uniqueId} className="absolute z-10" style={{ left: fallingItem.x, top: fallingItem.y, width: fallingItem.size, height: fallingItem.size }}>
                        <SafeImage src={item.image} alt={item.name} className="h-full w-full object-contain drop-shadow-xl" fallback={item.type === "good" ? "🌻" : "!"} />
                        <span className="sr-only">{item.type === "good" ? "Good item" : "Bad item"}: {item.name}</span>
                      </div>
                    );
                  })}
                  <motion.div animate={shakeDauda ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }} className="absolute bottom-5 z-20" style={{ left: daudaX, width: config.daudaWidth, height: 92 }}>
                    <SafeImage src={DAUDA_SPRITE} alt="Dauda catcher" className="h-full w-full object-contain drop-shadow-2xl" fallback="🐹" />
                  </motion.div>
                </section>

                <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/45 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">Controls</p>
                  <h2 className="mt-3 text-3xl font-black">Catch Everything Good</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">Use Arrow keys, A/D, touch drag, or buttons. Avoid suspicious items.</p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button type="button" aria-label="Move left" onClick={() => moveByButton("left")} className="rounded-2xl bg-white px-4 py-5 text-2xl font-black text-black focus:outline-none focus:ring-4 focus:ring-amber-200">←</button>
                    <button type="button" aria-label="Move right" onClick={() => moveByButton("right")} className="rounded-2xl bg-white px-4 py-5 text-2xl font-black text-black focus:outline-none focus:ring-4 focus:ring-amber-200">→</button>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" onClick={() => setPaused((value) => !value)} disabled={gameOver} className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15 disabled:opacity-40">{paused ? "Resume" : "Pause"}</button>
                    <button type="button" onClick={startGame} className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15">Restart</button>
                  </div>
                </aside>
              </div>

              {(paused || gameOver) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm">
                  <div className="max-w-4xl rounded-3xl border border-white/10 bg-zinc-950/95 p-8 text-center shadow-2xl shadow-black">
                    {gameOver ? (
                      <>
                        <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">Final Score</p>
                        <h2 className="mt-4 text-5xl font-black">{gameState.score}</h2>
                        <h3 className="mt-6 text-2xl font-black text-white">{finalResult.title}</h3>
                        <p className="mx-auto mt-3 max-w-xl text-slate-300">{finalResult.message}</p>
                        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <StatCard label="Good Caught" value={gameState.goodCaught} />
                          <StatCard label="Bad Caught" value={gameState.badCaught} />
                          <StatCard label="Best Combo" value={gameState.bestCombo} />
                          <StatCard label="Accuracy" value={`${accuracy}%`} />
                          <StatCard label="Difficulty" value={config.label} />
                          <StatCard label="Best Score" value={Math.max(bestScore, gameState.score)} />
                        </div>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                          <button type="button" onClick={startGame} className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200">Play Again</button>
                          <Link href="/profile/dauda" className="rounded-md bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-500">Back to Dauda Games</Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="text-4xl font-black">Paused</h2>
                        <p className="mt-3 text-slate-300">Dauda is checking the emergency snack pouch.</p>
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

export default CatchTheSeedsGame;
