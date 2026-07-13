"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "cozy" | "normal" | "chaos";
type Phase = "preview" | "guess" | "result";

interface Spot {
  id: string;
  name: string;
  image: string;
}

interface Snack {
  id: string;
  name: string;
  image: string;
}

interface DifficultyConfig {
  label: string;
  previewSeconds: number;
  guessSeconds: number;
  lingeringHint: boolean;
  shuffleAfterPreview: boolean;
  multiplier: number;
}

interface HideItData {
  rounds: number;
  spots: Spot[];
  snacks: Snack[];
  difficulty: Record<Difficulty, DifficultyConfig>;
}

interface RoundData {
  snack: Snack;
  correctSpotId: string;
}

const BEST_KEY = "dauda-where-did-dauda-hide-it-best";
const THUMBNAIL = "/videos/dauda/games/hide-it/where-did-dauda-hide-it.png";
const DAUDA = {
  neutral: "/videos/dauda/games/hide-it/dauda-neutral.png",
  happy: "/videos/dauda/games/hide-it/dauda-happy.png",
  confused: "/videos/dauda/games/hide-it/dauda-confused.png",
};
const AUDIO = {
  hide: "/sounds/dauda/hide.mp3",
  correct: "/sounds/dauda/correct.mp3",
  wrong: "/sounds/dauda/wrong.mp3",
  complete: "/sounds/dauda/complete.mp3",
};

const SPOT_POSITIONS: Record<string, string> = {
  house: "md:col-start-1 md:row-start-1",
  tunnel: "md:col-start-3 md:row-start-1",
  "food-bowl": "md:col-start-1 md:row-start-3",
  bedding: "md:col-start-3 md:row-start-3",
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function getCorrectMessage() {
  const messages = [
    "Snack recovered!",
    "Dauda’s secret storage has been compromised.",
    "Excellent tiny-snack surveillance.",
    "You remembered better than Dauda did.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getWrongMessage() {
  const messages = [
    "Nothing here except bedding and disappointment.",
    "Dauda has successfully confused the investigation.",
    "Wrong tunnel. Very suspicious.",
    "The snack remains hidden from management.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getFinalMessage(correct: number) {
  if (correct === 8) {
    return {
      title: "Supreme Snack Detective 🏆",
      message: "No tunnel, bowl, or suspicious bedding pile can fool you.",
    };
  }
  if (correct >= 6) {
    return {
      title: "Certified Dauda Memory Expert 🐹",
      message: "Dauda may need to find a more secure hiding system.",
    };
  }
  if (correct >= 4) {
    return {
      title: "Assistant Snack Investigator",
      message: "You remembered most of the important tiny secrets.",
    };
  }
  if (correct >= 2) {
    return {
      title: "Part-Time Bedding Inspector",
      message: "Several snacks remain officially missing.",
    };
  }
  return {
    title: "Dauda Has Outsmarted You",
    message: "She forgot where the snacks were too, so everyone loses.",
  };
}

function getStreakBonus(streak: number) {
  if (streak >= 8) return 250;
  if (streak >= 5) return 100;
  if (streak >= 3) return 50;
  if (streak >= 2) return 25;
  return 0;
}

function SafeImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className: string;
  fallback: string;
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

export function WhereDidDaudaHideItGame({ data }: { data: HideItData }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [phase, setPhase] = useState<Phase>("preview");
  const [selectedSpotId, setSelectedSpotId] = useState("");
  const [spotOrder, setSpotOrder] = useState<Spot[]>(data.spots);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [remainingGuessTime, setRemainingGuessTime] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [message, setMessage] = useState("Remember this spot!");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timersRef = useRef<number[]>([]);

  const config = data.difficulty[difficulty];
  const round = rounds[currentRound];
  const correctSpot = round
    ? data.spots.find((spot) => spot.id === round.correctSpotId)
    : null;
  const selectedIsCorrect = selectedSpotId === round?.correctSpotId;
  const finalResult = getFinalMessage(correctCount);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  const playSound = (src: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(src);
    audio.volume = 0.3;
    audio.play().catch(() => undefined);
  };

  const generateRounds = () => {
    const result: RoundData[] = [];
    let previousSpot = "";
    let repeatCount = 0;

    for (let index = 0; index < data.rounds; index += 1) {
      const snack = data.snacks[Math.floor(Math.random() * data.snacks.length)];
      let spot = data.spots[Math.floor(Math.random() * data.spots.length)];
      if (spot.id === previousSpot && repeatCount >= 2) {
        const alternatives = data.spots.filter((item) => item.id !== previousSpot);
        spot = alternatives[Math.floor(Math.random() * alternatives.length)];
      }
      repeatCount = spot.id === previousSpot ? repeatCount + 1 : 1;
      previousSpot = spot.id;
      result.push({ snack, correctSpotId: spot.id });
    }

    return result;
  };

  const startPreview = (roundIndex: number, nextRounds = rounds) => {
    clearTimers();
    setCurrentRound(roundIndex);
    setSelectedSpotId("");
    setSpotOrder(data.spots);
    setPhase("preview");
    setRemainingGuessTime(config.guessSeconds);
    setMessage("Remember this spot!");
    playSound(AUDIO.hide);

    const previewTimer = window.setTimeout(() => {
      setPhase("guess");
      setMessage("Where did Dauda hide the snack?");
      if (config.shuffleAfterPreview) setSpotOrder(shuffle(data.spots));
    }, config.previewSeconds * 1000);
    timersRef.current.push(previewTimer);
  };

  const startGame = () => {
    const nextRounds = generateRounds();
    clearTimers();
    setGameStarted(true);
    setGameCompleted(false);
    setRounds(nextRounds);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    startPreview(0, nextRounds);
  };

  const submitGuess = (spotId: string) => {
    if (phase !== "guess" || selectedSpotId || !round) return;
    setSelectedSpotId(spotId);
    setPhase("result");

    if (spotId === round.correctSpotId) {
      const nextStreak = streak + 1;
      const gained = Math.round((100 + getStreakBonus(nextStreak)) * config.multiplier);
      setScore((value) => value + gained);
      setCorrectCount((value) => value + 1);
      setStreak(nextStreak);
      setBestStreak((value) => Math.max(value, nextStreak));
      setMessage(getCorrectMessage());
      playSound(AUDIO.correct);
    } else {
      setStreak(0);
      setMessage(getWrongMessage());
      playSound(AUDIO.wrong);
    }
  };

  const nextRound = () => {
    if (currentRound + 1 >= data.rounds) {
      setGameCompleted(true);
      setGameStarted(true);
      playSound(AUDIO.complete);
      setBestScore((current) => {
        const next = Math.max(current, score);
        window.localStorage.setItem(BEST_KEY, String(next));
        return next;
      });
      return;
    }
    startPreview(currentRound + 1);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(BEST_KEY);
    if (stored) setBestScore(Number(stored) || 0);
  }, []);

  useEffect(() => {
    if (!gameStarted || gameCompleted || phase !== "guess" || config.guessSeconds <= 0) return;
    setRemainingGuessTime(config.guessSeconds);
    const interval = window.setInterval(() => {
      setRemainingGuessTime((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          submitGuess("__timeout__");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [config.guessSeconds, gameCompleted, gameStarted, phase]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) clearTimers();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearTimers();
    };
  }, []);

  const daudaImage =
    phase === "result"
      ? selectedIsCorrect
        ? DAUDA.happy
        : DAUDA.confused
      : DAUDA.neutral;

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
            <button type="button" onClick={() => setSoundEnabled((value) => !value)} className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
              Sound: {soundEnabled ? "On" : "Muted"}
            </button>
            <button type="button" onClick={() => setReducedMotion((value) => !value)} className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
              Reduced Motion: {reducedMotion ? "On" : "Off"}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!gameStarted && (
            <motion.section key="start" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/50 backdrop-blur">
              <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="flex min-h-[420px] items-center justify-center bg-black/45 p-5">
                  <SafeImage src={THUMBNAIL} alt="Where Did Dauda Hide It thumbnail" className="h-full max-h-[25rem] w-full object-contain" fallback="🌻" />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">Dauda Studios Game</p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Where Did Dauda Hide It?</h1>
                  <p className="mt-4 text-lg font-semibold text-amber-100">Dauda hides snacks professionally. Remember the spot before she forgets it herself.</p>
                  <fieldset className="mt-8">
                    <legend className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-slate-400">Difficulty</legend>
                    <div className="flex flex-wrap gap-3">
                      {(Object.keys(data.difficulty) as Difficulty[]).map((key) => (
                        <button key={key} type="button" aria-pressed={difficulty === key} onClick={() => setDifficulty(key)} className={["rounded-md px-5 py-3 font-bold transition", difficulty === key ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/15"].join(" ")}>
                          {data.difficulty[key].label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Best Score</p>
                    <p className="mt-1 text-3xl font-black text-white">{bestScore}</p>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button type="button" onClick={startGame} className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200">Start Game</button>
                    <Link href="/profile/dauda" className="rounded-md bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15">Back to Dauda Games</Link>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {gameStarted && !gameCompleted && round && (
            <motion.section key="game" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="mt-8">
              <header className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Round" value={`${currentRound + 1} / ${data.rounds}`} />
                <StatCard label="Score" value={score} />
                <StatCard label="Streak" value={streak} />
                <StatCard label="Mode" value={config.label} />
                <StatCard label="Timer" value={config.guessSeconds > 0 && phase === "guess" ? `${remainingGuessTime}s` : "—"} />
                <StatCard label="Best" value={bestScore} />
              </header>

              <section className="mt-6 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(251,191,36,0.14),transparent_32%),linear-gradient(180deg,rgba(48,25,10,0.92),rgba(5,5,5,0.96))] p-5 shadow-2xl shadow-black/55">
                <div className="min-h-[3.25rem] rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-center text-sm font-black text-white">
                  {message}
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3 md:grid-rows-3">
                  {spotOrder.map((spot) => {
                    const isCorrect = spot.id === round.correctSpotId;
                    const isSelected = spot.id === selectedSpotId;
                    const showCorrect = phase === "preview" || phase === "result" || (config.lingeringHint && phase === "guess");
                    return (
                      <motion.button
                        key={spot.id}
                        type="button"
                        disabled={phase !== "guess" || !!selectedSpotId}
                        onClick={() => submitGuess(spot.id)}
                        whileHover={phase === "guess" ? { scale: 1.03 } : undefined}
                        animate={showCorrect && isCorrect && !reducedMotion ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                        transition={{ duration: 0.9, repeat: showCorrect && isCorrect && phase === "preview" ? Infinity : 0 }}
                        className={[
                          "min-h-44 rounded-3xl border p-4 text-center transition focus:outline-none focus:ring-4 focus:ring-amber-200 md:min-h-52",
                          SPOT_POSITIONS[spot.id] || "",
                          showCorrect && isCorrect ? "border-amber-200 bg-amber-300/15 shadow-lg shadow-amber-950/30" : "border-white/10 bg-black/35",
                          phase === "result" && isSelected && !isCorrect ? "border-red-400 bg-red-500/15" : "",
                          phase !== "guess" || selectedSpotId ? "cursor-default" : "hover:bg-white/10",
                        ].join(" ")}
                      >
                        <SafeImage src={spot.image} alt={spot.name} className="mx-auto h-24 w-24 object-contain" fallback={spot.id === "house" ? "⌂" : spot.id === "tunnel" ? "⌒" : spot.id === "food-bowl" ? "◡" : "▨"} />
                        <p className="mt-3 text-base font-black text-white">{spot.name}</p>
                        {phase === "result" && isCorrect && <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Correct spot</p>}
                        {phase === "result" && isSelected && !isCorrect && <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-red-200">Your pick</p>}
                      </motion.button>
                    );
                  })}

                  <div className="order-first flex min-h-48 flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/45 p-4 md:order-none md:col-start-2 md:row-start-2">
                    <SafeImage src={round.snack.image} alt={round.snack.name} className="h-16 w-16 object-contain" fallback="🌻" />
                    <p className="mt-2 text-sm font-bold text-amber-100">{round.snack.name}</p>
                    <motion.div
                      animate={phase === "preview" && correctSpot && !reducedMotion ? { x: [0, correctSpot.id === "house" || correctSpot.id === "food-bowl" ? -34 : 34, 0], y: [0, correctSpot.id === "house" || correctSpot.id === "tunnel" ? -24 : 24, 0] } : { x: 0, y: 0 }}
                      transition={{ duration: config.previewSeconds, ease: "easeInOut" }}
                      className="mt-3 h-24 w-24"
                    >
                      <SafeImage src={daudaImage} alt="Dauda reaction" className="h-full w-full object-contain" fallback="🐹" />
                    </motion.div>
                  </div>
                </div>
                {phase === "result" && (
                  <div className="mt-6 flex justify-center">
                    <button type="button" onClick={nextRound} className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200">
                      {currentRound + 1 >= data.rounds ? "See Results" : "Next Round"}
                    </button>
                  </div>
                )}
              </section>
            </motion.section>
          )}

          {gameCompleted && (
            <motion.section key="complete" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="mx-auto mt-10 max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">Final Results</p>
              <h1 className="mt-4 text-4xl font-black md:text-6xl">{finalResult.title}</h1>
              <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">{finalResult.message}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Correct" value={`${correctCount} / ${data.rounds}`} />
                <StatCard label="Final Score" value={score} />
                <StatCard label="Best Streak" value={bestStreak} />
                <StatCard label="Difficulty" value={config.label} />
                <StatCard label="Best Score" value={Math.max(bestScore, score)} />
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={startGame} className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200">Play Again</button>
                <Link href="/profile/dauda" className="rounded-md bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-500">Back to Dauda Games</Link>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default WhereDidDaudaHideItGame;
