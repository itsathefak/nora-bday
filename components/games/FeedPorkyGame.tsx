"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

const PIGGY_IMAGES = {
  default: "/videos/piggy/games/feed-pig/piggy-default.jpg",
  happy: "/videos/piggy/games/feed-pig/piggy-happy.jpg",
  angry: "/videos/piggy/games/feed-pig/piggy-angry.jpg",
};

interface FoodItem {
  id: string;
  name: string;
  image: string;
  liked: boolean;
  reaction: string;
}

interface ReactionState {
  food: FoodItem;
  message: string;
  liked: boolean;
}

function FoodImage({
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

function getPiggyImage(reaction: ReactionState | null) {
  if (!reaction) return PIGGY_IMAGES.default;
  return reaction.liked ? PIGGY_IMAGES.happy : PIGGY_IMAGES.angry;
}

function FoodCard({
  food,
  completed,
  selected,
  disabled,
  onSelect,
}: {
  food: FoodItem;
  completed: boolean;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      draggable={!completed && !disabled}
      disabled={completed || disabled}
      aria-pressed={selected}
      aria-label={
        completed
          ? `${food.name}, already tasted`
          : `Feed Porky ${food.name}`
      }
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", food.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={[
        "overflow-hidden rounded-2xl border text-left transition focus:outline-none focus:ring-2 focus:ring-red-200",
        selected
          ? "border-red-300 bg-red-500/20 shadow-lg shadow-red-950/40"
          : "border-white/10 bg-white/5 hover:border-red-300/60 hover:bg-white/10",
        completed && "cursor-not-allowed opacity-45",
        disabled && !completed && "cursor-not-allowed opacity-60",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="aspect-square bg-black/45">
        <FoodImage
          src={food.image}
          alt={`${food.name} food item`}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex min-h-16 items-center justify-between gap-2 px-3 py-3">
        <span className="text-sm font-black text-white">{food.name}</span>
        {completed && (
          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200">
            Tasted
          </span>
        )}
      </div>
    </button>
  );
}

function SummaryList({
  title,
  items,
}: {
  title: string;
  items: FoodItem[];
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

export function FeedPorkyGame({ foods }: { foods: FoodItem[] }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [testedFoodIds, setTestedFoodIds] = useState<string[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [lastReaction, setLastReaction] = useState<ReactionState | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [reactionKey, setReactionKey] = useState(0);

  const testedIds = useMemo(() => new Set(testedFoodIds), [testedFoodIds]);
  const likedFoods = foods.filter((food) => food.liked);
  const rejectedFoods = foods.filter((food) => !food.liked);

  const resetGame = () => {
    setGameStarted(false);
    setTestedFoodIds([]);
    setApprovedCount(0);
    setLastReaction(null);
    setGameCompleted(false);
    setIsReacting(false);
    setSelectedFoodId("");
    setDragActive(false);
    setReactionKey((value) => value + 1);
  };

  const startGame = () => {
    setGameStarted(true);
    setTestedFoodIds([]);
    setApprovedCount(0);
    setLastReaction(null);
    setGameCompleted(false);
    setIsReacting(false);
    setSelectedFoodId("");
    setDragActive(false);
    setReactionKey((value) => value + 1);
  };

  const feedPorky = (foodId: string) => {
    const food = foods.find((item) => item.id === foodId);
    if (!food || testedIds.has(food.id) || isReacting || gameCompleted) return;

    const nextTestedIds = [...testedFoodIds, food.id];

    setSelectedFoodId("");
    setIsReacting(true);
    setLastReaction({
      food,
      liked: food.liked,
      message: food.reaction,
    });
    setTestedFoodIds(nextTestedIds);
    setReactionKey((value) => value + 1);

    if (food.liked) {
      setApprovedCount((value) => value + 1);
    }

    window.setTimeout(() => {
      setLastReaction(null);
      setIsReacting(false);
      if (nextTestedIds.length === foods.length) {
        setGameCompleted(true);
      }
    }, 1500);
  };

  const handlePiggyClick = () => {
    if (selectedFoodId) feedPorky(selectedFoodId);
  };

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
                  <FoodImage
                    src="/videos/piggy/games/feed-pig/feed-pig.png"
                    alt="Feed Porky thumbnail"
                    className="max-h-[560px] w-full object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                    Piggy Studios Game
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                    Feed Porky
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-red-100">
                    Porky is hungry. This is a serious household emergency.
                  </p>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                    Drag food to Porky and discover whether he loves it,
                    tolerates it, or files an official complaint.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={startGame}
                      className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                    >
                      Start Feeding
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
              <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
                    Feed Porky
                  </p>
                  <h1 className="mt-2 text-3xl font-black md:text-5xl">
                    Choose the Offering
                  </h1>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      Porky Approved
                    </p>
                    <p className="mt-1 text-xl font-black text-white">
                      {approvedCount} / 5
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      Foods Tested
                    </p>
                    <p className="mt-1 text-xl font-black text-white">
                      {testedFoodIds.length} / 10
                    </p>
                  </div>
                </div>
              </header>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/45 backdrop-blur md:p-6">
                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <motion.button
                    type="button"
                    onClick={handlePiggyClick}
                    onDragOver={(event) => {
                      if (!isReacting) {
                        event.preventDefault();
                        setDragActive(true);
                      }
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragActive(false);
                      feedPorky(event.dataTransfer.getData("text/plain"));
                    }}
                    animate={
                      lastReaction && !lastReaction.liked
                        ? { x: [0, -8, 8, -5, 5, 0] }
                        : { x: 0 }
                    }
                    transition={{ duration: 0.35 }}
                    className={[
                      "relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-3xl border bg-black/45 p-4 transition focus:outline-none focus:ring-2 focus:ring-red-200",
                      dragActive || selectedFoodId
                        ? "border-red-300 bg-red-500/10"
                        : "border-white/10",
                    ].join(" ")}
                    aria-label={
                      selectedFoodId
                        ? "Feed selected item to Porky"
                        : "Porky feeding drop zone"
                    }
                  >
                    <FoodImage
                      key={lastReaction?.liked ? "happy" : lastReaction ? "angry" : "default"}
                      src={getPiggyImage(lastReaction)}
                      alt={
                        lastReaction
                          ? lastReaction.liked
                            ? "Happy Porky reaction"
                            : "Angry Porky reaction"
                          : "Porky waiting to be fed"
                      }
                      className="max-h-[560px] w-full object-contain"
                    />

                    <AnimatePresence>
                      {lastReaction && (
                        <motion.div
                          key={reactionKey}
                          initial={{ opacity: 0, y: 18, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -12, scale: 0.98 }}
                          className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/10 bg-black/75 p-5 text-left shadow-2xl"
                        >
                          <p className="text-xs font-black uppercase tracking-[0.25em] text-red-300">
                            {lastReaction.liked ? "Approved" : "Rejected"}
                          </p>
                          <p className="mt-2 text-lg font-black text-white">
                            {lastReaction.food.name}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-200 md:text-base">
                            {lastReaction.message}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {lastReaction && lastReaction.liked && (
                      <motion.div
                        key={`love-${reactionKey}`}
                        initial={{ opacity: 0, scale: 0.6, y: 20 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.6, 1.25, 1.8], y: -80 }}
                        transition={{ duration: 1.1 }}
                        className="pointer-events-none absolute text-6xl"
                      >
                        ❤️🐾
                      </motion.div>
                    )}
                  </motion.button>

                  <div>
                    <div className="mb-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-sm font-semibold text-slate-300">
                        Drag a food onto Porky, or click a food and then click
                        Porky.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                      {foods.map((food) => (
                        <FoodCard
                          key={food.id}
                          food={food}
                          completed={testedIds.has(food.id)}
                          selected={selectedFoodId === food.id}
                          disabled={isReacting}
                          onSelect={() => {
                            if (!testedIds.has(food.id) && !isReacting) {
                              setSelectedFoodId((current) =>
                                current === food.id ? "" : food.id
                              );
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
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
                Feeding Complete
              </p>
              <h1 className="mt-4 text-4xl font-black md:text-6xl">
                Certified Porky Caterer 🏆
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
                You successfully identified every food worthy of the household
                food beggar.
              </p>

              <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
                <SummaryList title="Loved" items={likedFoods} />
                <SummaryList title="Rejected" items={rejectedFoods} />
              </div>

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={startGame}
                  className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                >
                  Feed Porky Again
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

export default FeedPorkyGame;
