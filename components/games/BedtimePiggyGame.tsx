"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

interface BedtimeData {
  thumbnail: string;
  photos: {
    platformNap: string;
    bedNap: string;
    humanNap: string;
    yawning: string;
  };
  audio: {
    purr: string;
    yawn: string;
    sleep: string;
  };
}

interface Choice {
  label: string;
  correct: boolean;
  reaction: string;
}

const BED_CHOICES: Choice[] = [
  {
    label: "Cold floor",
    correct: false,
    reaction: "Porky has filed a formal complaint with housekeeping.",
  },
  {
    label: "Cardboard box",
    correct: false,
    reaction: "Tempting, but tonight requires premium softness.",
  },
  {
    label: "Soft fluffy bed",
    correct: true,
    reaction: "Porky accepts this premium sleeping arrangement.",
  },
];

const BLANKET_CHOICES: Choice[] = [
  {
    label: "Tiny napkin",
    correct: false,
    reaction: "This blanket is insulting and possibly decorative.",
  },
  {
    label: "Suspicious plastic cover",
    correct: false,
    reaction: "Absolutely not. The suspicious bag has entered the bedtime area.",
  },
  {
    label: "Soft cozy blanket",
    correct: true,
    reaction: "Blanket quality approved. Porky may continue judging from comfort.",
  },
];

const SNACK_CHOICES: Choice[] = [
  {
    label: "Duck neck",
    correct: true,
    reaction: "Bedtime snack approved. Sleep may now proceed.",
  },
  {
    label: "Broccoli",
    correct: false,
    reaction: "Porky did not request a tiny tree before bed.",
  },
  {
    label: "Lemon",
    correct: false,
    reaction: "This bedtime routine has become a citrus emergency.",
  },
];

const STEPS = [
  "Dim the Lights",
  "Prepare the Bed",
  "Pick the Blanket",
  "Choose the Bedtime Snack",
  "Give Piggy Goodnight Pets",
];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getSleepRating(mistakes: number) {
  if (mistakes === 0) return "Five-Star Porky Sleep Specialist 🏆";
  if (mistakes <= 2) return "Certified Blanket Assistant 🐾";
  if (mistakes <= 4) return "Junior Nap Technician";
  return "Porky requests a new bedtime employee.";
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
          "flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950/70 to-black text-5xl",
        ].join(" ")}
        aria-label={alt}
      >
        ☾
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

function ChoiceButton({
  choice,
  disabled,
  onChoose,
}: {
  choice: Choice;
  disabled: boolean;
  onChoose: (choice: Choice) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChoose(choice)}
      className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4 text-left text-base font-black text-white transition hover:border-amber-200/70 hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {choice.label}
    </button>
  );
}

function ProgressPaws({ completedSteps }: { completedSteps: number[] }) {
  return (
    <div className="flex gap-2" aria-label={`${completedSteps.length} of 5 bedtime steps complete`}>
      {STEPS.map((step, index) => (
        <span
          key={step}
          className={[
            "flex h-10 w-10 items-center justify-center rounded-full border text-lg",
            completedSteps.includes(index)
              ? "border-amber-200 bg-amber-300/20 text-amber-100"
              : "border-white/10 bg-white/5 text-slate-500",
          ].join(" ")}
          title={step}
        >
          🐾
        </span>
      ))}
    </div>
  );
}

export function BedtimePiggyGame({ data }: { data: BedtimeData }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [petCount, setPetCount] = useState(0);
  const [roomBrightness, setRoomBrightness] = useState(100);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finalTime, setFinalTime] = useState(0);
  const [message, setMessage] = useState("");
  const [isReacting, setIsReacting] = useState(false);
  const [sleepSequenceStarted, setSleepSequenceStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const slideshow = useMemo(
    () => [
      {
        image: data.photos.yawning,
        caption: "Porky is powering down...",
        alt: "Piggy yawning before bedtime",
        sound: data.audio.yawn,
      },
      {
        image: data.photos.platformNap,
        caption: "Platform nap mode activated.",
        alt: "Piggy sleeping with his face resting on the cat-tree platform",
        sound: data.audio.sleep,
      },
      {
        image: data.photos.bedNap,
        caption: "Maximum bed coverage achieved.",
        alt: "Piggy stretched out asleep on the bed",
        sound: data.audio.sleep,
      },
      {
        image: data.photos.humanNap,
        caption: "Sleeping beside the humans for quality control.",
        alt: "Close-up of Piggy sleeping beside someone",
        sound: data.audio.purr,
      },
    ],
    [data]
  );

  const playSound = (src: string) => {
    if (!soundEnabled) return;

    const audio = new Audio(src);
    audio.volume = 0.35;
    audio.play().catch(() => undefined);
  };

  const resetGame = () => {
    setGameStarted(false);
    setCurrentStep(0);
    setCompletedSteps([]);
    setMistakes(0);
    setPetCount(0);
    setRoomBrightness(100);
    setGameCompleted(false);
    setSlideshowIndex(0);
    setStartTime(null);
    setFinalTime(0);
    setMessage("");
    setIsReacting(false);
    setSleepSequenceStarted(false);
  };

  const startGame = () => {
    setGameStarted(true);
    setCurrentStep(0);
    setCompletedSteps([]);
    setMistakes(0);
    setPetCount(0);
    setRoomBrightness(100);
    setGameCompleted(false);
    setSlideshowIndex(0);
    setStartTime(Date.now());
    setFinalTime(0);
    setMessage("");
    setIsReacting(false);
    setSleepSequenceStarted(false);
  };

  const completeStep = (reaction: string) => {
    if (isReacting) return;

    setMessage(reaction);
    setIsReacting(true);
    setCompletedSteps((current) =>
      current.includes(currentStep) ? current : [...current, currentStep]
    );
    playSound(currentStep === 4 ? data.audio.purr : data.audio.sleep);

    window.setTimeout(() => {
      setIsReacting(false);
      setMessage("");

      if (currentStep === STEPS.length - 1) {
        setSleepSequenceStarted(true);
        setSlideshowIndex(0);
        return;
      }

      setCurrentStep((value) => value + 1);
    }, 1050);
  };

  const handleWrongChoice = (reaction: string) => {
    if (isReacting) return;

    setMistakes((value) => value + 1);
    setMessage(reaction);
    setIsReacting(true);

    window.setTimeout(() => {
      setMessage("");
      setIsReacting(false);
    }, 1050);
  };

  const handleChoice = (choice: Choice) => {
    if (choice.correct) {
      completeStep(choice.reaction);
      return;
    }

    handleWrongChoice(choice.reaction);
  };

  const handlePet = () => {
    if (isReacting || currentStep !== 4) return;

    const nextPetCount = petCount + 1;
    setPetCount(nextPetCount);
    playSound(data.audio.purr);

    if (nextPetCount >= 3) {
      completeStep("Acceptable affection level achieved.");
    } else {
      setMessage(`Goodnight pets: ${nextPetCount} / 3`);
    }
  };

  useEffect(() => {
    if (!sleepSequenceStarted || gameCompleted) return;

    playSound(slideshow[slideshowIndex].sound);

    const timeout = window.setTimeout(() => {
      if (slideshowIndex === slideshow.length - 1) {
        setGameCompleted(true);
        setFinalTime(
          startTime ? Math.max(1, Math.round((Date.now() - startTime) / 1000)) : 0
        );
        return;
      }

      setSlideshowIndex((value) => value + 1);
    }, slideshowIndex === 0 ? 2200 : 2600);

    return () => window.clearTimeout(timeout);
  }, [
    gameCompleted,
    sleepSequenceStarted,
    slideshow,
    slideshowIndex,
    soundEnabled,
    startTime,
  ]);

  const roomOverlayOpacity = Math.max(0, Math.min(0.76, (100 - roomBrightness) / 100));
  const activeSlide = slideshow[slideshowIndex];

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/40 to-black px-5 py-20 text-white md:px-8">
      <div className="absolute left-[-10rem] top-12 h-96 w-96 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="absolute right-[-10rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-red-900/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/80 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.09]">
        <div className="absolute left-[8%] top-[18%] text-4xl">✦</div>
        <div className="absolute right-[14%] top-[24%] text-5xl">☾</div>
        <div className="absolute bottom-[18%] left-[42%] text-4xl">🐾</div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/profile/piggy"
            className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Back to Piggy Games
          </Link>
          <button
            type="button"
            aria-pressed={soundEnabled}
            onClick={() => setSoundEnabled((value) => !value)}
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Sound: {soundEnabled ? "On" : "Muted"}
          </button>
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
                <div className="flex min-h-[420px] items-center justify-center bg-black/35 p-4">
                  <SafeImage
                    src={data.thumbnail}
                    alt="Bedtime Piggy thumbnail"
                    className="max-h-[560px] w-full object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-300">
                    Piggy Studios Game
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                    Bedtime Piggy
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-amber-100">
                    Porky has had a very exhausting day of eating, sleeping, and
                    asking for more food.
                  </p>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                    Complete Porky&apos;s highly demanding bedtime routine and help
                    the household food beggar finally fall asleep.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={startGame}
                      className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                    >
                      Start Bedtime Routine
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

          {gameStarted && !sleepSequenceStarted && !gameCompleted && (
            <motion.section
              key="routine"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/50 backdrop-blur"
            >
              <header className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-300">
                    Step {currentStep + 1} of 5
                  </p>
                  <h1 className="mt-2 text-3xl font-black md:text-5xl">
                    {STEPS[currentStep]}
                  </h1>
                </div>
                <ProgressPaws completedSteps={completedSteps} />
              </header>

              <div className="grid gap-0 lg:grid-cols-[1fr_0.95fr]">
                <motion.div
                  animate={
                    isReacting && message && !completedSteps.includes(currentStep)
                      ? { x: [0, -7, 7, -4, 4, 0] }
                      : { x: 0 }
                  }
                  transition={{ duration: 0.35 }}
                  className="relative min-h-[520px] overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/50 to-black p-5"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_75%_35%,rgba(30,64,175,0.22),transparent_38%)]" />
                  <div
                    className="absolute inset-0 bg-black transition-opacity duration-300"
                    style={{ opacity: roomOverlayOpacity }}
                  />
                  <div className="pointer-events-none absolute inset-0 opacity-30">
                    <div className="absolute left-10 top-10 text-3xl">✦</div>
                    <div className="absolute right-16 top-24 text-4xl">☾</div>
                    <div className="absolute bottom-16 left-24 text-3xl">✦</div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePet}
                    disabled={currentStep !== 4 || isReacting}
                    className="relative z-10 flex h-full min-h-[480px] w-full items-center justify-center rounded-3xl border border-white/10 bg-black/20 p-4 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-default"
                    aria-label={
                      currentStep === 4
                        ? `Give Piggy goodnight pets, ${petCount} of 3 complete`
                        : "Piggy bedtime scene"
                    }
                  >
                    <SafeImage
                      src={data.photos.yawning}
                      alt="Piggy yawning before bedtime"
                      className="max-h-[560px] w-full object-contain"
                    />
                    {isReacting && completedSteps.includes(currentStep) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7, y: 18 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0.7, 1.25, 1.7],
                          y: -50,
                        }}
                        transition={{ duration: 1.05 }}
                        className="pointer-events-none absolute text-6xl"
                      >
                        ✨🐾
                      </motion.div>
                    )}
                  </button>
                </motion.div>

                <div className="p-6 md:p-10">
                  <div className="min-h-20 rounded-3xl border border-white/10 bg-black/30 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-200">
                      Porky Status
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-200">
                      {message || "Awaiting acceptable bedtime service."}
                    </p>
                  </div>

                  {currentStep === 0 && (
                    <div className="mt-6 space-y-5">
                      <label
                        htmlFor="room-brightness"
                        className="block text-lg font-black text-white"
                      >
                        Dim the Lights
                      </label>
                      <input
                        id="room-brightness"
                        type="range"
                        min="20"
                        max="100"
                        value={roomBrightness}
                        disabled={isReacting}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setRoomBrightness(value);
                          if (value <= 35) {
                            completeStep(
                              "Finally. The lighting in this establishment was unacceptable."
                            );
                          }
                        }}
                        className="w-full accent-amber-300"
                      />
                      <button
                        type="button"
                        disabled={isReacting}
                        onClick={() => {
                          setRoomBrightness(25);
                          completeStep(
                            "Finally. The lighting in this establishment was unacceptable."
                          );
                        }}
                        className="rounded-md bg-white px-5 py-3 font-bold text-black transition hover:bg-slate-200 disabled:opacity-50"
                      >
                        Turn Lamp Down
                      </button>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="mt-6 grid gap-3">
                      {BED_CHOICES.map((choice) => (
                        <ChoiceButton
                          key={choice.label}
                          choice={choice}
                          disabled={isReacting}
                          onChoose={handleChoice}
                        />
                      ))}
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="mt-6 grid gap-3">
                      {BLANKET_CHOICES.map((choice) => (
                        <ChoiceButton
                          key={choice.label}
                          choice={choice}
                          disabled={isReacting}
                          onChoose={handleChoice}
                        />
                      ))}
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="mt-6 grid gap-3">
                      {SNACK_CHOICES.map((choice) => (
                        <ChoiceButton
                          key={choice.label}
                          choice={choice}
                          disabled={isReacting}
                          onChoose={handleChoice}
                        />
                      ))}
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="mt-6 space-y-5">
                      <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                        <p className="text-lg font-black text-white">
                          Pet counter: {petCount} / 3
                        </p>
                        <p className="mt-2 text-slate-300">
                          Click Piggy gently three times to complete the routine.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isReacting}
                        onClick={handlePet}
                        className="rounded-md bg-white px-5 py-3 font-bold text-black transition hover:bg-slate-200 disabled:opacity-50"
                      >
                        Give Goodnight Pet
                      </button>
                    </div>
                  )}

                  <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold text-slate-300">
                    Mistakes made: <span className="text-white">{mistakes}</span>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {sleepSequenceStarted && !gameCompleted && (
            <motion.section
              key="sleep-sequence"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-black/60"
            >
              <div className="relative flex min-h-[680px] items-center justify-center bg-gradient-to-b from-slate-950 via-black to-black p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlide.image}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <SafeImage
                      src={activeSlide.image}
                      alt={activeSlide.alt}
                      className="max-h-full w-full object-contain"
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/45" />
                <div className="absolute bottom-8 left-8 right-8 text-center">
                  <p className="text-2xl font-black text-white md:text-4xl">
                    {activeSlide.caption}
                  </p>
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
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-300">
                Bedtime Complete
              </p>
              <h1 className="mt-4 text-4xl font-black md:text-6xl">
                Porky Is Finally Asleep 🌙
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
                You successfully completed the official Piggy bedtime protocol
                without causing a plastic-bag emergency.
              </p>

              <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Routine
                  </p>
                  <p className="mt-2 text-xl font-black text-white">Completed</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Mistakes
                  </p>
                  <p className="mt-2 text-xl font-black text-white">{mistakes}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Total Time
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {formatTime(finalTime)}
                  </p>
                </div>
              </div>

              <h2 className="mt-8 text-3xl font-black text-white">
                {getSleepRating(mistakes)}
              </h2>

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={startGame}
                  className="rounded-md bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-slate-200"
                >
                  Put Piggy to Bed Again
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

export default BedtimePiggyGame;
