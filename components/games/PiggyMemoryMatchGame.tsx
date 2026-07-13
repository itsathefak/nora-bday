"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const BEST_SCORE_KEY = "piggy-memory-match-best";

interface MemoryMatchItem {
  id: string;
  image: string;
  alt: string;
}

interface MemoryCard extends MemoryMatchItem {
  cardId: string;
  pairId: string;
}

interface BestScore {
  time: number;
  moves: number;
}

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

function createDeck(items: MemoryMatchItem[]) {
  return shuffleArray(
    items.flatMap((item) => [
      { ...item, pairId: item.id, cardId: `${item.id}-a` },
      { ...item, pairId: item.id, cardId: `${item.id}-b` },
    ])
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getPerformanceMessage(moves: number, time: number) {
  if (moves <= 14 || time <= 75) {
    return "Certified Porky Memory Master 🏆";
  }

  if (moves <= 20) {
    return "Sharper Memory Than Piggy’s Treat Radar 🐾";
  }

  if (moves <= 30) {
    return "Not bad. Porky only judged you a little.";
  }

  return "Piggy forgot the rules halfway through too.";
}

function isBetterScore(current: BestScore | null, next: BestScore) {
  if (!current) return true;
  if (next.time < current.time) return true;
  return next.time === current.time && next.moves < current.moves;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function MemoryCardButton({
  card,
  isFaceUp,
  isMatched,
  disabled,
  onFlip,
}: {
  card: MemoryCard;
  isFaceUp: boolean;
  isMatched: boolean;
  disabled: boolean;
  onFlip: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={
        isMatched
          ? `${card.alt}, matched`
          : isFaceUp
            ? `${card.alt}, face up`
            : "Face-down Piggy memory card"
      }
      onClick={onFlip}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onFlip();
        }
      }}
      className={[
        "group relative aspect-[3/4] rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200",
        disabled && !isFaceUp && "cursor-not-allowed",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{ rotateY: isFaceUp ? 180 : 0 }}
        transition={{ duration: 0.38 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl border border-red-300/20 bg-gradient-to-br from-red-950/45 via-slate-950 to-black shadow-2xl shadow-black/40"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_30%,rgba(239,68,68,0.22),transparent_42%)]" />
          <span className="relative text-4xl drop-shadow-lg md:text-5xl">🐾</span>
        </div>

        <div
          className={[
            "absolute inset-0 overflow-hidden rounded-2xl border bg-black shadow-2xl shadow-black/40",
            isMatched ? "border-emerald-300" : "border-white/10",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <img
            src={card.image}
            alt={card.alt}
            className="h-full w-full object-cover"
            draggable={false}
          />
          {isMatched && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [0, 1, 0], scale: [0.7, 1.2, 1.55] }}
              transition={{ duration: 0.9 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-4xl"
            >
              ✨🐾
            </motion.div>
          )}
          {isMatched && (
            <span className="absolute bottom-2 left-2 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
              Matched
            </span>
          )}
        </div>
      </motion.div>
    </button>
  );
}

export function PiggyMemoryMatchGame({
  items,
}: {
  items: MemoryMatchItem[];
}) {
  const [deck, setDeck] = useState<MemoryCard[]>([]);
  const [firstSelectedCard, setFirstSelectedCard] =
    useState<MemoryCard | null>(null);
  const [secondSelectedCard, setSecondSelectedCard] =
    useState<MemoryCard | null>(null);
  const [matchedCardIds, setMatchedCardIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [bestScore, setBestScore] = useState<BestScore | null>(null);

  const matchedIds = useMemo(() => new Set(matchedCardIds), [matchedCardIds]);
  const matchesFound = matchedCardIds.length / 2;
  const performanceMessage = getPerformanceMessage(moves, timer);

  useEffect(() => {
    const stored = window.localStorage.getItem(BEST_SCORE_KEY);
    if (!stored) return;

    try {
      setBestScore(JSON.parse(stored) as BestScore);
    } catch {
      window.localStorage.removeItem(BEST_SCORE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!gameStarted || gameCompleted) return;

    const interval = window.setInterval(() => {
      setTimer((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [gameStarted, gameCompleted]);

  useEffect(() => {
    if (!gameStarted || !deck.length || matchedCardIds.length !== deck.length) {
      return;
    }

    setGameCompleted(true);

    const nextBest = { time: timer, moves };
    if (isBetterScore(bestScore, nextBest)) {
      setBestScore(nextBest);
      window.localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(nextBest));
    }
  }, [bestScore, deck.length, gameStarted, matchedCardIds.length, moves, timer]);

  const startGame = () => {
    setDeck(createDeck(items));
    setFirstSelectedCard(null);
    setSecondSelectedCard(null);
    setMatchedCardIds([]);
    setMoves(0);
    setTimer(0);
    setGameStarted(true);
    setGameCompleted(false);
    setIsChecking(false);
  };

  const flipCard = (card: MemoryCard) => {
    if (
      isChecking ||
      matchedIds.has(card.cardId) ||
      firstSelectedCard?.cardId === card.cardId ||
      secondSelectedCard?.cardId === card.cardId
    ) {
      return;
    }

    if (!firstSelectedCard) {
      setFirstSelectedCard(card);
      return;
    }

    setSecondSelectedCard(card);
    setMoves((value) => value + 1);
    setIsChecking(true);

    if (firstSelectedCard.pairId === card.pairId) {
      window.setTimeout(() => {
        setMatchedCardIds((current) => [
          ...current,
          firstSelectedCard.cardId,
          card.cardId,
        ]);
        setFirstSelectedCard(null);
        setSecondSelectedCard(null);
        setIsChecking(false);
      }, 650);
      return;
    }

    window.setTimeout(() => {
      setFirstSelectedCard(null);
      setSecondSelectedCard(null);
      setIsChecking(false);
    }, 950);
  };

  const isFaceUp = (card: MemoryCard) =>
    matchedIds.has(card.cardId) ||
    firstSelectedCard?.cardId === card.cardId ||
    secondSelectedCard?.cardId === card.cardId;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-red-950/30 via-black to-black px-5 py-20 text-white md:px-8">
      <div className="absolute left-[-10rem] top-16 h-96 w-96 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-[-10rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-red-700/15 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/80 to-transparent" />
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
                    src="/videos/piggy/games/match/match.png"
                    alt="Piggy Memory Match thumbnail"
                    className="max-h-[560px] w-full object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                    Piggy Studios Game
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                    Piggy Memory Match
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-red-100">
                    Match every Piggy pair before Porky forgets what we were
                    doing.
                  </p>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                    Flip the cards, find all the matching Piggy pairs, and prove
                    your memory is sharper than Porky&apos;s snack radar.
                  </p>
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

          {gameStarted && !gameCompleted && (
            <motion.section
              key="board"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="mt-8"
            >
              <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
                    Piggy Memory Match
                  </p>
                  <h1 className="mt-2 text-3xl font-black md:text-5xl">
                    Find Every Pair
                  </h1>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Matches" value={`${matchesFound} / 10`} />
                  <StatCard label="Moves" value={moves} />
                  <StatCard label="Timer" value={formatTime(timer)} />
                  <StatCard
                    label="Best"
                    value={
                      bestScore
                        ? `${formatTime(bestScore.time)} / ${bestScore.moves}`
                        : "None"
                    }
                  />
                </div>
              </header>

              <div className="mt-6 grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/45 backdrop-blur sm:grid-cols-4 md:gap-4 md:p-5 lg:grid-cols-5">
                {deck.map((card) => (
                  <MemoryCardButton
                    key={card.cardId}
                    card={card}
                    isFaceUp={isFaceUp(card)}
                    isMatched={matchedIds.has(card.cardId)}
                    disabled={
                      isChecking ||
                      matchedIds.has(card.cardId) ||
                      firstSelectedCard?.cardId === card.cardId ||
                      secondSelectedCard?.cardId === card.cardId
                    }
                    onFlip={() => flipCard(card)}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {gameCompleted && (
            <motion.section
              key="complete"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur md:p-14"
            >
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                All Pairs Matched
              </p>
              <h1 className="mt-4 text-4xl font-black md:text-6xl">
                {formatTime(timer)}
              </h1>
              <p className="mt-2 text-xl font-bold text-red-100">
                {moves} moves
              </p>

              <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                <StatCard label="Best Time" value={bestScore ? formatTime(bestScore.time) : "None"} />
                <StatCard label="Lowest Moves" value={bestScore ? bestScore.moves : "None"} />
              </div>

              <h2 className="mt-8 text-3xl font-black text-white">
                {performanceMessage}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
                Porky has reviewed the board and reluctantly accepts your memory
                credentials.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-3">
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
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default PiggyMemoryMatchGame;
