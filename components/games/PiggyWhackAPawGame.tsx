"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "easy" | "normal" | "chaos";
type TargetType = "good" | "bonus" | "bad" | string;

interface WhackTarget {
  id: string;
  name: string;
  image: string;
  type: TargetType;
  points: number;
}

interface WhackData {
  duration: number;
  startingLives: number;
  spawnInterval: number;
  targets: WhackTarget[];
}

interface ActiveTarget {
  uniqueId: number;
  targetId: string;
  holeIndex: number;
  appearedAt: number;
  duration: number;
  isHit: boolean;
}

interface FloatingLabel {
  id: number;
  holeIndex: number;
  text: string;
  kind: "good" | "bad";
}

const BEST_SCORE_KEY = "piggy-whack-a-paw-best";
const AUDIO = {
  paw: "/sounds/piggy/paw-hit.mp3",
  bonus: "/sounds/piggy/bonus.mp3",
  wrong: "/sounds/piggy/wrong.mp3",
  gameOver: "/sounds/piggy/game-over.mp3",
};

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    label: string;
    spawnMs: number;
    visibleMs: number;
    maxTargets: number;
    badBoost: number;
    fakeShakeChance: number;
  }
> = {
  easy: {
    label: "Easy",
    spawnMs: 1000,
    visibleMs: 1250,
    maxTargets: 1,
    badBoost: 0.65,
    fakeShakeChance: 0,
  },
  normal: {
    label: "Normal",
    spawnMs: 820,
    visibleMs: 1050,
    maxTargets: 2,
    badBoost: 1,
    fakeShakeChance: 0.05,
  },
  chaos: {
    label: "Chaos",
    spawnMs: 600,
    visibleMs: 820,
    maxTargets: 3,
    badBoost: 1.35,
    fakeShakeChance: 0.16,
  },
};

const TARGET_WEIGHTS: Record<string, number> = {
  paw: 55,
  "piggy-face": 10,
  "golden-paw": 5,
  "plastic-bag": 8,
  vacuum: 7,
  cucumber: 7,
  dauda: 8,
};

function getComboMultiplier(combo: number) {
  if (combo >= 12) return 3;
  if (combo >= 8) return 2;
  if (combo >= 5) return 1.5;
  if (combo >= 3) return 1.25;
  return 1;
}

function getBadMessage(target: WhackTarget) {
  if (target.id === "plastic-bag") return "Plastic bag emergency.";
  if (target.id === "vacuum") return "Vacuum detected. Porky has evacuated.";
  if (target.id === "cucumber") return "Suspicious green object.";
  if (target.id === "dauda") return "Dauda is not a paw.";
  return "Porky rejects this target.";
}

function getResult(score: number, daudaHits: number) {
  if (daudaHits >= 2) {
    return {
      title: "Reminder: Dauda is a colleague, not a target.",
      message: "Porky has been redirected to a workplace conduct seminar.",
    };
  }
  if (score >= 650) {
    return {
      title: "Supreme Paw Whacker 🏆",
      message: "Porky’s paws never stood a chance.",
    };
  }
  if (score >= 360) {
    return {
      title: "Certified Paw Patrol Officer 🐾",
      message: "Fast hands, sharp eyes, acceptable snack awareness.",
    };
  }
  if (score >= 160) {
    return {
      title: "Part-Time Paw Catcher",
      message: "Piggy noticed several missed opportunities.",
    };
  }
  return {
    title: "Paw Privileges Suspended",
    message: "Please complete additional Porky training.",
  };
}

function SafeTargetImage({ target }: { target: WhackTarget }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    const fallback =
      target.id === "paw"
        ? "🐾"
        : target.id === "piggy-face"
          ? "🐱"
          : target.id === "golden-paw"
            ? "🌟"
            : target.id === "dauda"
              ? "🐹"
              : "!";
    return (
      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-red-950/60 via-black to-amber-950/40 text-4xl">
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={target.image}
      alt={target.name}
      className="h-full w-full object-contain"
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

export function PiggyWhackAPawGame({ data }: { data: WhackData }) {
  const tickRef = useRef<number | null>(null);
  const spawnRef = useRef<number | null>(null);
  const nextTargetIdRef = useRef(1);
  const nextLabelIdRef = useRef(1);
  const activeTargetsRef = useRef<ActiveTarget[]>([]);
  const lastTickRef = useRef(0);
  const badBurstRef = useRef({ count: 0, startedAt: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(data.startingLives);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [remainingTime, setRemainingTime] = useState(data.duration);
  const [activeTargets, setActiveTargets] = useState<ActiveTarget[]>([]);
  const [hitCount, setHitCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [badHitCount, setBadHitCount] = useState(0);
  const [daudaHits, setDaudaHits] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [message, setMessage] = useState("");
  const [floatingLabels, setFloatingLabels] = useState<FloatingLabel[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [fakeShakeHole, setFakeShakeHole] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];
  const result = getResult(score, daudaHits);
  const accuracy =
    hitCount + missCount === 0
      ? 0
      : Math.round((hitCount / (hitCount + missCount)) * 100);

  const targetsById = useMemo(
    () => Object.fromEntries(data.targets.map((target) => [target.id, target])),
    [data.targets]
  );

  const clearLoops = () => {
    if (tickRef.current) window.cancelAnimationFrame(tickRef.current);
    if (spawnRef.current) window.clearInterval(spawnRef.current);
    tickRef.current = null;
    spawnRef.current = null;
  };

  const playSound = (src: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(src);
    audio.volume = 0.35;
    audio.play().catch(() => undefined);
  };

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 1000);
  };

  const addFloatingLabel = (
    holeIndex: number,
    text: string,
    kind: "good" | "bad"
  ) => {
    const id = nextLabelIdRef.current;
    nextLabelIdRef.current += 1;
    setFloatingLabels((current) => [...current, { id, holeIndex, text, kind }]);
    window.setTimeout(() => {
      setFloatingLabels((current) => current.filter((label) => label.id !== id));
    }, 900);
  };

  const chooseTarget = () => {
    const weighted = data.targets.map((target) => {
      const base = TARGET_WEIGHTS[target.id] || 1;
      return {
        target,
        weight: target.type === "bad" ? base * config.badBoost : base,
      };
    });
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.target;
    }
    return weighted[0].target;
  };

  const spawnTargets = () => {
    if (paused || gameOver) return;
    const occupied = new Set(activeTargetsRef.current.map((target) => target.holeIndex));
    const openHoles = Array.from({ length: 9 }, (_, index) => index).filter(
      (index) => !occupied.has(index)
    );
    if (!openHoles.length) return;

    const availableSlots = Math.max(0, config.maxTargets - activeTargetsRef.current.length);
    const count = Math.max(
      1,
      Math.min(
        availableSlots,
        difficulty === "chaos" && Math.random() < 0.35 ? 2 : 1,
        openHoles.length
      )
    );
    const nextTargets: ActiveTarget[] = [];

    for (let index = 0; index < count; index += 1) {
      const holeIndex = openHoles.splice(
        Math.floor(Math.random() * openHoles.length),
        1
      )[0];
      const target = chooseTarget();
      nextTargets.push({
        uniqueId: nextTargetIdRef.current,
        targetId: target.id,
        holeIndex,
        appearedAt: performance.now(),
        duration: reducedMotion ? config.visibleMs * 1.25 : config.visibleMs,
        isHit: false,
      });
      nextTargetIdRef.current += 1;
    }

    if (difficulty === "chaos" && Math.random() < config.fakeShakeChance) {
      setFakeShakeHole(Math.floor(Math.random() * 9));
      window.setTimeout(() => setFakeShakeHole(null), 450);
    }

    activeTargetsRef.current = [...activeTargetsRef.current, ...nextTargets];
    setActiveTargets(activeTargetsRef.current);
  };

  const finishGame = () => {
    clearLoops();
    setGameOver(true);
    setPaused(false);
    playSound(AUDIO.gameOver);
    setBestScore((current) => {
      const next = Math.max(current, score);
      window.localStorage.setItem(BEST_SCORE_KEY, String(next));
      return next;
    });
  };

  const startGame = () => {
    clearLoops();
    activeTargetsRef.current = [];
    nextTargetIdRef.current = 1;
    lastTickRef.current = 0;
    badBurstRef.current = { count: 0, startedAt: 0 };
    setGameStarted(true);
    setGameOver(false);
    setPaused(false);
    setScore(0);
    setLives(data.startingLives);
    setCombo(0);
    setBestCombo(0);
    setRemainingTime(data.duration);
    setActiveTargets([]);
    setHitCount(0);
    setMissCount(0);
    setBadHitCount(0);
    setDaudaHits(0);
    setMessage("");
    setFloatingLabels([]);
    setShakeScreen(false);
  };

  const handleTargetClick = (activeTarget: ActiveTarget) => {
    if (paused || gameOver) return;
    const target = targetsById[activeTarget.targetId];
    if (!target) return;

    activeTargetsRef.current = activeTargetsRef.current.filter(
      (item) => item.uniqueId !== activeTarget.uniqueId
    );
    setActiveTargets(activeTargetsRef.current);

    if (target.type === "good" || target.type === "bonus") {
      const comboGain = target.id === "piggy-face" ? 2 : 1;
      const nextCombo = combo + comboGain;
      const multiplier = getComboMultiplier(nextCombo);
      const points = Math.round(target.points * multiplier);
      setScore((value) => value + points);
      setCombo(nextCombo);
      setBestCombo((value) => Math.max(value, nextCombo));
      setHitCount((value) => value + 1);
      addFloatingLabel(activeTarget.holeIndex, `+${points}`, "good");
      if (target.id === "paw") showMessage("Paw secured! 🐾");
      if (target.id === "piggy-face") showMessage("Rare full Porky appearance!");
      if (target.id === "golden-paw") {
        setRemainingTime((value) => Math.min(data.duration, value + 2));
        showMessage("Golden Porky bonus!");
      }
      playSound(target.type === "bonus" ? AUDIO.bonus : AUDIO.paw);
      return;
    }

    const now = performance.now();
    const sameWindow = now - badBurstRef.current.startedAt < 5000;
    const burstCount = sameWindow ? badBurstRef.current.count + 1 : 1;
    const losesLife = target.id === "vacuum" || target.id === "dauda" || burstCount >= 3;
    badBurstRef.current = losesLife
      ? { count: 0, startedAt: now }
      : { count: burstCount, startedAt: sameWindow ? badBurstRef.current.startedAt : now };

    setScore((value) => Math.max(0, value + target.points));
    setCombo(0);
    setBadHitCount((value) => value + 1);
    if (target.id === "dauda") setDaudaHits((value) => value + 1);
    if (losesLife) {
      setLives((value) => Math.max(0, value - 1));
    }
    addFloatingLabel(activeTarget.holeIndex, String(target.points), "bad");
    showMessage(getBadMessage(target));
    setShakeScreen(true);
    window.setTimeout(() => setShakeScreen(false), 360);
    playSound(AUDIO.wrong);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(BEST_SCORE_KEY);
    if (stored) setBestScore(Number(stored) || 0);
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver || paused) return;

    const tick = (time: number) => {
      if (!lastTickRef.current) lastTickRef.current = time;
      const delta = Math.min(0.1, (time - lastTickRef.current) / 1000);
      lastTickRef.current = time;

      setRemainingTime((value) => Math.max(0, value - delta));

      const now = performance.now();
      const expired: ActiveTarget[] = [];
      activeTargetsRef.current = activeTargetsRef.current.filter((target) => {
        const keep = now - target.appearedAt < target.duration;
        if (!keep) expired.push(target);
        return keep;
      });

      if (expired.length) {
        expired.forEach((target) => {
          const dataTarget = targetsById[target.targetId];
          if (dataTarget?.id === "paw") {
            setCombo(0);
            setMissCount((value) => value + 1);
          }
        });
        setActiveTargets(activeTargetsRef.current);
      }

      tickRef.current = requestAnimationFrame(tick);
    };

    spawnRef.current = window.setInterval(spawnTargets, config.spawnMs);
    tickRef.current = requestAnimationFrame(tick);

    return clearLoops;
  }, [config.spawnMs, gameOver, gameStarted, paused, targetsById]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    if (remainingTime <= 0 || lives <= 0) {
      finishGame();
    }
  }, [gameOver, gameStarted, lives, remainingTime]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearLoops();
    };
  }, []);

  const activeByHole = useMemo(() => {
    return Object.fromEntries(activeTargets.map((target) => [target.holeIndex, target]));
  }, [activeTargets]);

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/profile/piggy"
            className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Back to Piggy Games
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
                <div className="flex min-h-[420px] items-center justify-center bg-black/40 p-4">
                  <SafeTargetImage
                    target={{
                      id: "paw",
                      name: "Piggy Whack-a-Paw thumbnail",
                      image: "/videos/piggy/games/whack-a-paw/whack-a-paw.png",
                      type: "good",
                      points: 0,
                    }}
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                    Piggy Studios Game
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                    Piggy Whack-a-Paw
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-red-100">
                    Porky’s paws are everywhere. Tap the paws, avoid the chaos.
                  </p>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                    Tap Porky’s paws when they pop up, avoid the suspicious
                    objects, and survive the fastest household paw attack.
                  </p>

                  <fieldset className="mt-8">
                    <legend className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
                      Difficulty
                    </legend>
                    <div className="flex flex-wrap gap-3">
                      {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => (
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
                          {DIFFICULTY_CONFIG[key].label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
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

          {gameStarted && (
            <motion.section
              key="game"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="mt-8"
            >
              <header className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Score" value={score} />
                <StatCard label="Best" value={bestScore} />
                <StatCard label="Time" value={Math.ceil(remainingTime)} />
                <StatCard label="Lives" value={"❤️".repeat(lives) || "0"} />
                <StatCard
                  label="Combo"
                  value={combo ? `${combo} / x${getComboMultiplier(combo)}` : "0"}
                />
                <StatCard label="Mode" value={config.label} />
              </header>

              <motion.div
                animate={shakeScreen ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
                className="relative mx-auto mt-6 max-w-4xl rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_10%,rgba(245,158,11,0.18),transparent_32%),linear-gradient(180deg,rgba(92,38,20,0.9),rgba(28,13,9,0.95))] p-4 shadow-2xl shadow-black/55 md:p-6"
              >
                <div className="grid grid-cols-3 gap-3 md:gap-5">
                  {Array.from({ length: 9 }, (_, holeIndex) => {
                    const activeTarget = activeByHole[holeIndex];
                    const target = activeTarget
                      ? targetsById[activeTarget.targetId]
                      : null;
                    const label = floatingLabels.find(
                      (item) => item.holeIndex === holeIndex
                    );
                    const fakeShake = fakeShakeHole === holeIndex;

                    return (
                      <div
                        key={holeIndex}
                        className={[
                          "relative aspect-square overflow-hidden rounded-full border border-black/40 bg-[radial-gradient(circle_at_50%_72%,rgba(0,0,0,0.95),rgba(45,22,12,0.9)_48%,rgba(122,74,32,0.7)_52%,rgba(53,26,14,0.9)_72%)] shadow-inner shadow-black",
                          fakeShake ? "animate-pulse" : "",
                        ].join(" ")}
                      >
                        <AnimatePresence>
                          {activeTarget && target && (
                            <motion.button
                              key={activeTarget.uniqueId}
                              type="button"
                              initial={{ y: "70%", opacity: 0 }}
                              animate={{ y: "8%", opacity: 1 }}
                              exit={{ y: "80%", opacity: 0 }}
                              transition={{
                                type: reducedMotion ? "tween" : "spring",
                                stiffness: 260,
                                damping: 18,
                                duration: reducedMotion ? 0.12 : undefined,
                              }}
                              onClick={() => handleTargetClick(activeTarget)}
                              className="absolute left-[17%] top-[10%] h-[68%] w-[66%] rounded-full focus:outline-none focus:ring-4 focus:ring-amber-200"
                              aria-label={`${target.name}, ${target.type === "bad" ? "avoid this target" : "hit this target"}`}
                            >
                              <SafeTargetImage target={target} />
                              <span className="sr-only">
                                {target.type === "bad"
                                  ? "Wrong target"
                                  : "Good target"}
                              </span>
                            </motion.button>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {label && (
                            <motion.div
                              key={label.id}
                              initial={{ opacity: 0, scale: 0.8, y: 8 }}
                              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 1], y: -36 }}
                              className={[
                                "pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 rounded-full px-3 py-1 text-sm font-black shadow-2xl",
                                label.kind === "good"
                                  ? "bg-emerald-400 text-black"
                                  : "bg-red-600 text-white",
                              ].join(" ")}
                            >
                              {label.text}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-5 py-3 text-sm font-black text-white shadow-2xl"
                    >
                      {message}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="mt-4 flex flex-wrap justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={startGame}
                    className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                  >
                    Restart
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaused((value) => !value)}
                    disabled={gameOver}
                    className="rounded-md bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15 disabled:opacity-40"
                  >
                    {paused ? "Resume" : "Pause"}
                  </button>
                </div>
              </div>

              {(paused || gameOver) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm">
                  <div className="max-w-3xl rounded-3xl border border-white/10 bg-zinc-950/95 p-8 text-center shadow-2xl shadow-black">
                    {gameOver ? (
                      <>
                        <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                          Final Score
                        </p>
                        <h2 className="mt-4 text-5xl font-black">{score}</h2>
                        <h3 className="mt-6 text-2xl font-black text-white">
                          {result.title}
                        </h3>
                        <p className="mx-auto mt-3 max-w-xl text-slate-300">
                          {result.message}
                        </p>
                        <div className="mt-7 grid gap-3 sm:grid-cols-3">
                          <StatCard label="Best Combo" value={bestCombo} />
                          <StatCard label="Good Hits" value={hitCount} />
                          <StatCard label="Bad Hits" value={badHitCount} />
                          <StatCard label="Accuracy" value={`${accuracy}%`} />
                          <StatCard label="Difficulty" value={config.label} />
                          <StatCard label="Best Score" value={Math.max(bestScore, score)} />
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
                            href="/profile/piggy"
                            className="rounded-md bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-500"
                          >
                            Back to Piggy Games
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="text-4xl font-black">Paused</h2>
                        <p className="mt-3 text-slate-300">
                          Porky is temporarily hiding the paws.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            lastTickRef.current = 0;
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

export default PiggyWhackAPawGame;
