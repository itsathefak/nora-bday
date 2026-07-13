"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

interface OutfitRound {
  id: number;
  image: string;
  correctAnswer: string;
  options: string[];
  review: string;
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

function getFinalResult(score: number) {
  if (score === 12) {
    return {
      title: "Official Porky Stylist 🏆",
      message:
        "You understand high fashion, maximum fluff, and deeply questionable wardrobe choices.",
    };
  }

  if (score >= 9) {
    return {
      title: "Senior Fashion Consultant 🐾",
      message: "Porky would trust you with his next red-carpet outfit.",
    };
  }

  if (score >= 6) {
    return {
      title: "Junior Outfit Inspector",
      message: "You showed promise, but several looks clearly confused you.",
    };
  }

  if (score >= 3) {
    return {
      title: "Suspicious Fashion Assistant",
      message: "Porky is reviewing your credentials near the food bowl.",
    };
  }

  return {
    title: "Banned from Porky Fashion Week",
    message: "Please study more outfits and return with duck neck.",
  };
}

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 18 }).map((_, index) => (
        <motion.span
          key={index}
          initial={{
            opacity: 0,
            y: -30,
            x: `${10 + index * 5}%`,
            rotate: 0,
          }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: ["0vh", "42vh", "78vh"],
            rotate: 360,
          }}
          transition={{
            duration: 2.8,
            delay: index * 0.06,
            repeat: Infinity,
            repeatDelay: 1.8,
          }}
          className="absolute top-0 text-xl"
        >
          {index % 3 === 0 ? "🐾" : index % 3 === 1 ? "✨" : "❤️"}
        </motion.span>
      ))}
    </div>
  );
}

function AnswerButton({
  option,
  selectedAnswer,
  correctAnswer,
  submitted,
  onSelect,
}: {
  option: string;
  selectedAnswer: string;
  correctAnswer: string;
  submitted: boolean;
  onSelect: () => void;
}) {
  const isSelected = selectedAnswer === option;
  const isCorrect = submitted && option === correctAnswer;
  const isWrongSelection = submitted && isSelected && option !== correctAnswer;

  return (
    <button
      type="button"
      disabled={submitted}
      aria-pressed={isSelected}
      onClick={onSelect}
      className={[
        "min-h-16 rounded-2xl border px-5 py-4 text-left text-base font-bold transition focus:outline-none focus:ring-2 focus:ring-red-200 md:text-lg",
        "border-white/10 bg-white/[0.07] text-slate-100 hover:border-red-300/60 hover:bg-white/12",
        isSelected && !submitted && "border-red-300 bg-red-500/20",
        isCorrect && "border-emerald-400 bg-emerald-500/20 text-white",
        isWrongSelection && "border-red-500 bg-red-600/25 text-white",
        submitted && "cursor-default hover:border-white/10 hover:bg-white/[0.07]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="flex items-center justify-between gap-3">
        <span>{option}</span>
        {isSelected && !submitted && (
          <span className="text-xs uppercase tracking-[0.2em] text-red-100">
            Selected
          </span>
        )}
        {isCorrect && (
          <span className="text-xs uppercase tracking-[0.2em] text-emerald-100">
            Correct
          </span>
        )}
        {isWrongSelection && (
          <span className="text-xs uppercase tracking-[0.2em] text-red-100">
            Your pick
          </span>
        )}
      </span>
    </button>
  );
}

export function PorkysFashionPoliceGame({
  rounds,
}: {
  rounds: OutfitRound[];
}) {
  const [started, setStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  const round = rounds[currentRound];
  const shuffledOptions = useMemo(
    () => shuffleArray(round?.options || []),
    [round, shuffleKey]
  );
  const percentage = Math.round((score / rounds.length) * 100);
  const finalResult = getFinalResult(score);
  const selectedCorrect = selectedAnswer === round?.correctAnswer;

  const resetGame = () => {
    setStarted(false);
    setCurrentRound(0);
    setSelectedAnswer("");
    setScore(0);
    setSubmitted(false);
    setGameCompleted(false);
    setShuffleKey((value) => value + 1);
    setImageFailed(false);
  };

  const submitAnswer = () => {
    if (!selectedAnswer || submitted) return;

    if (selectedAnswer === round.correctAnswer) {
      setScore((value) => value + 1);
    }

    setSubmitted(true);
  };

  const goToNextRound = () => {
    if (currentRound === rounds.length - 1) {
      setGameCompleted(true);
      return;
    }

    setCurrentRound((value) => value + 1);
    setSelectedAnswer("");
    setSubmitted(false);
    setShuffleKey((value) => value + 1);
    setImageFailed(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-red-950/30 via-black to-black px-5 py-20 text-white md:px-8">
      <div className="absolute left-[-8rem] top-16 h-96 w-96 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-[-10rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-red-700/15 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/80 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div className="absolute left-[8%] top-[20%] text-5xl">🐾</div>
        <div className="absolute right-[12%] top-[16%] text-4xl">🐾</div>
        <div className="absolute bottom-[16%] left-[44%] text-5xl">🐾</div>
      </div>

      {gameCompleted && score === rounds.length && <Confetti />}

      <div className="relative mx-auto max-w-6xl">
        <Link
          href="/profile/piggy"
          className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Back to Piggy Games
        </Link>

        <AnimatePresence mode="wait">
          {!started && (
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
                    src="/videos/piggy/games/outfit/outfit-piggy.png"
                    alt="Porky in one of his fashion police outfits"
                    className="max-h-[560px] w-full object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                    Piggy Studios Game
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                    Porky&apos;s Fashion Police
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-red-100">
                    Can you correctly identify every one of Porky&apos;s
                    questionable fashion eras?
                  </p>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                    Porky has had many fashion eras. Some iconic. Some
                    confusing. All expensive.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setStarted(true)}
                      className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                    >
                      Start Challenge
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

          {started && !gameCompleted && (
            <motion.section
              key={round.id}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.25 }}
              className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/50 backdrop-blur"
            >
              <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="relative flex min-h-[520px] items-center justify-center bg-black/45 p-4 md:p-6">
                  <div className="absolute left-5 top-5 rounded-full border border-red-300/30 bg-black/60 px-4 py-2 text-sm font-bold text-red-100">
                    Look {currentRound + 1} of {rounds.length}
                  </div>
                  {!imageFailed ? (
                    <img
                      src={round.image}
                      alt={`Porky outfit look ${round.id}`}
                      onError={() => setImageFailed(true)}
                      className="max-h-[680px] w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-96 w-full items-center justify-center rounded-3xl bg-gradient-to-br from-red-950/40 via-black to-black text-6xl">
                      🐾
                    </div>
                  )}
                  {submitted && selectedCorrect && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.7, 1.35, 1.8] }}
                      transition={{ duration: 1.2 }}
                      className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl"
                    >
                      ✨🐾
                    </motion.div>
                  )}
                </div>

                <div className="p-6 md:p-10">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
                        Fashion Police
                      </p>
                      <h1 className="mt-3 text-3xl font-black md:text-5xl">
                        Name This Look
                      </h1>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-slate-200">
                      Score: <span className="text-white">{score}</span> / 12
                    </div>
                  </div>

                  <div className="mt-8 grid gap-3">
                    {shuffledOptions.map((option) => (
                      <AnswerButton
                        key={option}
                        option={option}
                        selectedAnswer={selectedAnswer}
                        correctAnswer={round.correctAnswer}
                        submitted={submitted}
                        onSelect={() => {
                          if (!submitted) setSelectedAnswer(option);
                        }}
                      />
                    ))}
                  </div>

                  <div className="mt-8">
                    {!submitted ? (
                      <button
                        type="button"
                        disabled={!selectedAnswer}
                        onClick={submitAnswer}
                        className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Submit Look
                      </button>
                    ) : (
                      <div className="space-y-5">
                        <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
                          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">
                            Fashion Review
                          </p>
                          <p className="mt-3 text-lg font-bold text-white">
                            Correct answer: {round.correctAnswer}
                          </p>
                          <p className="mt-3 leading-relaxed text-slate-300">
                            {round.review}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={goToNextRound}
                          className="rounded-md bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-500"
                        >
                          {currentRound === rounds.length - 1
                            ? "See Final Score"
                            : "Next Look"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {gameCompleted && (
            <motion.section
              key="final"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="relative mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur md:p-14"
            >
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                Final Verdict
              </p>
              <h1 className="mt-4 text-4xl font-black md:text-6xl">
                {score} / 12
              </h1>
              <p className="mt-2 text-2xl font-bold text-red-100">
                {percentage}%
              </p>
              <h2 className="mt-8 text-3xl font-black text-white">
                {finalResult.title}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
                {finalResult.message}
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetGame}
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

export default PorkysFashionPoliceGame;
