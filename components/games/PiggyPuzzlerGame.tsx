"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type Difficulty = "easy" | "medium" | "hard";

interface PuzzleImage {
  id: string;
  title: string;
  image: string;
  alt: string;
}

interface PuzzlePiece {
  id: string;
  correctSlot: number;
  row: number;
  col: number;
}

type BoardSlots = Record<number, PuzzlePiece | null>;

const DIFFICULTIES: Array<{
  id: Difficulty;
  label: string;
  gridSize: number;
  baseScore: number;
}> = [
  { id: "easy", label: "Easy", gridSize: 3, baseScore: 500 },
  { id: "medium", label: "Medium", gridSize: 4, baseScore: 1000 },
  { id: "hard", label: "Hard", gridSize: 5, baseScore: 1500 },
];

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

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getDifficultyConfig(difficulty: Difficulty) {
  return DIFFICULTIES.find((item) => item.id === difficulty) || DIFFICULTIES[0];
}

function createPieces(gridSize: number) {
  return Array.from({ length: gridSize * gridSize }, (_, index) => ({
    id: `piece-${index}`,
    correctSlot: index,
    row: Math.floor(index / gridSize),
    col: index % gridSize,
  }));
}

function createEmptySlots(count: number): BoardSlots {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => [index, null])
  ) as BoardSlots;
}

function getResultMessage(difficulty: Difficulty, manyMoves: boolean) {
  if (manyMoves) {
    return "Piggy was beginning to question the reconstruction budget.";
  }

  if (difficulty === "hard") {
    return "Master Porky Architect 🏆";
  }

  if (difficulty === "medium") {
    return "Certified Fluff Engineer 🐾";
  }

  return "Junior Porky Technician";
}

function getResultSubcopy(difficulty: Difficulty) {
  if (difficulty === "hard") {
    return "You rebuilt maximum fluff under highly demanding conditions.";
  }

  if (difficulty === "medium") {
    return "Excellent work. Porky is once again structurally sound.";
  }

  return "You successfully reconstructed the household food beggar.";
}

function calculateScore({
  difficulty,
  gridSize,
  moves,
  timer,
  guideEnabled,
}: {
  difficulty: Difficulty;
  gridSize: number;
  moves: number;
  timer: number;
  guideEnabled: boolean;
}) {
  const minimumMoves = gridSize * gridSize;
  const base = getDifficultyConfig(difficulty).baseScore;
  const movePenalty = Math.max(0, moves - minimumMoves) * 8;
  const timePenalty = timer * 2;
  const guidePenalty = guideEnabled ? Math.round(base * 0.18) : 0;

  return Math.max(0, base - movePenalty - timePenalty - guidePenalty);
}

function PuzzlePieceFace({
  piece,
  image,
  gridSize,
  className = "",
}: {
  piece: PuzzlePiece;
  image: string;
  gridSize: number;
  className?: string;
}) {
  const backgroundPositionX =
    gridSize === 1 ? 0 : (piece.col / (gridSize - 1)) * 100;
  const backgroundPositionY =
    gridSize === 1 ? 0 : (piece.row / (gridSize - 1)) * 100;

  return (
    <div
      className={[
        "h-full w-full rounded-xl border border-white/10 bg-slate-950 bg-cover bg-no-repeat shadow-inner",
        className,
      ].join(" ")}
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
        backgroundPosition: `${backgroundPositionX}% ${backgroundPositionY}%`,
      }}
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

function SafePreview({
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
          "flex items-center justify-center bg-gradient-to-br from-red-950/50 via-slate-950 to-black text-5xl",
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

export function PiggyPuzzlerGame({ images }: { images: PuzzleImage[] }) {
  const [selectedImageId, setSelectedImageId] = useState(images[0]?.id || "");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [boardSlots, setBoardSlots] = useState<BoardSlots>({});
  const [selectedPiece, setSelectedPiece] = useState<PuzzlePiece | null>(null);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [guideEnabled, setGuideEnabled] = useState(false);
  const [sparkleSlot, setSparkleSlot] = useState<number | null>(null);

  const selectedImage =
    images.find((image) => image.id === selectedImageId) || images[0];
  const difficultyConfig = getDifficultyConfig(difficulty);
  const gridSize = difficultyConfig.gridSize;
  const totalPieces = gridSize * gridSize;
  const placedPieces = Object.values(boardSlots).filter(Boolean).length;
  const correctPieces = Object.entries(boardSlots).filter(
    ([slot, piece]) => piece?.correctSlot === Number(slot)
  ).length;
  const trayPieces = pieces.filter(
    (piece) =>
      !Object.values(boardSlots).some((slotPiece) => slotPiece?.id === piece.id)
  );
  const score = calculateScore({
    difficulty,
    gridSize,
    moves,
    timer,
    guideEnabled,
  });
  const manyMoves = moves > totalPieces * 2.4;

  useEffect(() => {
    if (!gameStarted || gameCompleted) return;

    const interval = window.setInterval(() => {
      setTimer((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [gameCompleted, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameCompleted) return;

    if (placedPieces === totalPieces && correctPieces === totalPieces) {
      setGameCompleted(true);
    }
  }, [correctPieces, gameCompleted, gameStarted, placedPieces, totalPieces]);

  const startPuzzle = () => {
    const nextPieces = createPieces(gridSize);
    let shuffled = shuffleArray(nextPieces);
    const startsSolved = shuffled.every(
      (piece, index) => piece.correctSlot === index
    );

    if (startsSolved) {
      shuffled = [...shuffled.slice(1), shuffled[0]];
    }

    setPieces(shuffled);
    setBoardSlots(createEmptySlots(totalPieces));
    setSelectedPiece(null);
    setMoves(0);
    setTimer(0);
    setGameStarted(true);
    setGameCompleted(false);
    setSparkleSlot(null);
  };

  const resetToStart = () => {
    setGameStarted(false);
    setPieces([]);
    setBoardSlots({});
    setSelectedPiece(null);
    setMoves(0);
    setTimer(0);
    setGameCompleted(false);
    setSparkleSlot(null);
  };

  const tryAnotherPhoto = () => {
    setGameCompleted(false);
    setPieces([]);
    setBoardSlots({});
    setSelectedPiece(null);
    setMoves(0);
    setTimer(0);
    setSparkleSlot(null);
    setGameStarted(false);
  };

  const placePiece = (slotIndex: number, piece: PuzzlePiece | null) => {
    if (!piece || gameCompleted) return;

    setBoardSlots((current) => {
      const next = { ...current };
      const currentPieceInSlot = next[slotIndex];

      Object.entries(next).forEach(([slot, slotPiece]) => {
        if (slotPiece?.id === piece.id) {
          next[Number(slot)] = null;
        }
      });

      if (currentPieceInSlot && currentPieceInSlot.id !== piece.id) {
        const previousSlot = Object.entries(current).find(
          ([, slotPiece]) => slotPiece?.id === piece.id
        )?.[0];
        if (previousSlot !== undefined) {
          next[Number(previousSlot)] = currentPieceInSlot;
        }
      }

      next[slotIndex] = piece;
      return next;
    });

    setMoves((value) => value + 1);
    setSelectedPiece(null);

    if (piece.correctSlot === slotIndex) {
      setSparkleSlot(slotIndex);
      window.setTimeout(() => setSparkleSlot(null), 800);
    }
  };

  const removePieceFromSlot = (slotIndex: number) => {
    const piece = boardSlots[slotIndex];
    if (!piece || piece.correctSlot === slotIndex || gameCompleted) return;

    setBoardSlots((current) => ({ ...current, [slotIndex]: null }));
    setSelectedPiece(piece);
  };

  const handlePieceKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    piece: PuzzlePiece
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedPiece((current) => (current?.id === piece.id ? null : piece));
    }
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
                  <SafePreview
                    src="/videos/piggy/games/puzzler/piggy-puzzler.png"
                    alt="Piggy Puzzler thumbnail"
                    className="max-h-[560px] w-full object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                    Piggy Studios Game
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                    Piggy Puzzler
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-red-100">
                    Porky has been split into several highly inconvenient pieces.
                  </p>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                    Put Porky back together one piece at a time and prove you
                    understand the true shape of maximum fluff.
                  </p>

                  <div className="mt-8 grid gap-5">
                    <fieldset>
                      <legend className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
                        Difficulty
                      </legend>
                      <div className="flex flex-wrap gap-3">
                        {DIFFICULTIES.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            aria-pressed={difficulty === item.id}
                            onClick={() => setDifficulty(item.id)}
                            className={[
                              "rounded-md px-5 py-3 font-bold transition",
                              difficulty === item.id
                                ? "bg-white text-black"
                                : "bg-white/10 text-white hover:bg-white/15",
                            ].join(" ")}
                          >
                            {item.label} {item.gridSize}×{item.gridSize}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <label className="grid gap-3">
                      <span className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
                        Choose Photo
                      </span>
                      <select
                        value={selectedImageId}
                        onChange={(event) => setSelectedImageId(event.target.value)}
                        className="rounded-md border border-white/10 bg-black/60 px-4 py-3 font-bold text-white"
                      >
                        {images.map((image) => (
                          <option key={image.id} value={image.id}>
                            {image.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={startPuzzle}
                        className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                      >
                        Start Puzzle
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
                    Piggy Puzzler
                  </p>
                  <h1 className="mt-2 text-3xl font-black md:text-5xl">
                    Rebuild Maximum Fluff
                  </h1>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <StatCard label="Placed" value={`${placedPieces} / ${totalPieces}`} />
                  <StatCard label="Correct" value={`${correctPieces} / ${totalPieces}`} />
                  <StatCard label="Moves" value={moves} />
                  <StatCard label="Timer" value={formatTime(timer)} />
                  <StatCard label="Mode" value={difficultyConfig.label} />
                </div>
              </header>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={startPuzzle}
                  className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                >
                  Play Again
                </button>
                <button
                  type="button"
                  aria-pressed={guideEnabled}
                  onClick={() => setGuideEnabled((value) => !value)}
                  className={[
                    "rounded-md px-5 py-3 font-bold transition",
                    guideEnabled
                      ? "bg-amber-300 text-black"
                      : "bg-white/10 text-white hover:bg-white/15",
                  ].join(" ")}
                >
                  Show faint guide
                </button>
                <button
                  type="button"
                  onClick={tryAnotherPhoto}
                  className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                >
                  Try Another Photo
                </button>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/45 backdrop-blur">
                  <div
                    className="relative mx-auto grid aspect-square max-h-[76vh] max-w-[min(76vh,100%)] overflow-hidden rounded-3xl border border-white/10 bg-black/50"
                    style={{
                      gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                    }}
                  >
                    {guideEnabled && (
                      <div
                        className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat opacity-20"
                        style={{ backgroundImage: `url(${selectedImage.image})` }}
                      />
                    )}

                    {Array.from({ length: totalPieces }, (_, slotIndex) => {
                      const piece = boardSlots[slotIndex];
                      const locked = piece?.correctSlot === slotIndex;

                      return (
                        <button
                          key={slotIndex}
                          type="button"
                          disabled={locked || gameCompleted}
                          aria-label={`Puzzle slot ${slotIndex + 1}${
                            piece ? `, contains ${piece.id}` : ", empty"
                          }`}
                          onClick={() => {
                            if (selectedPiece) {
                              placePiece(slotIndex, selectedPiece);
                            } else {
                              removePieceFromSlot(slotIndex);
                            }
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            const pieceId = event.dataTransfer.getData("text/plain");
                            const draggedPiece = pieces.find(
                              (item) => item.id === pieceId
                            );
                            placePiece(slotIndex, draggedPiece || null);
                          }}
                          className={[
                            "relative border border-white/10 bg-white/[0.03] p-0.5 transition focus:outline-none focus:ring-2 focus:ring-amber-200",
                            selectedPiece && !locked ? "bg-amber-300/10" : "",
                            locked ? "cursor-default ring-1 ring-emerald-300/70" : "",
                          ].join(" ")}
                        >
                          {piece && (
                            <motion.div
                              layout
                              className="h-full w-full"
                              initial={{ opacity: 0, scale: 0.86 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              <PuzzlePieceFace
                                piece={piece}
                                image={selectedImage.image}
                                gridSize={gridSize}
                              />
                            </motion.div>
                          )}
                          {sparkleSlot === slotIndex && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 1.7] }}
                              transition={{ duration: 0.8 }}
                              className="pointer-events-none absolute inset-0 flex items-center justify-center text-4xl"
                            >
                              ✨
                            </motion.span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <aside className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/45 backdrop-blur lg:max-h-[82vh] lg:overflow-auto">
                  <h2 className="text-xl font-black text-white">Puzzle Pieces</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Drag a piece into the board, or click a piece and then click a
                    slot. Correct pieces lock into place.
                  </p>

                  {selectedPiece && (
                    <p className="mt-4 rounded-2xl border border-amber-200/30 bg-amber-300/10 p-3 text-sm font-bold text-amber-100">
                      Selected: {selectedPiece.id}. Choose a board slot.
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-3">
                    {trayPieces.map((piece) => (
                      <button
                        key={piece.id}
                        type="button"
                        draggable={!gameCompleted}
                        aria-pressed={selectedPiece?.id === piece.id}
                        aria-label={`Puzzle piece for row ${piece.row + 1}, column ${piece.col + 1}`}
                        onClick={() =>
                          setSelectedPiece((current) =>
                            current?.id === piece.id ? null : piece
                          )
                        }
                        onKeyDown={(event) => handlePieceKeyDown(event, piece)}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", piece.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        className={[
                          "aspect-square rounded-2xl border bg-black/50 p-1 transition focus:outline-none focus:ring-2 focus:ring-amber-200",
                          selectedPiece?.id === piece.id
                            ? "border-amber-200 shadow-lg shadow-amber-950/40"
                            : "border-white/10 hover:border-red-300/60",
                        ].join(" ")}
                      >
                        <PuzzlePieceFace
                          piece={piece}
                          image={selectedImage.image}
                          gridSize={gridSize}
                        />
                      </button>
                    ))}
                  </div>
                </aside>
              </div>

              <AnimatePresence>
                {gameCompleted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: 18 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="relative max-h-[92vh] w-full max-w-4xl overflow-auto rounded-3xl border border-white/10 bg-zinc-950 p-6 text-center shadow-2xl shadow-black md:p-10"
                    >
                      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                        {Array.from({ length: 12 }).map((_, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, y: -20, x: `${index * 9}%` }}
                            animate={{ opacity: [0, 1, 0], y: ["0%", "80%"] }}
                            transition={{
                              duration: 2.2,
                              delay: index * 0.08,
                              repeat: Infinity,
                              repeatDelay: 1.4,
                            }}
                            className="absolute top-0 text-2xl"
                          >
                            🐾
                          </motion.span>
                        ))}
                      </div>

                      <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                        Puzzle Complete
                      </p>
                      <h2 className="mt-4 text-4xl font-black md:text-6xl">
                        Porky Reassembled 🏆
                      </h2>
                      <div className="mx-auto mt-6 max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-black">
                        <SafePreview
                          src={selectedImage.image}
                          alt={selectedImage.alt}
                          className="max-h-[360px] w-full object-contain"
                        />
                      </div>

                      <h3 className="mt-7 text-2xl font-black text-white">
                        {getResultMessage(difficulty, manyMoves)}
                      </h3>
                      <p className="mx-auto mt-3 max-w-2xl text-slate-300">
                        {manyMoves
                          ? "Porky was beginning to question the reconstruction budget."
                          : getResultSubcopy(difficulty)}
                      </p>

                      <div className="mt-7 grid gap-3 sm:grid-cols-5">
                        <StatCard label="Time" value={formatTime(timer)} />
                        <StatCard label="Moves" value={moves} />
                        <StatCard label="Difficulty" value={difficultyConfig.label} />
                        <StatCard label="Guide" value={guideEnabled ? "Used" : "Off"} />
                        <StatCard label="Score" value={score} />
                      </div>

                      <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <button
                          type="button"
                          onClick={startPuzzle}
                          className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                        >
                          Play Again
                        </button>
                        <button
                          type="button"
                          onClick={tryAnotherPhoto}
                          className="rounded-md bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-500"
                        >
                          Try Another Photo
                        </button>
                        <Link
                          href="/profile/piggy"
                          className="rounded-md bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15"
                        >
                          Back to Piggy Games
                        </Link>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default PiggyPuzzlerGame;
