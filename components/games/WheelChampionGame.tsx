"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "cozy" | "sprint" | "chaos";

interface DisplayState {
  timeRemaining: number;
  pressCount: number;
  currentSpeed: number;
  maxSpeed: number;
  distance: number;
  combo: number;
  bestCombo: number;
  energy: number;
  boostActive: boolean;
}

const BEST_KEY = "dauda-wheel-champion-best";
const ASSETS = {
  thumbnail: "/videos/dauda/games/wheel-champion/wheel-champion.png",
  running: "/videos/dauda/games/wheel-champion/dauda-running.png",
  idle: "/videos/dauda/games/wheel-champion/dauda-idle.png",
  wheel: "/videos/dauda/games/wheel-champion/wheel.png",
};
const AUDIO = {
  wheel: "/sounds/dauda/wheel.mp3",
  tap: "/sounds/dauda/tap.mp3",
  boost: "/sounds/dauda/boost.mp3",
  finish: "/sounds/dauda/finish.mp3",
};

const DIFFICULTY: Record<
  Difficulty,
  {
    label: string;
    duration: number;
    speedGain: number;
    decay: number;
    comboWindow: number;
    maxSpeed: number;
    scoreMultiplier: number;
  }
> = {
  cozy: {
    label: "Cozy Run",
    duration: 25,
    speedGain: 7.5,
    decay: 0.82,
    comboWindow: 720,
    maxSpeed: 150,
    scoreMultiplier: 0.9,
  },
  sprint: {
    label: "Sprint",
    duration: 20,
    speedGain: 8.5,
    decay: 1.15,
    comboWindow: 560,
    maxSpeed: 175,
    scoreMultiplier: 1,
  },
  chaos: {
    label: "Tiny Chaos",
    duration: 15,
    speedGain: 10,
    decay: 1.55,
    comboWindow: 430,
    maxSpeed: 205,
    scoreMultiplier: 1.25,
  },
};

const INITIAL_DISPLAY: DisplayState = {
  timeRemaining: 20,
  pressCount: 0,
  currentSpeed: 0,
  maxSpeed: 0,
  distance: 0,
  combo: 0,
  bestCombo: 0,
  energy: 0,
  boostActive: false,
};

function getComboMultiplier(combo: number) {
  if (combo >= 35) return 3;
  if (combo >= 20) return 2;
  if (combo >= 10) return 1.5;
  if (combo >= 5) return 1.25;
  return 1;
}

function getRank(distance: number) {
  if (distance >= 950) {
    return {
      title: "Tiny Speed Legend 🏆",
      message: "Dauda has officially outrun all reasonable expectations.",
    };
  }
  if (distance >= 650) {
    return {
      title: "Wheel Champion 🐹",
      message: "Small hamster. Serious athletic career.",
    };
  }
  if (distance >= 360) {
    return {
      title: "Certified Wheel Enthusiast",
      message: "Dauda gave it everything, then immediately requested snacks.",
    };
  }
  if (distance >= 130) {
    return {
      title: "Professional Warm-Up Artist",
      message: "The wheel moved. Technically.",
    };
  }
  return {
    title: "Nap Mode Activated",
    message: "Dauda has chosen rest over competition.",
  };
}

function getFeedback(speed: number) {
  if (speed >= 130) {
    return Math.random() > 0.5
      ? "DAUDA HAS BECOME SPEED."
      : "Tiny athlete. Massive commitment.";
  }
  if (speed >= 65) {
    return Math.random() > 0.5
      ? "The wheel is warming up."
      : "Seed-powered acceleration detected.";
  }
  return Math.random() > 0.5
    ? "Dauda is considering a nap."
    : "Tiny legs require motivation.";
}

function formatDistance(distance: number) {
  return `${Math.max(0, distance).toFixed(1)} m`;
}

function AssetImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <>{fallback}</>;
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

export function WheelChampionGame() {
  const frameRef = useRef<number | null>(null);
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const lastFrameRef = useRef(0);
  const lastDisplayRef = useRef(0);
  const startedAtRef = useRef(0);
  const speedRef = useRef(0);
  const maxSpeedRef = useRef(0);
  const distanceRef = useRef(0);
  const pressCountRef = useRef(0);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const lastPressRef = useRef(0);
  const energyRef = useRef(0);
  const boostUntilRef = useRef(0);
  const rotationRef = useRef(0);
  const finishedRef = useRef(false);
  const pressedKeysRef = useRef(new Set<string>());

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("sprint");
  const [display, setDisplay] = useState<DisplayState>(INITIAL_DISPLAY);
  const [bestDistance, setBestDistance] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [feedback, setFeedback] = useState("Tiny legs are warming up.");
  const [particles, setParticles] = useState<{ id: number; kind: "seed" | "boost" }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const particleIdRef = useRef(1);

  const config = DIFFICULTY[difficulty];
  const finalScore = useMemo(() => {
    const comboBonus = getComboMultiplier(display.bestCombo);
    return Math.round(
      (display.distance * 10 +
        display.pressCount * 4 +
        display.maxSpeed * 2 +
        comboBonus * 100) *
        config.scoreMultiplier
    );
  }, [config.scoreMultiplier, display.bestCombo, display.distance, display.maxSpeed, display.pressCount]);
  const rank = getRank(display.distance);

  const playSound = (src: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(src);
    audio.volume = 0.28;
    audio.play().catch(() => undefined);
  };

  const clearLoop = () => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };

  const syncDisplay = (timeRemaining: number) => {
    setDisplay({
      timeRemaining,
      pressCount: pressCountRef.current,
      currentSpeed: speedRef.current,
      maxSpeed: maxSpeedRef.current,
      distance: distanceRef.current,
      combo: comboRef.current,
      bestCombo: bestComboRef.current,
      energy: energyRef.current,
      boostActive: performance.now() < boostUntilRef.current,
    });
  };

  const finishGame = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearLoop();
    setGameOver(true);
    setPaused(false);
    playSound(AUDIO.finish);
    const score = Math.round(
      (distanceRef.current * 10 +
        pressCountRef.current * 4 +
        maxSpeedRef.current * 2 +
        getComboMultiplier(bestComboRef.current) * 100) *
        config.scoreMultiplier
    );
    const result = {
      distance: Number(distanceRef.current.toFixed(2)),
      score,
    };
    setBestDistance((current) => Math.max(current, result.distance));
    setBestScore((current) => Math.max(current, result.score));
    window.localStorage.setItem(
      BEST_KEY,
      JSON.stringify({
        distance: Math.max(bestDistance, result.distance),
        score: Math.max(bestScore, result.score),
      })
    );
  };

  const tick = (time: number) => {
    if (!gameStarted || gameOver || paused || finishedRef.current) return;
    if (!lastFrameRef.current) lastFrameRef.current = time;

    const delta = Math.min(0.05, (time - lastFrameRef.current) / 1000);
    lastFrameRef.current = time;
    const elapsed = (time - startedAtRef.current) / 1000;
    const timeRemaining = Math.max(0, config.duration - elapsed);
    const boostActive = time < boostUntilRef.current;

    speedRef.current = Math.max(0, speedRef.current - config.decay * 34 * delta);
    energyRef.current = Math.max(0, energyRef.current - (boostActive ? 8 : 19) * delta);

    if (time - lastPressRef.current > config.comboWindow) {
      comboRef.current = 0;
    }

    const distanceMultiplier = boostActive ? 1.75 : 1;
    distanceRef.current += speedRef.current * delta * 0.52 * distanceMultiplier;
    rotationRef.current += speedRef.current * delta * (reducedMotion ? 0.65 : 2.2);

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
      wheelRef.current.style.boxShadow = boostActive
        ? "0 0 44px rgba(250,204,21,0.55), inset 0 0 34px rgba(250,204,21,0.22)"
        : "inset 0 0 28px rgba(251,146,60,0.18)";
    }

    if (time - lastDisplayRef.current > 90) {
      lastDisplayRef.current = time;
      syncDisplay(timeRemaining);
    }

    if (timeRemaining <= 0) {
      syncDisplay(0);
      finishGame();
      return;
    }

    frameRef.current = requestAnimationFrame(tick);
  };

  const startGame = () => {
    clearLoop();
    finishedRef.current = false;
    speedRef.current = 0;
    maxSpeedRef.current = 0;
    distanceRef.current = 0;
    pressCountRef.current = 0;
    comboRef.current = 0;
    bestComboRef.current = 0;
    lastPressRef.current = 0;
    energyRef.current = 0;
    boostUntilRef.current = 0;
    rotationRef.current = 0;
    lastFrameRef.current = 0;
    lastDisplayRef.current = 0;
    startedAtRef.current = performance.now();
    pressedKeysRef.current.clear();
    setGameStarted(true);
    setGameOver(false);
    setPaused(false);
    setFeedback("Tiny legs are warming up.");
    setParticles([]);
    setDisplay({
      ...INITIAL_DISPLAY,
      timeRemaining: config.duration,
    });
    frameRef.current = requestAnimationFrame(tick);
  };

  const registerPress = () => {
    if (!gameStarted || gameOver || paused || finishedRef.current) return;
    const now = performance.now();
    const withinCombo = now - lastPressRef.current <= config.comboWindow;
    comboRef.current = withinCombo ? comboRef.current + 1 : 1;
    bestComboRef.current = Math.max(bestComboRef.current, comboRef.current);
    lastPressRef.current = now;

    const multiplier = getComboMultiplier(comboRef.current);
    speedRef.current = Math.min(
      config.maxSpeed,
      speedRef.current + config.speedGain * multiplier
    );
    maxSpeedRef.current = Math.max(maxSpeedRef.current, speedRef.current);
    pressCountRef.current += 1;
    distanceRef.current += 0.18 * multiplier * config.scoreMultiplier;
    energyRef.current = Math.min(100, energyRef.current + 8.5);

    if (energyRef.current >= 100 && now > boostUntilRef.current) {
      boostUntilRef.current = now + 2600;
      energyRef.current = 70;
      setFeedback("SEED BOOST ACTIVATED!");
      playSound(AUDIO.boost);
      addParticle("boost");
    } else if (pressCountRef.current % 9 === 0) {
      setFeedback(getFeedback(speedRef.current));
    }

    addParticle("seed");
    playSound(AUDIO.tap);
    syncDisplay(Math.max(0, config.duration - (now - startedAtRef.current) / 1000));
  };

  const addParticle = (kind: "seed" | "boost") => {
    const id = particleIdRef.current;
    particleIdRef.current += 1;
    setParticles((current) => [...current.slice(-12), { id, kind }]);
    window.setTimeout(() => {
      setParticles((current) => current.filter((particle) => particle.id !== id));
    }, 950);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(BEST_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      setBestDistance(Number(parsed.distance) || 0);
      setBestScore(Number(parsed.score) || 0);
    } catch {
      setBestDistance(0);
      setBestScore(0);
    }
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver || paused) return;
    frameRef.current = requestAnimationFrame(tick);
    return clearLoop;
  }, [gameOver, gameStarted, paused, difficulty, reducedMotion]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== "Enter") return;
      event.preventDefault();
      if (event.repeat || pressedKeysRef.current.has(event.code || event.key)) return;
      pressedKeysRef.current.add(event.code || event.key);
      registerPress();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeysRef.current.delete(event.code || event.key);
    };

    const handleVisibility = () => {
      if (document.hidden && gameStarted && !gameOver) setPaused(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearLoop();
    };
  }, [gameOver, gameStarted, paused, difficulty]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-950/25 via-black to-black px-5 py-20 text-white md:px-8">
      <div className="absolute left-[-10rem] top-10 h-96 w-96 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-[-8rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-400/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
        <div className="absolute left-[10%] top-[20%] text-4xl">🌻</div>
        <div className="absolute right-[16%] top-[18%] text-3xl">⌒</div>
        <div className="absolute bottom-[14%] left-[45%] text-4xl">🐾</div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/profile/dauda"
            className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Back to Dauda Games
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={soundEnabled}
              onClick={() => setSoundEnabled((value) => !value)}
              className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Sound: {soundEnabled ? "On" : "Muted"}
            </button>
            <button
              type="button"
              aria-pressed={reducedMotion}
              onClick={() => setReducedMotion((value) => !value)}
              className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Reduced Motion: {reducedMotion ? "On" : "Off"}
            </button>
          </div>
        </div>

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
                <div className="flex min-h-[420px] items-center justify-center bg-black/45 p-5">
                  <AssetImage
                    src={ASSETS.thumbnail}
                    alt="Wheel Champion thumbnail"
                    className="h-full max-h-[25rem] w-full object-contain"
                    fallback={
                      <div className="flex h-72 w-full items-center justify-center rounded-3xl border border-amber-300/20 bg-[radial-gradient(circle,rgba(251,191,36,0.16),rgba(0,0,0,0.8))] text-7xl">
                        🐹
                      </div>
                    }
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">
                    Dauda Studios Game
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                    Wheel Champion
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-amber-100">
                    Dauda has tiny legs, huge ambition, and exactly 20 seconds
                    to prove it.
                  </p>

                  <fieldset className="mt-8">
                    <legend className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
                      Difficulty
                    </legend>
                    <div className="flex flex-wrap gap-3">
                      {(Object.keys(DIFFICULTY) as Difficulty[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={difficulty === key}
                          onClick={() => setDifficulty(key)}
                          className={[
                            "rounded-md px-5 py-3 font-bold transition",
                            difficulty === key
                              ? "bg-white text-black"
                              : "bg-white/10 text-white hover:bg-white/15",
                          ].join(" ")}
                        >
                          {DIFFICULTY[key].label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <StatCard label="Best Distance" value={formatDistance(bestDistance)} />
                    <StatCard label="Best Score" value={bestScore} />
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={startGame}
                      className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                    >
                      Start Running
                    </button>
                    <Link
                      href="/profile/dauda"
                      className="rounded-md bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15"
                    >
                      Back to Dauda Games
                    </Link>
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
              <header className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Time" value={`${display.timeRemaining.toFixed(1)}s`} />
                <StatCard label="Speed" value={display.currentSpeed.toFixed(0)} />
                <StatCard label="Distance" value={formatDistance(display.distance)} />
                <StatCard label="Presses" value={display.pressCount} />
                <StatCard label="Combo" value={`${display.combo} / x${getComboMultiplier(display.combo)}`} />
                <StatCard label="Best" value={formatDistance(bestDistance)} />
              </header>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <section className="relative min-h-[33rem] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_28%,rgba(251,191,36,0.18),transparent_35%),linear-gradient(180deg,rgba(44,22,8,0.92),rgba(5,5,5,0.96))] p-6 shadow-2xl shadow-black/55">
                  <AnimatePresence>
                    {particles.map((particle) => (
                      <motion.div
                        key={particle.id}
                        initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: particle.kind === "boost" ? [0.7, 1.8, 1] : [0.5, 1.2, 0.8],
                          x: Math.random() * 180 - 90,
                          y: -90 - Math.random() * 80,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.9 }}
                        className="pointer-events-none absolute left-1/2 top-1/2 z-20 text-3xl"
                      >
                        {particle.kind === "boost" ? "🌟" : "🌻"}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-black/55 px-4 py-2 text-sm font-black text-amber-100">
                    {feedback}
                  </div>

                  <div className="flex h-full min-h-[29rem] items-center justify-center">
                    <div className="relative h-[20rem] w-[20rem] max-w-full md:h-[28rem] md:w-[28rem]">
                      <div
                        ref={wheelRef}
                        className="absolute inset-3 rounded-full border-[18px] border-amber-200/75 bg-[radial-gradient(circle,transparent_48%,rgba(251,191,36,0.18)_49%,transparent_52%)] transition-shadow"
                      >
                        <AssetImage
                          src={ASSETS.wheel}
                          alt="Hamster wheel"
                          className="h-full w-full object-contain"
                          fallback={
                            <div className="absolute inset-7 rounded-full border-4 border-dashed border-amber-100/35">
                              <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-amber-100/20" />
                              <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-amber-100/20" />
                            </div>
                          }
                        />
                      </div>

                      <motion.div
                        animate={
                          reducedMotion
                            ? { y: 0 }
                            : { y: display.currentSpeed > 18 ? [0, -8, 0] : 0 }
                        }
                        transition={{ duration: 0.28, repeat: Infinity }}
                        className="absolute bottom-[21%] left-1/2 z-10 h-28 w-32 -translate-x-1/2 md:h-36 md:w-40"
                      >
                        <AssetImage
                          src={display.currentSpeed > 8 ? ASSETS.running : ASSETS.idle}
                          alt="Dauda running"
                          className="h-full w-full object-contain drop-shadow-2xl"
                          fallback={
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-amber-100 via-orange-200 to-amber-700 text-6xl shadow-2xl shadow-amber-950/40">
                              🐹
                            </div>
                          }
                        />
                      </motion.div>

                      <div className="absolute bottom-6 left-1/2 h-4 w-[68%] -translate-x-1/2 rounded-full bg-black/40">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-200" style={{ width: `${display.energy}%` }} />
                      </div>
                    </div>
                  </div>
                </section>

                <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/45 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">
                    Run Controls
                  </p>
                  <h2 className="mt-3 text-3xl font-black">Make Dauda Run</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Press Space, Enter, or tap the button. Holding the key down
                    will not count extra presses.
                  </p>

                  <button
                    type="button"
                    onClick={registerPress}
                    disabled={paused || gameOver}
                    className="mt-7 min-h-28 w-full touch-manipulation rounded-3xl bg-white px-6 py-5 text-3xl font-black text-black shadow-2xl shadow-amber-950/30 transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    RUN
                  </button>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-4">
                    <div className="flex items-center justify-between text-sm font-bold text-slate-300">
                      <span>Energy</span>
                      <span>{Math.round(display.energy)}%</span>
                    </div>
                    <div className="mt-3 h-4 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-300 to-yellow-100"
                        style={{ width: `${display.energy}%` }}
                      />
                    </div>
                    {display.boostActive && (
                      <p className="mt-3 text-sm font-black uppercase tracking-[0.2em] text-yellow-200">
                        Seed Boost Active
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!gameOver) {
                          setPaused((value) => {
                            if (value) {
                              const now = performance.now();
                              startedAtRef.current += now - lastFrameRef.current;
                              lastFrameRef.current = 0;
                            }
                            return !value;
                          });
                        }
                      }}
                      disabled={gameOver}
                      className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15 disabled:opacity-40"
                    >
                      {paused ? "Resume" : "Pause"}
                    </button>
                    <button
                      type="button"
                      onClick={startGame}
                      className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                    >
                      Restart
                    </button>
                  </div>
                </aside>
              </div>

              {(paused || gameOver) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm">
                  <div className="max-w-4xl rounded-3xl border border-white/10 bg-zinc-950/95 p-8 text-center shadow-2xl shadow-black">
                    {gameOver ? (
                      <>
                        <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">
                          Final Distance
                        </p>
                        <h2 className="mt-4 text-5xl font-black">
                          {formatDistance(display.distance)}
                        </h2>
                        <h3 className="mt-6 text-2xl font-black text-white">
                          {rank.title}
                        </h3>
                        <p className="mx-auto mt-3 max-w-xl text-slate-300">
                          {rank.message}
                        </p>
                        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <StatCard label="Presses" value={display.pressCount} />
                          <StatCard label="Max Speed" value={display.maxSpeed.toFixed(0)} />
                          <StatCard label="Best Combo" value={display.bestCombo} />
                          <StatCard label="Difficulty" value={config.label} />
                          <StatCard label="Score" value={finalScore} />
                          <StatCard label="Best Distance" value={formatDistance(Math.max(bestDistance, display.distance))} />
                          <StatCard label="Best Score" value={Math.max(bestScore, finalScore)} />
                          <StatCard label="Rank" value={rank.title.replace(/ .*/, "")} />
                        </div>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                          <button
                            type="button"
                            onClick={startGame}
                            className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                          >
                            Play Again
                          </button>
                          <Link
                            href="/profile/dauda"
                            className="rounded-md bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-500"
                          >
                            Back to Dauda Games
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="text-4xl font-black">Paused</h2>
                        <p className="mt-3 text-slate-300">
                          Dauda is conserving tiny athletic power.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const now = performance.now();
                            startedAtRef.current += now - lastFrameRef.current;
                            lastFrameRef.current = 0;
                            setPaused(false);
                          }}
                          className="mt-7 rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                        >
                          Resume
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default WheelChampionGame;
