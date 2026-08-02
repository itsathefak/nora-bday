"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

const STORAGE_KEY = "noraflix-birthday-reflection-2026";

const questionTwoOptions = [
  "Yes, very special ❤️",
  "Yes 🥹",
  "A little",
  "I have thoughts 👀",
];

const birthdayYears = Array.from({ length: 2026 - 2002 + 1 }, (_, index) => String(2002 + index));

type BirthdayReflectionAnswers = {
  bestBirthdayYear: string;
  comments: string;
  specialFeeling: string;
  thoughts: string;
  submitted: boolean;
};

const emptyAnswers: BirthdayReflectionAnswers = {
  bestBirthdayYear: "",
  comments: "",
  specialFeeling: "",
  thoughts: "",
  submitted: false,
};

export function BirthdayReflectionSection() {
  const reduceMotion = useReducedMotion();
  const [answers, setAnswers] = useState<BirthdayReflectionAnswers>(emptyAnswers);
  const [errors, setErrors] = useState<{ bestBirthdayYear?: string; specialFeeling?: string }>({});
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<BirthdayReflectionAnswers>;
        setAnswers({
          bestBirthdayYear: typeof parsed.bestBirthdayYear === "string" ? parsed.bestBirthdayYear : "",
          comments: typeof parsed.comments === "string" ? parsed.comments : "",
          specialFeeling: typeof parsed.specialFeeling === "string" ? parsed.specialFeeling : "",
          thoughts: typeof parsed.thoughts === "string" ? parsed.thoughts : "",
          submitted: Boolean(parsed.submitted),
        });
      }
    } catch {
      setAnswers(emptyAnswers);
    } finally {
      setStorageReady(true);
    }
  }, []);

  const showThoughts = answers.specialFeeling === "I have thoughts 👀";

  const savedPayload = useMemo(
    () => ({
      bestBirthdayYear: answers.bestBirthdayYear,
      comments: answers.comments.trim(),
      specialFeeling: answers.specialFeeling,
      thoughts: showThoughts ? answers.thoughts.trim() : "",
      submitted: answers.submitted,
    }),
    [answers.bestBirthdayYear, answers.comments, answers.specialFeeling, answers.submitted, answers.thoughts, showThoughts],
  );

  const saveAnswers = (nextAnswers: BirthdayReflectionAnswers) => {
    setAnswers(nextAnswers);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        bestBirthdayYear: nextAnswers.bestBirthdayYear,
        comments: nextAnswers.comments.trim(),
        specialFeeling: nextAnswers.specialFeeling,
        thoughts: nextAnswers.specialFeeling === "I have thoughts 👀" ? nextAnswers.thoughts.trim() : "",
        submitted: nextAnswers.submitted,
      }));
    } catch {
      // The form still works even if private browsing blocks localStorage.
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};

    if (!answers.bestBirthdayYear) {
      nextErrors.bestBirthdayYear = "Pick the birthday year first.";
    }

    if (!answers.specialFeeling) {
      nextErrors.specialFeeling = "Choose one tiny birthday verdict.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    saveAnswers({
      bestBirthdayYear: savedPayload.bestBirthdayYear,
      comments: savedPayload.comments,
      specialFeeling: savedPayload.specialFeeling,
      thoughts: savedPayload.thoughts,
      submitted: true,
    });
  };

  const updateAnswer = (patch: Partial<BirthdayReflectionAnswers>) => {
    setAnswers((current) => ({ ...current, ...patch }));
    setErrors((current) => ({
      ...current,
      bestBirthdayYear: patch.bestBirthdayYear !== undefined ? undefined : current.bestBirthdayYear,
      specialFeeling: patch.specialFeeling !== undefined ? undefined : current.specialFeeling,
    }));
  };

  return (
    <motion.section
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-pink-200/10 bg-[radial-gradient(circle_at_18%_0%,rgba(244,114,182,0.16),transparent_32%),radial-gradient(circle_at_92%_30%,rgba(239,68,68,0.12),transparent_34%),linear-gradient(135deg,rgba(18,18,18,0.98),rgba(5,5,5,0.98))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.45)] sm:p-8"
    >
      <div className="pointer-events-none absolute -right-10 top-8 text-8xl text-pink-200/[0.045]">♥</div>
      <div className="pointer-events-none absolute bottom-8 left-8 text-4xl text-red-200/[0.06]">✦</div>

      <div className="relative">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-200/60">
          A tiny birthday debrief
        </p>
        <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
          Before You Leave NoraFlix… ❤️
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
          Atna has two very important questions for the birthday girl.
        </p>

        {answers.submitted ? (
          <div className="mt-8 rounded-2xl border border-pink-200/15 bg-black/35 p-6 text-center shadow-inner shadow-pink-950/20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-400/15 text-2xl shadow-[0_0_28px_rgba(244,114,182,0.18)]">
              ❤️
            </div>
            <h3 className="mt-5 text-2xl font-black text-white">Answers Sealed ❤️</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Thank you, birthday girl. Atna will now responsibly read this without overanalysing every single word.
            </p>
            <button
              type="button"
              onClick={() => saveAnswers({ ...answers, submitted: false })}
              className="mt-6 min-h-11 rounded-full border border-white/15 bg-white/5 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-pink-200/30 hover:bg-pink-200/10 focus:outline-none focus:ring-2 focus:ring-pink-200/60"
            >
              Edit My Answers
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-2xl border border-white/10 bg-black/35 p-5 shadow-inner shadow-black/30">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-200/60">Question One</p>
                <fieldset className="mt-3">
                  <legend className="block text-xl font-black leading-snug text-white">
                  Before today, what was the best birthday you’ve ever had in your entire life?
                  </legend>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Pick the year first. Atna needs the official birthday lore timeline.
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {birthdayYears.map((year) => {
                      const selected = answers.bestBirthdayYear === year;
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => updateAnswer({ bestBirthdayYear: year })}
                          className={`min-h-11 rounded-full border px-3 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-pink-200/60 ${
                            selected
                              ? "border-pink-200/55 bg-pink-300/18 text-pink-50 shadow-[0_0_26px_rgba(244,114,182,0.18)]"
                              : "border-white/10 bg-white/[0.04] text-slate-300 hover:-translate-y-0.5 hover:border-pink-200/25 hover:bg-pink-200/10 hover:text-white"
                          }`}
                          aria-pressed={selected}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                {errors.bestBirthdayYear && (
                  <p id="birthday-reflection-year-error" className="mt-2 text-sm font-semibold text-pink-200">
                    {errors.bestBirthdayYear}
                  </p>
                )}
                <label htmlFor="birthday-reflection-comments" className="mt-6 block text-sm font-black uppercase tracking-[0.18em] text-pink-200/60">
                  Comments
                </label>
                <textarea
                  id="birthday-reflection-comments"
                  value={answers.comments}
                  onChange={(event) => updateAnswer({ comments: event.target.value })}
                  placeholder="Tell me everything — where it was, what happened, and why it was so special…"
                  className="mt-3 min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-black/55 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-pink-200/45 focus:ring-2 focus:ring-pink-200/20"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/35 p-5 shadow-inner shadow-black/30">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-200/60">Question Two</p>
                <fieldset className="mt-3">
                  <legend className="text-xl font-black leading-snug text-white">
                    Did this birthday make you feel truly special?
                  </legend>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {questionTwoOptions.map((option) => {
                      const selected = answers.specialFeeling === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateAnswer({ specialFeeling: option })}
                          className={`min-h-11 rounded-full border px-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-pink-200/60 ${
                            selected
                              ? "border-pink-200/55 bg-pink-300/18 text-pink-50 shadow-[0_0_26px_rgba(244,114,182,0.18)]"
                              : "border-white/10 bg-white/[0.04] text-slate-300 hover:-translate-y-0.5 hover:border-pink-200/25 hover:bg-pink-200/10 hover:text-white"
                          }`}
                          aria-pressed={selected}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                {errors.specialFeeling && (
                  <p className="mt-3 text-sm font-semibold text-pink-200">
                    {errors.specialFeeling}
                  </p>
                )}

                {showThoughts && (
                  <motion.div
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.25 }}
                    className="mt-5"
                  >
                    <label htmlFor="birthday-reflection-thoughts" className="sr-only">
                      Optional thoughts for Atna
                    </label>
                    <textarea
                      id="birthday-reflection-thoughts"
                      value={answers.thoughts}
                      onChange={(event) => updateAnswer({ thoughts: event.target.value })}
                      placeholder="Atna is listening… and definitely not panicking."
                      className="min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-black/55 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-pink-200/45 focus:ring-2 focus:ring-pink-200/20"
                    />
                  </motion.div>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-pink-200/15 bg-pink-200/[0.06] p-5 text-center shadow-[0_0_36px_rgba(244,114,182,0.08)]">
              <p className="font-serif text-2xl font-bold italic leading-snug text-pink-50">
                Every single birthday of yours from here is only going to get better, my love. ❤️
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-400">
                This is both a promise and a warning from Atna Productions.
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                disabled={!storageReady}
                className="min-h-12 rounded-full bg-red-600 px-7 text-base font-black text-white shadow-[0_14px_40px_rgba(220,38,38,0.28)] transition hover:-translate-y-0.5 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-200/70 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Seal My Answers 💌
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.section>
  );
}
