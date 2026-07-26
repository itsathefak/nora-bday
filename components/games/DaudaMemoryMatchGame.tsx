"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "easy" | "normal" | "chaos";

interface MemoryItem {
  id: string;
  name: string;
  image: string;
  alt: string;
}

interface MemoryCardData extends MemoryItem {
  cardId: string;
  pairId: string;
}

interface BestResults {
  bestTimeEasy: number;
  bestMovesEasy: number;
  bestTimeNormal: number;
  bestMovesNormal: number;
  bestTimeChaos: number;
  bestMovesChaos: number;
}

const BEST_KEY = "dauda-memory-match-best";
const THUMBNAIL = "/videos/dauda/games/memory-match/dauda-memory-match.png";
const AUDIO = {
  flip: "/sounds/dauda/card-flip.mp3",
  match: "/sounds/dauda/match.mp3",
  wrong: "/sounds/dauda/wrong.mp3",
  complete: "/sounds/dauda/complete.mp3",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  normal: "Normal",
  chaos: "Tiny Brain Chaos",
};

const EMPTY_BEST: BestResults = {
  bestTimeEasy: 0,
  bestMovesEasy: 0,
  bestTimeNormal: 0,
  bestMovesNormal: 0,
  bestTimeChaos: 0,
  bestMovesChaos: 0,
};

const FALLBACKS: Record<string, string> = {
  dauda: "🐹",
  "sunflower-seed": "🌻",
  "hamster-wheel": "⭕",
  "blue-tunnel": "🌀",
  "tiny-house": "🏠",
  "food-bowl": "🥣",
  hammock: "🌙",
  bridge: "🌉",
  bedding: "🛏️",
  "chew-toy": "🪵",
};

function shuffleArray<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function createDeck(items: MemoryItem[]) {
  const deck = items.flatMap((item) => [
    { ...item, pairId: item.id, cardId: `${item.id}-a-${Math.random()}` },
    { ...item, pairId: item.id, cardId: `${item.id}-b-${Math.random()}` },
  ]);
  let shuffled = shuffleArray(deck);
  const solved = shuffled.every((card, index) => {
    if (index % 2 !== 0) return true;
    return shuffled[index + 1]?.pairId === card.pairId;
  });
  if (solved) shuffled = shuffleArray(shuffled);
  return shuffled;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getBestKeys(difficulty: Difficulty) {
  if (difficulty === "easy") {
    return { time: "bestTimeEasy", moves: "bestMovesEasy" } as const;
  }
  if (difficulty === "chaos") {
    return { time: "bestTimeChaos", moves: "bestMovesChaos" } as const;
  }
  return { time: "bestTimeNormal", moves: "bestMovesNormal" } as const;
}

function getResultMessage(score: number) {
  if (score >= 900) {
    return {
      title: "Supreme Dauda Memory Master 🏆",
      message: "You remembered every tiny treasure before Dauda could hide it.",
    };
  }
  if (score >= 650) {
    return {
      title: "Certified Snack Memory Expert 🐹",
      message: "Sharp eyes, strong memory, excellent seed awareness.",
    };
  }
  if (score >= 380) {
    return {
      title: "Assistant Treasure Matcher",
      message: "You found them all, eventually.",
    };
  }
  return {
    title: "Dauda Forgot First",
    message: "The important part is that everyone is confused together.",
  };
}

function getTinyMessage(matched: boolean) {
  const matchMessages = [
    "Tiny pair found!",
    "Dauda approves.",
    "Snack memory restored.",
  ];
  const missMessages = [
    "Not a match.",
    "Dauda has moved the evidence.",
    "Tiny memory error detected.",
  ];
  const list = matched ? matchMessages : missMessages;
  return list[Math.floor(Math.random() * list.length)];
}

function calculateFinalScore({
  difficulty,
  timer,
  moves,
  mismatchCount,
  totalPairs,
}: {
  difficulty: Difficulty;
  timer: number;
  moves: number;
  mismatchCount: number;
  totalPairs: number;
}) {
  const base = difficulty === "easy" ? 500 : difficulty === "normal" ? 1000 : 1500;
  const extraMoves = Math.max(0, moves - totalPairs);
  return Math.max(100, base - extraMoves * 25 - timer * 4 - mismatchCount * 35);
}

function SafeImage({
  src,
  alt,
  fallback,
  className,
}: {
  src: string;
  alt: string;
  fallback: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={[
          className,
          "flex items-center justify-center bg-gradient-to-br from-amber-950/80 via-black to-red-950/50 text-5xl",
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

function DaudaMemoryCard({
  card,
  isFaceUp,
  isMatched,
  disabled,
  reducedMotion,
  onFlip,
}: {
  card: MemoryCardData;
  isFaceUp: boolean;
  isMatched: boolean;
  disabled: boolean;
  reducedMotion: boolean;
  onFlip: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onFlip}
      disabled={disabled}
      aria-label={
        isFaceUp || isMatched
          ? `${card.name} card${isMatched ? ", matched" : ""}`
          : "Hidden card"
      }
      className={[
        "group relative aspect-[4/5] rounded-2xl outline-none [perspective:900px]",
        disabled && !isMatched ? "cursor-not-allowed" : "",
      ].join(" ")}
    >
      <motion.div
        animate={{ rotateY: isFaceUp ? 180 : 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.35 }}
        className="absolute inset-0 [transform-style:preserve-3d]"
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-amber-300/35 bg-gradient-to-br from-stone-950 via-amber-950/40 to-black shadow-lg shadow-black/30 [backface-visibility:hidden] group-focus-visible:ring-4 group-focus-visible:ring-amber-200">
          <div className="absolute inset-3 rounded-xl border border-amber-200/15" />
          <div className="text-4xl drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
            🌻
          </div>
        </div>

        <div
          className={[
            "absolute inset-0 overflow-hidden rounded-2xl border bg-black shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]",
            isMatched
              ? "border-emerald-300 shadow-emerald-400/20"
              : "border-amber-300/35",
          ].join(" ")}
        >
          <SafeImage
            src={card.image}
            alt={card.alt}
            fallback={FALLBACKS[card.id] ?? "🐹"}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-2">
            <p className="truncate text-center text-xs font-black text-white md:text-sm">
              {isMatched ? "🐾 " : ""}
              {card.name}
            </p>
          </div>
        </div>
      </motion.div>
    </button>
  );
}

export function DaudaMemoryMatchGame({ data }: { data: MemoryItem[] }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [deck, setDeck] = useState<MemoryCardData[]>([]);
  const [firstSelectedId, setFirstSelectedId] = useState("");
  const [secondSelectedId, setSecondSelectedId] = useState("");
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [mismatchCount, setMismatchCount] = useState(0);
  const [bestResults, setBestResults] = useState<BestResults>(EMPTY_BEST);
  const [previewActive, setPreviewActive] = useState(false);
  const [chaosReshuffled, setChaosReshuffled] = useState(false);
  const [message, setMessage] = useState("Match every tiny treasure.");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const mismatchTimeoutRef = useRef<number | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);

  const totalPairs = deck.length / 2;
  const bestKeys = getBestKeys(difficulty);
  const bestTime = bestResults[bestKeys.time];
  const bestMoves = bestResults[bestKeys.moves];
  const finalScore = calculateFinalScore({
    difficulty,
    timer,
    moves,
    mismatchCount,
    totalPairs,
  });
  const result = getResultMessage(finalScore);

  const clearTimers = () => {
    if (mismatchTimeoutRef.current) window.clearTimeout(mismatchTimeoutRef.current);
    if (previewTimeoutRef.current) window.clearTimeout(previewTimeoutRef.current);
    mismatchTimeoutRef.current = null;
    previewTimeoutRef.current = null;
  };

  const playSound = (src: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(src);
    audio.volume = 0.25;
    audio.play().catch(() => undefined);
  };

  useEffect(() => {
    const saved = window.localStorage.getItem(BEST_KEY);
    if (!saved) return;
    try {
      setBestResults({ ...EMPTY_BEST, ...(JSON.parse(saved) as BestResults) });
    } catch {
      setBestResults(EMPTY_BEST);
    }
  }, []);

  useEffect(() => {
    if (!gameStarted || gameCompleted || previewActive) return;
    const interval = window.setInterval(() => {
      if (!document.hidden) setTimer((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [gameCompleted, gameStarted, previewActive]);

  useEffect(() => {
    if (!gameStarted || gameCompleted) return;
    if (matchedPairIds.length !== totalPairs || totalPairs === 0) return;
    setGameCompleted(true);
    playSound(AUDIO.complete);

    setBestResults((current) => {
      const next = { ...current };
      if (!next[bestKeys.time] || timer < next[bestKeys.time]) {
        next[bestKeys.time] = timer;
      }
      if (!next[bestKeys.moves] || moves < next[bestKeys.moves]) {
        next[bestKeys.moves] = moves;
      }
      window.localStorage.setItem(BEST_KEY, JSON.stringify(next));
      return next;
    });
  }, [
    bestKeys.moves,
    bestKeys.time,
    gameCompleted,
    gameStarted,
    matchedPairIds.length,
    moves,
    timer,
    totalPairs,
  ]);

  useEffect(() => {
    if (difficulty !== "chaos" || chaosReshuffled || matchedPairIds.length !== 5) {
      return;
    }
    setDeck((current) => {
      const matched = current.filter((card) => matchedPairIds.includes(card.pairId));
      const unmatched = current.filter((card) => !matchedPairIds.includes(card.pairId));
      return [...matched, ...shuffleArray(unmatched)];
    });
    setChaosReshuffled(true);
    setMessage("Tiny Brain Chaos shuffled the remaining evidence.");
  }, [chaosReshuffled, difficulty, matchedPairIds]);

  useEffect(() => clearTimers, []);

  const startGame = (nextDifficulty = difficulty) => {
    clearTimers();
    const selectedItems = nextDifficulty === "easy" ? data.slice(0, 6) : data.slice(0, 10);
    const nextDeck = createDeck(selectedItems);
    setDifficulty(nextDifficulty);
    setDeck(nextDeck);
    setFirstSelectedId("");
    setSecondSelectedId("");
    setMatchedPairIds([]);
    setIsChecking(false);
    setMoves(0);
    setTimer(0);
    setGameCompleted(false);
    setMismatchCount(0);
    setChaosReshuffled(false);
    setGameStarted(true);
    setMessage("Memorize the tiny treasures.");

    const previewSeconds = nextDifficulty === "easy" ? 3 : nextDifficulty === "chaos" ? 2 : 0;
    if (previewSeconds > 0) {
      setPreviewActive(true);
      previewTimeoutRef.current = window.setTimeout(() => {
        setPreviewActive(false);
        setMessage("Find every matching pair.");
      }, previewSeconds * 1000);
    } else {
      setPreviewActive(false);
      setMessage("Find every matching pair.");
    }
  };

  const flipCard = (cardId: string) => {
    if (previewActive || isChecking || gameCompleted) return;
    const card = deck.find((item) => item.cardId === cardId);
    if (!card || matchedPairIds.includes(card.pairId)) return;
    if (cardId === firstSelectedId) return;
    playSound(AUDIO.flip);

    if (!firstSelectedId) {
      setFirstSelectedId(cardId);
      return;
    }

    setSecondSelectedId(cardId);
    setMoves((current) => current + 1);
    setIsChecking(true);

    const firstCard = deck.find((item) => item.cardId === firstSelectedId);
    const matched = firstCard?.pairId === card.pairId;
    mismatchTimeoutRef.current = window.setTimeout(
      () => {
        if (matched && firstCard) {
          setMatchedPairIds((current) => [...current, card.pairId]);
          setMessage(getTinyMessage(true));
          playSound(AUDIO.match);
        } else {
          setMismatchCount((current) => current + 1);
          setMessage(getTinyMessage(false));
          playSound(AUDIO.wrong);
        }
        setFirstSelectedId("");
        setSecondSelectedId("");
        setIsChecking(false);
      },
      matched ? 550 : difficulty === "chaos" ? 650 : 950,
    );
  };

  const tryAnotherDifficulty = () => {
    clearTimers();
    setGameStarted(false);
    setGameCompleted(false);
  };

  if (!gameStarted) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-950/30 via-black to-black px-6 py-20 text-white">
        <div className="absolute left-[-8rem] top-20 h-80 w-80 rounded-full bg-red-900/25 blur-3xl" />
        <div className="absolute right-[-8rem] top-1/3 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
          <div className="absolute left-[12%] top-[18%] text-4xl">🌻</div>
          <div className="absolute right-[16%] top-[24%] text-3xl">🐹</div>
          <div className="absolute bottom-[18%] left-[42%] text-4xl">🌻</div>
        </div>

        <section className="relative mx-auto grid max-w-6xl gap-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/40 backdrop-blur md:grid-cols-[0.95fr_1.05fr] md:p-8">
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
            <SafeImage
              src={THUMBNAIL}
              alt="Dauda Memory Match"
              fallback="🌻"
              className="h-full min-h-[320px] w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-300">
              Memory Match
            </p>
            <h1 className="mt-4 text-5xl font-black leading-tight md:text-6xl">
              Dauda Memory Match
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-200">
              Match every tiny treasure before Dauda hides them all again.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {(["easy", "normal", "chaos"] as Difficulty[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDifficulty(option)}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left transition",
                    difficulty === option
                      ? "border-amber-300 bg-amber-300 text-black"
                      : "border-white/10 bg-white/10 text-white hover:bg-white/15",
                  ].join(" ")}
                >
                  <span className="block font-black">{DIFFICULTY_LABELS[option]}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <StatCard label="Best time" value={bestTime ? formatTime(bestTime) : "--"} />
              <StatCard label="Best moves" value={bestMoves || "--"} />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => startGame(difficulty)}
                className="rounded-xl bg-white px-5 py-3 font-black text-black transition hover:bg-slate-200"
              >
                Start Game
              </button>
              <Link
                href="/profile/dauda"
                className="rounded-xl bg-white/10 px-5 py-3 font-black text-white transition hover:bg-white/15"
              >
                Back to Dauda Games
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-950/25 via-black to-black px-4 py-8 text-white md:px-6">
      <div className="absolute left-[-10rem] top-28 h-96 w-96 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-[-10rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">
              {DIFFICULTY_LABELS[difficulty]}
            </p>
            <h1 className="mt-1 text-3xl font-black md:text-5xl">
              Dauda Memory Match
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => startGame(difficulty)}
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={() => setReducedMotion((value) => !value)}
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
            >
              Reduced Motion: {reducedMotion ? "On" : "Off"}
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((value) => !value)}
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
            >
              Sound: {soundEnabled ? "On" : "Muted"}
            </button>
            <Link
              href="/profile/dauda"
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Matches" value={`${matchedPairIds.length}/${totalPairs}`} />
          <StatCard label="Moves" value={moves} />
          <StatCard label="Timer" value={formatTime(timer)} />
          <StatCard label="Best time" value={bestTime ? formatTime(bestTime) : "--"} />
          <StatCard label="Best moves" value={bestMoves || "--"} />
          <StatCard label="Difficulty" value={DIFFICULTY_LABELS[difficulty]} />
        </div>

        <div className="mb-5 min-h-[56px] rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-center font-black text-slate-100">
          {previewActive
            ? difficulty === "easy"
              ? "Preview: cards hide in 3 seconds."
              : "Tiny Brain Chaos preview: cards hide fast."
            : message}
        </div>

        <section
          className={[
            "grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.05] p-3 shadow-2xl shadow-black/40 backdrop-blur md:gap-4 md:p-5",
            difficulty === "easy"
              ? "grid-cols-3 sm:grid-cols-4"
              : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5",
          ].join(" ")}
        >
          {deck.map((card) => {
            const selected =
              card.cardId === firstSelectedId || card.cardId === secondSelectedId;
            const matched = matchedPairIds.includes(card.pairId);
            return (
              <DaudaMemoryCard
                key={card.cardId}
                card={card}
                isFaceUp={previewActive || selected || matched}
                isMatched={matched}
                disabled={previewActive || isChecking || matched}
                reducedMotion={reducedMotion}
                onFlip={() => flipCard(card.cardId)}
              />
            );
          })}
        </section>
      </div>

      <AnimatePresence>
        {gameCompleted ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
            <motion.section
              initial={reducedMotion ? false : { scale: 0.94, opacity: 0 }}
              animate={reducedMotion ? {} : { scale: 1, opacity: 1 }}
              exit={reducedMotion ? {} : { scale: 0.94, opacity: 0 }}
              className="w-full max-w-3xl rounded-[2rem] border border-amber-300/25 bg-gradient-to-br from-zinc-950 via-amber-950/30 to-black p-6 shadow-2xl shadow-black"
            >
              <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-300">
                All Tiny Treasures Matched 🏆
              </p>
              <h2 className="mt-3 text-4xl font-black">{result.title}</h2>
              <p className="mt-3 text-lg text-slate-200">{result.message}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <StatCard label="Time" value={formatTime(timer)} />
                <StatCard label="Moves" value={moves} />
                <StatCard label="Difficulty" value={DIFFICULTY_LABELS[difficulty]} />
                <StatCard label="Score" value={finalScore} />
                <StatCard
                  label="Efficiency"
                  value={`${Math.max(10, Math.round((totalPairs / Math.max(moves, 1)) * 100))}%`}
                />
                <StatCard label="Best moves" value={bestMoves || moves} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => startGame(difficulty)}
                  className="rounded-xl bg-white px-5 py-3 font-black text-black"
                >
                  Play Again
                </button>
                <button
                  type="button"
                  onClick={tryAnotherDifficulty}
                  className="rounded-xl bg-amber-300 px-5 py-3 font-black text-black"
                >
                  Try Another Difficulty
                </button>
                <Link
                  href="/profile/dauda"
                  className="rounded-xl bg-white/10 px-5 py-3 font-black text-white"
                >
                  Back to Dauda Games
                </Link>
              </div>
            </motion.section>
          </div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
