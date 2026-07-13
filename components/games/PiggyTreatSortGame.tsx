"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type TreatCategory = "approved" | "rejected" | string;

interface TreatItem {
  id: string;
  name: string;
  image: string;
  category: TreatCategory;
  reaction: string;
}

interface SortedTreat {
  itemId: string;
  category: "approved" | "rejected";
}

const BEST_SCORE_KEY = "piggy-treat-sort-best";
const WRONG_MESSAGES = [
  "Porky strongly disagrees.",
  "This decision has been escalated.",
  "The household food beggar rejects your judgment.",
  "Vegetable-related incident detected.",
  "Porky is reviewing your kitchen credentials.",
];

function shuffleItems<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function getResultMessage(mistakes: number) {
  if (mistakes === 0) {
    return {
      title: "Supreme Porky Food Curator 🏆",
      message:
        "Every item was placed exactly where the household food beggar demanded.",
    };
  }
  if (mistakes <= 2) {
    return {
      title: "Certified Snack Inspector 🐾",
      message: "Porky approves your overall judgment.",
    };
  }
  if (mistakes <= 4) {
    return {
      title: "Assistant Treat Sorter",
      message: "Acceptable, but several choices were deeply concerning.",
    };
  }
  return {
    title: "Kitchen Access Under Review",
    message:
      "Piggy recommends retraining and immediate duck-neck compensation.",
  };
}

function TreatImage({
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
          "flex items-center justify-center bg-gradient-to-br from-red-950/60 via-black to-amber-950/40 text-4xl",
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

function TreatCard({
  item,
  selected,
  hinted,
  disabled,
  onSelect,
}: {
  item: TreatItem;
  selected: boolean;
  hinted: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      layout
      type="button"
      draggable={!disabled}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`Select ${item.name} for sorting`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      onDragStartCapture={(event) => {
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      animate={hinted ? { scale: [1, 1.05, 1], y: [0, -4, 0] } : { scale: 1 }}
      transition={{ duration: 0.55, repeat: hinted ? 2 : 0 }}
      className={[
        "min-w-[9rem] overflow-hidden rounded-2xl border text-left transition focus:outline-none focus:ring-2 focus:ring-amber-200 md:min-w-0",
        selected
          ? "border-amber-200 bg-amber-300/15 shadow-lg shadow-amber-950/40"
          : "border-white/10 bg-white/5 hover:border-red-300/70 hover:bg-white/10",
        hinted ? "ring-2 ring-amber-200" : "",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="aspect-square bg-black/45">
        <TreatImage
          src={item.image}
          alt={`${item.name} treat`}
          className="h-full w-full object-contain p-2"
        />
      </div>
      <div className="px-3 py-3">
        <p className="text-sm font-black text-white">{item.name}</p>
      </div>
    </motion.button>
  );
}

function BowlZone({
  category,
  title,
  subtitle,
  items,
  allItems,
  selected,
  highlighted,
  shaking,
  onSort,
}: {
  category: "approved" | "rejected";
  title: string;
  subtitle: string;
  items: SortedTreat[];
  allItems: TreatItem[];
  selected: boolean;
  highlighted: boolean;
  shaking: boolean;
  onSort: (category: "approved" | "rejected", itemId?: string) => void;
}) {
  const sortedItems = items
    .map((item) => allItems.find((treat) => treat.id === item.itemId))
    .filter(Boolean) as TreatItem[];

  return (
    <motion.button
      type="button"
      aria-label={`Sort selected item into ${title}`}
      onClick={() => onSort(category)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onSort(category, event.dataTransfer.getData("text/plain"));
      }}
      animate={
        shaking
          ? { x: [0, -8, 8, -6, 6, 0] }
          : highlighted
            ? { scale: [1, 1.02, 1] }
            : { x: 0, scale: 1 }
      }
      transition={{ duration: shaking ? 0.35 : 0.6 }}
      className={[
        "min-h-[20rem] rounded-[2rem] border p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-200",
        category === "approved"
          ? "bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.18),transparent_42%),linear-gradient(180deg,rgba(25,20,14,0.95),rgba(8,8,8,0.96))]"
          : "bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.18),transparent_42%),linear-gradient(180deg,rgba(28,17,17,0.95),rgba(8,8,8,0.96))]",
        selected ? "border-amber-200/70" : "border-white/10",
        highlighted ? "ring-2 ring-amber-200/80" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            {subtitle}
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-black text-white">
          {sortedItems.length}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sortedItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <div className="aspect-square bg-black/35">
              <TreatImage
                src={item.image}
                alt={`${item.name}, sorted into ${title}`}
                className="h-full w-full object-contain p-2"
              />
            </div>
            <div className="px-2 py-2">
              <p className="text-xs font-black text-white">{item.name}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                Correct
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.button>
  );
}

function SummaryList({
  title,
  items,
}: {
  title: string;
  items: TreatItem[];
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-5 text-left">
      <h3 className="text-sm font-black uppercase tracking-[0.25em] text-red-300">
        {title}
      </h3>
      <ul className="mt-4 space-y-2 text-slate-200">
        {items.map((item) => (
          <li key={item.id} className="font-semibold">
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PiggyTreatSortGame({ items }: { items: TreatItem[] }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [shuffledItems, setShuffledItems] = useState<TreatItem[]>([]);
  const [sortedItems, setSortedItems] = useState<SortedTreat[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(1000);
  const [timer, setTimer] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [message, setMessage] = useState("");
  const [hintItemId, setHintItemId] = useState("");
  const [hintBowl, setHintBowl] = useState<"approved" | "rejected" | "">("");
  const [shakeBowl, setShakeBowl] = useState<"approved" | "rejected" | "">("");

  const sortedIds = useMemo(
    () => new Set(sortedItems.map((item) => item.itemId)),
    [sortedItems]
  );
  const remainingItems = shuffledItems.filter((item) => !sortedIds.has(item.id));
  const approvedItems = sortedItems.filter((item) => item.category === "approved");
  const rejectedItems = sortedItems.filter((item) => item.category === "rejected");
  const result = getResultMessage(mistakes);

  const clampScore = (value: number) => Math.max(100, value);

  const startGame = () => {
    setGameStarted(true);
    setShuffledItems(shuffleItems(items));
    setSortedItems([]);
    setSelectedItem("");
    setCorrectCount(0);
    setMistakes(0);
    setHintsRemaining(3);
    setHintsUsed(0);
    setScore(1000);
    setTimer(0);
    setGameCompleted(false);
    setMessage("");
    setHintItemId("");
    setHintBowl("");
    setShakeBowl("");
  };

  const finishGame = (nextSortedItems: SortedTreat[]) => {
    if (nextSortedItems.length !== items.length) return;
    setGameCompleted(true);
    setBestScore((current) => {
      const next = Math.max(current, score);
      window.localStorage.setItem(BEST_SCORE_KEY, String(next));
      return next;
    });
  };

  const sortItem = (
    category: "approved" | "rejected",
    providedItemId?: string
  ) => {
    if (gameCompleted) return;
    const itemId = providedItemId || selectedItem;
    const item = items.find((entry) => entry.id === itemId);
    if (!item || sortedIds.has(item.id)) return;

    if (item.category === category) {
      const nextSortedItems = [...sortedItems, { itemId: item.id, category }];
      setSortedItems(nextSortedItems);
      setCorrectCount((value) => value + 1);
      setSelectedItem("");
      setHintItemId("");
      setHintBowl("");
      setMessage(item.reaction);
      window.setTimeout(() => setMessage(""), 1800);
      finishGame(nextSortedItems);
      return;
    }

    const wrongMessage =
      item.id === "dauda"
        ? "Dauda is not a menu item."
        : item.id === "broccoli" || item.id === "cucumber"
          ? "Vegetable-related incident detected."
          : WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];
    setMistakes((value) => value + 1);
    setScore((value) => clampScore(value - 50));
    setSelectedItem("");
    setShakeBowl(category);
    setMessage(wrongMessage);
    window.setTimeout(() => setShakeBowl(""), 400);
    window.setTimeout(() => setMessage(""), 1500);
  };

  const useHint = () => {
    if (hintsRemaining <= 0 || gameCompleted) return;
    const target = remainingItems[0];
    if (!target) return;
    const category = target.category === "approved" ? "approved" : "rejected";
    setHintsRemaining((value) => value - 1);
    setHintsUsed((value) => value + 1);
    setScore((value) => clampScore(value - 75));
    setHintItemId(target.id);
    setHintBowl(category);
    setMessage(`${target.name} belongs in ${category === "approved" ? "Piggy Approved" : "Piggy Says No"}.`);
    window.setTimeout(() => {
      setHintItemId("");
      setHintBowl("");
      setMessage("");
    }, 2200);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(BEST_SCORE_KEY);
    if (stored) setBestScore(Number(stored) || 0);
  }, []);

  useEffect(() => {
    if (!gameStarted || gameCompleted) return;
    const interval = window.setInterval(() => {
      setTimer((value) => {
        const next = value + 1;
        if (next > 0 && next % 10 === 0) {
          setScore((current) => clampScore(current - 20));
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [gameCompleted, gameStarted]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-red-950/30 via-black to-black px-5 py-20 text-white md:px-8">
      <div className="absolute left-[-10rem] top-20 h-96 w-96 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-[-8rem] top-1/3 h-[26rem] w-[26rem] rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div className="absolute left-[9%] top-[18%] text-5xl">🐾</div>
        <div className="absolute right-[12%] top-[20%] text-4xl">🐾</div>
        <div className="absolute bottom-[14%] left-[46%] text-5xl">🐾</div>
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
                <div className="flex min-h-[420px] items-center justify-center bg-black/45 p-4">
                  <TreatImage
                    src="/videos/piggy/games/treat-sort/treat-sort.png"
                    alt="Piggy Treat Sort thumbnail"
                    className="h-full max-h-[25rem] w-full object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                    Piggy Studios Game
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                    Piggy Treat Sort
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-red-100">
                    Porky has standards. Sort the premium snacks from the
                    culinary insults.
                  </p>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                    Drag each food into the right bowl, or click a food and then
                    choose where Porky says it belongs.
                  </p>
                  <div className="mt-7 rounded-2xl border border-white/10 bg-black/30 p-4">
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
                      Start Sorting
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
              key="game"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="mt-8"
            >
              <header className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Progress" value={`${sortedItems.length} / ${items.length}`} />
                <StatCard label="Correct" value={correctCount} />
                <StatCard label="Mistakes" value={mistakes} />
                <StatCard label="Time" value={formatTime(timer)} />
                <StatCard label="Score" value={score} />
                <StatCard label="Best" value={bestScore} />
              </header>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={useHint}
                  disabled={hintsRemaining <= 0}
                  className="rounded-md bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Use Hint ({hintsRemaining})
                </button>
                <button
                  type="button"
                  onClick={startGame}
                  className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                >
                  Restart
                </button>
              </div>

              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mx-auto mt-5 max-w-3xl rounded-2xl border border-white/10 bg-black/70 px-5 py-4 text-center text-base font-black text-white shadow-2xl"
                  >
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>

              <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/45 backdrop-blur md:p-6">
                <h2 className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
                  Food Tray
                </h2>
                <div className="mt-4 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-5 md:overflow-visible">
                  <AnimatePresence>
                    {remainingItems.map((item) => (
                      <TreatCard
                        key={item.id}
                        item={item}
                        selected={selectedItem === item.id}
                        hinted={hintItemId === item.id}
                        disabled={false}
                        onSelect={() =>
                          setSelectedItem((current) =>
                            current === item.id ? "" : item.id
                          )
                        }
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              <section className="mt-6 grid gap-5 lg:grid-cols-2">
                <BowlZone
                  category="approved"
                  title="Piggy Approved"
                  subtitle="Premium offerings only"
                  items={approvedItems}
                  allItems={items}
                  selected={Boolean(selectedItem)}
                  highlighted={hintBowl === "approved"}
                  shaking={shakeBowl === "approved"}
                  onSort={sortItem}
                />
                <BowlZone
                  category="rejected"
                  title="Piggy Says No"
                  subtitle="Suspicious foods and non-foods"
                  items={rejectedItems}
                  allItems={items}
                  selected={Boolean(selectedItem)}
                  highlighted={hintBowl === "rejected"}
                  shaking={shakeBowl === "rejected"}
                  onSort={sortItem}
                />
              </section>
            </motion.section>
          )}

          {gameCompleted && (
            <motion.section
              key="complete"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="mx-auto mt-10 max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur md:p-10"
            >
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                Porky’s Menu Restored 🏆
              </p>
              <h1 className="mt-4 text-4xl font-black md:text-6xl">
                {result.title}
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
                {result.message}
              </p>
              <p className="mx-auto mt-3 max-w-3xl text-slate-400">
                You successfully protected Porky from vegetables, citrus, and
                other unacceptable offerings.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Final Score" value={score} />
                <StatCard label="Best Score" value={Math.max(bestScore, score)} />
                <StatCard label="Time" value={formatTime(timer)} />
                <StatCard label="Mistakes" value={mistakes} />
                <StatCard label="Hints Used" value={hintsUsed} />
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <SummaryList
                  title="Approved Items"
                  items={items.filter((item) => item.category === "approved")}
                />
                <SummaryList
                  title="Rejected Items"
                  items={items.filter((item) => item.category === "rejected")}
                />
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={startGame}
                  className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                >
                  Sort Again
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

export default PiggyTreatSortGame;
