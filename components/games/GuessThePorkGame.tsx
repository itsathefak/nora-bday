"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

interface GuessThePorkItem {
  id: string;
  image: string;
  answer: string;
}

type Assignments = Record<string, string>;

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

function getMessage(score: number) {
  if (score === 7) return "Certified Pork Expert 🏆";
  if (score >= 5) return "You know Porky extremely well 🐾";
  if (score >= 3) return "Not bad, but Piggy is judging you.";
  return "Piggy says you need more research and more treats.";
}

function AnswerChip({
  label,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      draggable={!disabled}
      disabled={disabled}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", label);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={[
        "rounded-full border px-4 py-3 text-sm font-bold transition",
        selected
          ? "border-red-300 bg-red-500/25 text-white shadow-lg shadow-red-950/40"
          : "border-white/10 bg-white/8 text-slate-100 hover:border-red-300/60 hover:bg-white/12",
        disabled && "cursor-not-allowed opacity-40",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </button>
  );
}

function ImageSlot({
  item,
  assignedAnswer,
  selectedAnswer,
  submitted,
  onAssign,
  onClear,
}: {
  item: GuessThePorkItem;
  assignedAnswer?: string;
  selectedAnswer: string;
  submitted: boolean;
  onAssign: (itemId: string, answer: string) => void;
  onClear: (itemId: string) => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const correct = assignedAnswer === item.answer;
  const wrong = submitted && !!assignedAnswer && !correct;

  const placeAnswer = (answer: string) => {
    if (!submitted && answer) onAssign(item.id, answer);
  };

  return (
    <motion.div
      layout
      className={[
        "overflow-hidden rounded-3xl border bg-white/5 shadow-2xl shadow-black/35 transition",
        dragActive ? "border-red-300 bg-red-500/10" : "border-white/10",
        submitted && correct && "border-emerald-400 bg-emerald-500/10",
        wrong && "border-red-500 bg-red-600/10",
      ]
        .filter(Boolean)
        .join(" ")}
      onDragOver={(event) => {
        if (!submitted) {
          event.preventDefault();
          setDragActive(true);
        }
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        placeAnswer(event.dataTransfer.getData("text/plain"));
      }}
      onClick={() => placeAnswer(selectedAnswer)}
    >
      <div className="relative aspect-[4/3] bg-slate-950">
        {!imageFailed ? (
          <img
            src={item.image}
            alt={`Zoomed Piggy ${item.answer}`}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-950/50 via-slate-950 to-black text-5xl">
            🐾
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
          <span className={assignedAnswer ? "font-bold text-white" : "text-sm text-slate-500"}>
            {assignedAnswer || "Drop answer here"}
          </span>
          {assignedAnswer && !submitted && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClear(item.id);
              }}
              className="text-xs font-semibold text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {wrong && (
          <p className="text-sm font-semibold text-red-200">
            Correct answer: {item.answer}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function GuessThePorkGame({ items }: { items: GuessThePorkItem[] }) {
  const [gameKey, setGameKey] = useState(0);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const imageItems = useMemo(() => shuffleArray(items), [items, gameKey]);
  const answers = useMemo(
    () => shuffleArray(items.map((item) => item.answer)),
    [items, gameKey]
  );

  const usedAnswers = new Set(Object.values(assignments));
  const allAnswered = Object.keys(assignments).length === items.length;
  const score = items.reduce(
    (total, item) => total + (assignments[item.id] === item.answer ? 1 : 0),
    0
  );
  const percentage = Math.round((score / items.length) * 100);

  const assignAnswer = (itemId: string, answer: string) => {
    if (submitted) return;

    setAssignments((current) => {
      const next: Assignments = {};

      Object.entries(current).forEach(([slotId, assignedAnswer]) => {
        if (slotId !== itemId && assignedAnswer !== answer) {
          next[slotId] = assignedAnswer;
        }
      });

      next[itemId] = answer;
      return next;
    });
    setSelectedAnswer("");
  };

  const clearAnswer = (itemId: string) => {
    setAssignments((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  };

  const resetGame = () => {
    setAssignments({});
    setSelectedAnswer("");
    setSubmitted(false);
    setGameKey((value) => value + 1);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-red-950/30 via-black to-black px-6 py-24 text-white">
      <div className="absolute left-8 top-20 h-80 w-80 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-red-700/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div className="absolute left-[8%] top-[18%] text-5xl">🐾</div>
        <div className="absolute right-[12%] top-[24%] text-4xl">🐾</div>
        <div className="absolute bottom-[14%] left-[40%] text-5xl">🐾</div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <Link
          href="/profile/piggy"
          className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Back to Piggy Games
        </Link>

        <header className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-red-400">
              Piggy Studios Game
            </p>
            <h1 className="mt-3 text-4xl font-black md:text-6xl">
              Guess the Pork
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-300">
              Can you identify every zoomed-in part of Porky?
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200">
            {submitted ? (
              <>
                Score: <span className="text-white">{score}</span> / 7
              </>
            ) : (
              <>
                Matched:{" "}
                <span className="text-white">{Object.keys(assignments).length}</span> / 7
              </>
            )}
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {imageItems.map((item) => (
              <ImageSlot
                key={item.id}
                item={item}
                assignedAnswer={assignments[item.id]}
                selectedAnswer={selectedAnswer}
                submitted={submitted}
                onAssign={assignAnswer}
                onClear={clearAnswer}
              />
            ))}
          </div>

          <aside className="h-fit rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur lg:sticky lg:top-8">
            <h2 className="text-lg font-bold text-white">Answer Labels</h2>
            <p className="mt-2 text-sm text-slate-400">
              Drag a label onto a photo, or click a label and then click a photo.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {answers.map((answer) => (
                <AnswerChip
                  key={answer}
                  label={answer}
                  selected={selectedAnswer === answer}
                  disabled={submitted || usedAnswers.has(answer)}
                  onSelect={() =>
                    setSelectedAnswer((current) =>
                      current === answer ? "" : answer
                    )
                  }
                />
              ))}
            </div>

            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-3xl border border-red-300/20 bg-black/35 p-5"
              >
                <p className="text-4xl font-black text-white">{score}/7</p>
                <p className="mt-1 text-lg font-bold text-red-200">
                  {percentage}%
                </p>
                <p className="mt-4 text-sm font-semibold text-white">
                  {getMessage(score)}
                </p>
              </motion.div>
            )}

            <div className="mt-6 grid gap-3">
              {!submitted ? (
                <button
                  type="button"
                  disabled={!allAnswered}
                  onClick={() => setSubmitted(true)}
                  className="rounded-md bg-white px-5 py-3 font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Check My Answers
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetGame}
                  className="rounded-md bg-white px-5 py-3 font-semibold text-black transition hover:bg-slate-200"
                >
                  Play Again
                </button>
              )}

              <button
                type="button"
                onClick={resetGame}
                className="rounded-md bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
              >
                Reset
              </button>

              {submitted && (
                <Link
                  href="/profile/piggy"
                  className="rounded-md bg-red-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-red-500"
                >
                  Back to Piggy Games
                </Link>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default GuessThePorkGame;
