"use client";

import Link from "next/link";
import { useState } from "react";

interface WhereAndWhenRound {
  id: number;
  image: string;
  locationQuestion: string;
  locationOptions: string[];
  correctLocation: string;
  dateQuestion: string;
  dateOptions: string[];
  correctDate: string;
  funFact?: string;
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

function shuffleRounds(rounds: WhereAndWhenRound[]) {
  return rounds.map((round) => ({
    ...round,
    locationOptions: shuffleArray(round.locationOptions),
    dateOptions: shuffleArray(round.dateOptions),
  }));
}

function GameProgress({
  currentRound,
  totalRounds,
  score,
}: {
  currentRound: number;
  totalRounds: number;
  score: number;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-400">
          Round {currentRound} of {totalRounds}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-white md:text-5xl">
          Where & When Was Piggy?
        </h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200">
        Score: <span className="text-white">{score}</span> / 10
      </div>
    </div>
  );
}

function PhotoFrame({ round }: { round: WhereAndWhenRound }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/50">
      {!imageFailed ? (
        <img
          src={round.image}
          alt={`Piggy memory round ${round.id}`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-red-950/50 via-slate-950 to-black p-8 text-center">
          <div className="text-6xl">🐾</div>
          <p className="mt-4 text-lg font-bold text-white">
            Piggy photo placeholder
          </p>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Add the real image later at {round.image}
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
    </div>
  );
}

function AnswerOption({
  value,
  selected,
  submitted,
  correctAnswer,
  onSelect,
}: {
  value: string;
  selected: boolean;
  submitted: boolean;
  correctAnswer: string;
  onSelect: () => void;
}) {
  const isCorrect = value === correctAnswer;
  const isWrongSelection = submitted && selected && !isCorrect;
  const isCorrectSelection = submitted && isCorrect;

  return (
    <button
      type="button"
      disabled={submitted}
      onClick={onSelect}
      className={[
        "rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
        submitted
          ? "cursor-default"
          : "hover:border-red-300/60 hover:bg-white/10",
        selected && !submitted
          ? "border-red-400 bg-red-500/20 text-white"
          : "border-white/10 bg-white/5 text-slate-200",
        isCorrectSelection && "border-emerald-400 bg-emerald-500/20 text-emerald-100",
        isWrongSelection && "border-red-500 bg-red-600/25 text-red-100",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {value}
    </button>
  );
}

function QuestionBlock({
  title,
  options,
  selected,
  submitted,
  correctAnswer,
  onSelect,
}: {
  title: string;
  options: string[];
  selected: string;
  submitted: boolean;
  correctAnswer: string;
  onSelect: (value: string) => void;
}) {
  return (
    <section>
      <h2 className="text-base font-bold text-white">{title}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <AnswerOption
            key={option}
            value={option}
            selected={selected === option}
            submitted={submitted}
            correctAnswer={correctAnswer}
            onSelect={() => onSelect(option)}
          />
        ))}
      </div>
    </section>
  );
}

function RoundResult({
  round,
  selectedLocation,
  selectedDate,
}: {
  round: WhereAndWhenRound;
  selectedLocation: string;
  selectedDate: string;
}) {
  const locationCorrect = selectedLocation === round.correctLocation;
  const dateCorrect = selectedDate === round.correctDate;

  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-5 animate-[fadeIn_0.22s_ease-out]">
      <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
        <p>
          Location:{" "}
          <span className={locationCorrect ? "text-emerald-300" : "text-red-300"}>
            {locationCorrect ? "Correct" : "Wrong"}
          </span>
        </p>
        <p>
          Date:{" "}
          <span className={dateCorrect ? "text-emerald-300" : "text-red-300"}>
            {dateCorrect ? "Correct" : "Wrong"}
          </span>
        </p>
        <p>
          Correct location:{" "}
          <span className="font-semibold text-white">{round.correctLocation}</span>
        </p>
        <p>
          Correct date:{" "}
          <span className="font-semibold text-white">{round.correctDate}</span>
        </p>
      </div>

      {round.funFact && (
        <p className="mt-4 rounded-2xl bg-red-950/30 p-4 text-sm text-red-100">
          🐾 {round.funFact}
        </p>
      )}
    </div>
  );
}

function getScoreMessage(score: number) {
  if (score === 10) return "Certified Piggy Historian 🏆";
  if (score >= 8) return "You know Porky suspiciously well 🐾";
  if (score >= 5) return "Pretty good, but Piggy expects more treats.";
  return "Piggy is disappointed... but still accepts snacks.";
}

function FinalScore({
  score,
  total,
  onPlayAgain,
}: {
  score: number;
  total: number;
  onPlayAgain: () => void;
}) {
  const percentage = Math.round((score / total) * 100);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-red-950/30 via-black to-black px-6 py-24 text-white">
      <div className="absolute left-10 top-24 h-80 w-80 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-16 bottom-16 h-72 w-72 rounded-full bg-red-700/10 blur-3xl" />

      <section className="relative mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/50 md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-red-400">
          Game Complete
        </p>
        <h1 className="mt-5 text-5xl font-black text-white md:text-7xl">
          {score}/{total}
        </h1>
        <p className="mt-3 text-xl font-bold text-red-200">{percentage}%</p>
        <p className="mt-6 text-2xl font-bold text-white">
          {getScoreMessage(score)}
        </p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-md bg-white px-6 py-3 font-semibold text-black transition hover:bg-slate-200"
          >
            Play Again
          </button>
          <Link
            href="/profile/piggy"
            className="rounded-md bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/15"
          >
            Back to Piggy Games
          </Link>
        </div>
      </section>
    </main>
  );
}

export function WhereAndWhenWasPiggyGame({
  rounds,
}: {
  rounds: WhereAndWhenRound[];
}) {
  const [gameRounds, setGameRounds] = useState(() => shuffleRounds(rounds));
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const round = gameRounds[currentRound];
  const totalScore = gameRounds.length * 2;
  const canSubmit = !!selectedLocation && !!selectedDate && !submitted;

  const resetRoundState = () => {
    setSelectedLocation("");
    setSelectedDate("");
    setSubmitted(false);
  };

  const submitAnswer = () => {
    if (!canSubmit) return;

    let roundScore = 0;
    if (selectedLocation === round.correctLocation) roundScore += 1;
    if (selectedDate === round.correctDate) roundScore += 1;

    setScore((currentScore) => currentScore + roundScore);
    setSubmitted(true);
  };

  const nextRound = () => {
    if (currentRound === gameRounds.length - 1) {
      setGameCompleted(true);
      return;
    }

    setCurrentRound((value) => value + 1);
    resetRoundState();
  };

  const playAgain = () => {
    setGameRounds(shuffleRounds(rounds));
    setCurrentRound(0);
    setScore(0);
    setGameCompleted(false);
    resetRoundState();
  };

  if (gameCompleted) {
    return <FinalScore score={score} total={totalScore} onPlayAgain={playAgain} />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-red-950/30 via-black to-black px-6 py-24 text-white">
      <div className="absolute left-6 top-20 h-72 w-72 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-10 bottom-16 h-96 w-96 rounded-full bg-red-700/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div className="absolute left-[8%] top-[18%] text-5xl">🐾</div>
        <div className="absolute right-[18%] top-[30%] text-4xl">🐾</div>
        <div className="absolute bottom-[12%] left-[35%] text-5xl">🐾</div>
      </div>

      <div className="relative mx-auto max-w-6xl">
        <Link
          href="/profile/piggy"
          className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Back to Piggy Games
        </Link>

        <div className="mt-8">
          <GameProgress
            currentRound={currentRound + 1}
            totalRounds={gameRounds.length}
            score={score}
          />
        </div>

        <section
          key={round.id}
          className="mt-8 grid gap-6 animate-[fadeIn_0.24s_ease-out] lg:grid-cols-[1fr_0.95fr]"
        >
          <PhotoFrame round={round} />

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur md:p-6">
            <div className="grid gap-6">
              <QuestionBlock
                title={round.locationQuestion}
                options={round.locationOptions}
                selected={selectedLocation}
                submitted={submitted}
                correctAnswer={round.correctLocation}
                onSelect={setSelectedLocation}
              />

              <QuestionBlock
                title={round.dateQuestion}
                options={round.dateOptions}
                selected={selectedDate}
                submitted={submitted}
                correctAnswer={round.correctDate}
                onSelect={setSelectedDate}
              />

              {submitted && (
                <RoundResult
                  round={round}
                  selectedLocation={selectedLocation}
                  selectedDate={selectedDate}
                />
              )}

              <div className="flex justify-end">
                {!submitted ? (
                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={submitAnswer}
                    className="rounded-md bg-white px-6 py-3 font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextRound}
                    className="rounded-md bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-500"
                  >
                    {currentRound === gameRounds.length - 1 ? "See Results" : "Next Round"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default WhereAndWhenWasPiggyGame;
