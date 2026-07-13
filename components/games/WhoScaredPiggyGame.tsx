"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const REACTION_IMAGES = {
  neutral: "/videos/piggy/games/scared/piggy-neutral.jpg",
  happy: "/videos/piggy/games/scared/piggy-happy.jpg",
  scared: "/videos/piggy/games/scared/piggy-scared.jpg",
  judging: "/videos/piggy/games/scared/piggy-judging.jpg",
};

interface ScaredRound {
  id: string;
  name: string;
  image: string;
  scaresPiggy: boolean;
  reaction: string;
}

function getFinalResult(score: number) {
  if (score === 12) {
    return {
      title: "Certified Porky Behaviour Expert 🏆",
      message: "You understand every fear, suspicion, and dramatic overreaction.",
    };
  }

  if (score >= 9) {
    return {
      title: "Senior Piggy Security Consultant 🐾",
      message: "You know what makes Porky run and what makes him stay.",
    };
  }

  if (score >= 6) {
    return {
      title: "Part-Time Fear Analyst",
      message: "Pretty good, but Piggy is still watching you carefully.",
    };
  }

  if (score >= 3) {
    return {
      title: "Suspicious Human",
      message: "You may need more field research and more treats.",
    };
  }

  return {
    title: "Piggy Does Not Trust Your Judgment",
    message: "Please leave one duck neck at reception and try again.",
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

function AnswerButton({
  label,
  value,
  selectedAnswer,
  correctAnswer,
  submitted,
  onSelect,
}: {
  label: string;
  value: boolean;
  selectedAnswer: boolean | null;
  correctAnswer: boolean;
  submitted: boolean;
  onSelect: () => void;
}) {
  const isSelected = selectedAnswer === value;
  const isCorrect = submitted && value === correctAnswer;
  const isWrongSelection = submitted && isSelected && value !== correctAnswer;

  return (
    <button
      type="button"
      disabled={submitted}
      aria-pressed={isSelected}
      onClick={onSelect}
      className={[
        "min-h-20 rounded-2xl border px-5 py-4 text-left text-lg font-black transition focus:outline-none focus:ring-2 focus:ring-red-200",
        "border-white/10 bg-white/[0.07] text-white hover:border-red-300/60 hover:bg-white/12",
        isSelected && !submitted && "border-red-300 bg-red-500/20",
        isCorrect && "border-emerald-400 bg-emerald-500/20",
        isWrongSelection && "border-red-500 bg-red-600/25",
        submitted && "cursor-default hover:border-white/10 hover:bg-white/[0.07]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
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

export function WhoScaredPiggyGame({ rounds }: { rounds: ScaredRound[] }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [currentReactionImage, setCurrentReactionImage] = useState(
    REACTION_IMAGES.neutral
  );
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const round = rounds[currentRound];
  const finalResult = getFinalResult(score);
  const percentage = Math.round((score / rounds.length) * 100);

  const resetGame = () => {
    setGameStarted(false);
    setCurrentRound(0);
    setSelectedAnswer(null);
    setScore(0);
    setSubmitted(false);
    setGameCompleted(false);
    setCurrentReactionImage(REACTION_IMAGES.neutral);
    setLastCorrect(null);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null || submitted) return;

    const isCorrect = selectedAnswer === round.scaresPiggy;
    setLastCorrect(isCorrect);
    setSubmitted(true);

    if (isCorrect) {
      setScore((value) => value + 1);
      setCurrentReactionImage(REACTION_IMAGES.happy);
      return;
    }

    setCurrentReactionImage(
      round.scaresPiggy ? REACTION_IMAGES.scared : REACTION_IMAGES.judging
    );
  };

  const goToNextRound = () => {
    if (currentRound === rounds.length - 1) {
      setGameCompleted(true);
      return;
    }

    setCurrentRound((value) => value + 1);
    setSelectedAnswer(null);
    setSubmitted(false);
    setCurrentReactionImage(REACTION_IMAGES.neutral);
    setLastCorrect(null);
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

      <div className="relative mx-auto max-w-6xl">
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
                  <SafeImage
                    src="/videos/piggy/games/scared/scared-piggy.png"
                    alt="Who Scared Piggy thumbnail"
                    className="max-h-[560px] w-full object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                    Piggy Studios Game
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                    Who Scared Piggy?
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-red-100">
                    Porky is brave, confident, and fearless — except for several
                    completely reasonable things.
                  </p>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                    Guess which people, pets, places, and suspicious objects make
                    Porky panic — and which ones he can tolerate.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setGameStarted(true)}
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
              key={round.id}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.25 }}
              className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/50 backdrop-blur"
            >
              <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="relative bg-black/45 p-4 md:p-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <span className="rounded-full border border-red-300/30 bg-black/60 px-4 py-2 text-sm font-bold text-red-100">
                      Round {currentRound + 1} of {rounds.length}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm font-bold text-slate-100">
                      Score: {score} / 12
                    </span>
                  </div>
                  <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/45">
                    <SafeImage
                      src={round.image}
                      alt={`${round.name} scare guess`}
                      className="max-h-[620px] w-full object-contain"
                    />
                  </div>
                </div>

                <div className="p-6 md:p-10">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
                    Does this scare Piggy?
                  </p>
                  <h1 className="mt-3 text-3xl font-black md:text-5xl">
                    {round.name}
                  </h1>

                  <motion.div
                    animate={
                      submitted && lastCorrect === false
                        ? { x: [0, -7, 7, -5, 5, 0] }
                        : { x: 0 }
                    }
                    transition={{ duration: 0.35 }}
                    className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-4"
                  >
                    <div className="relative flex min-h-60 items-center justify-center">
                      <SafeImage
                        key={currentReactionImage}
                        src={currentReactionImage}
                        alt={
                          submitted
                            ? lastCorrect
                              ? "Relieved Piggy reaction"
                              : round.scaresPiggy
                                ? "Scared Piggy reaction"
                                : "Judging Piggy reaction"
                            : "Neutral Piggy reaction"
                        }
                        className="max-h-72 w-full object-contain"
                      />
                      {submitted && lastCorrect === true && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.7, y: 18 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0.7, 1.25, 1.7],
                            y: -50,
                          }}
                          transition={{ duration: 1.15 }}
                          className="pointer-events-none absolute text-6xl"
                        >
                          ✨🐾
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <AnswerButton
                      label="Yes, absolutely"
                      value={true}
                      selectedAnswer={selectedAnswer}
                      correctAnswer={round.scaresPiggy}
                      submitted={submitted}
                      onSelect={() => {
                        if (!submitted) setSelectedAnswer(true);
                      }}
                    />
                    <AnswerButton
                      label="No, Piggy is fine"
                      value={false}
                      selectedAnswer={selectedAnswer}
                      correctAnswer={round.scaresPiggy}
                      submitted={submitted}
                      onSelect={() => {
                        if (!submitted) setSelectedAnswer(false);
                      }}
                    />
                  </div>

                  <div className="mt-7">
                    {!submitted ? (
                      <button
                        type="button"
                        disabled={selectedAnswer === null}
                        onClick={submitAnswer}
                        className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <div className="space-y-5">
                        <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
                          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">
                            Porky Report
                          </p>
                          <p className="mt-3 text-lg font-black text-white">
                            Correct answer:{" "}
                            {round.scaresPiggy
                              ? "Yes, absolutely"
                              : "No, Piggy is fine"}
                          </p>
                          <p className="mt-3 leading-relaxed text-slate-300">
                            {round.reaction}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={goToNextRound}
                          className="rounded-md bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-500"
                        >
                          {currentRound === rounds.length - 1
                            ? "See Final Score"
                            : "Next Round"}
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
              className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur md:p-14"
            >
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                Final Security Report
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

export default WhoScaredPiggyGame;
