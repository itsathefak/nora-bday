import Link from "next/link";
import { BedtimePiggyGame } from "../../../../../components/games/BedtimePiggyGame";
import { CatchTheTreatGame } from "../../../../../components/games/CatchTheTreatGame";
import { FeedPorkyGame } from "../../../../../components/games/FeedPorkyGame";
import { FindPiggyGame } from "../../../../../components/games/FindPiggyGame";
import { GuessThePorkGame } from "../../../../../components/games/GuessThePorkGame";
import { PiggyMemoryMatchGame } from "../../../../../components/games/PiggyMemoryMatchGame";
import { PiggyTreatSortGame } from "../../../../../components/games/PiggyTreatSortGame";
import { PiggyPuzzlerGame } from "../../../../../components/games/PiggyPuzzlerGame";
import { PiggyWhackAPawGame } from "../../../../../components/games/PiggyWhackAPawGame";
import { PorkysFashionPoliceGame } from "../../../../../components/games/PorkysFashionPoliceGame";
import { WhereAndWhenWasPiggyGame } from "../../../../../components/games/WhereAndWhenWasPiggyGame";
import { WhoScaredPiggyGame } from "../../../../../components/games/WhoScaredPiggyGame";
import bedtimePiggyData from "../../../../../data/piggy/bedtimePiggy.json";
import catchTheTreatItems from "../../../../../data/piggy/catchTheTreat.json";
import feedPorkyFoods from "../../../../../data/piggy/feedPorky.json";
import findPiggyData from "../../../../../data/piggy/findPiggy.json";
import guessThePorkItems from "../../../../../data/piggy/guessThePork.json";
import games from "../../../../../data/piggy/games.json";
import piggyMemoryMatchItems from "../../../../../data/piggy/piggyMemoryMatch.json";
import piggyTreatSortItems from "../../../../../data/piggy/piggyTreatSort.json";
import piggyPuzzlerImages from "../../../../../data/piggy/piggyPuzzler.json";
import porkysFashionPoliceRounds from "../../../../../data/piggy/porkysFashionPolice.json";
import whereAndWhenRounds from "../../../../../data/piggy/whereAndWhen.json";
import whackAPawData from "../../../../../data/piggy/whackAPaw.json";
import whoScaredPiggyRounds from "../../../../../data/piggy/whoScaredPiggy.json";

interface PiggyGamePageProps {
  params: {
    slug: string;
  };
}

export default function PiggyGamePage({ params }: PiggyGamePageProps) {
  const game = games.find((item) => item.slug === params.slug);

  if (params.slug === "where-and-when-was-piggy") {
    return <WhereAndWhenWasPiggyGame rounds={whereAndWhenRounds} />;
  }

  if (params.slug === "guess-the-pork") {
    return <GuessThePorkGame items={guessThePorkItems} />;
  }

  if (params.slug === "porkys-fashion-police") {
    return <PorkysFashionPoliceGame rounds={porkysFashionPoliceRounds} />;
  }

  if (params.slug === "piggy-memory-match") {
    return <PiggyMemoryMatchGame items={piggyMemoryMatchItems} />;
  }

  if (params.slug === "feed-porky") {
    return <FeedPorkyGame foods={feedPorkyFoods} />;
  }

  if (params.slug === "who-scared-piggy") {
    return <WhoScaredPiggyGame rounds={whoScaredPiggyRounds} />;
  }

  if (params.slug === "bedtime-piggy") {
    return <BedtimePiggyGame data={bedtimePiggyData} />;
  }

  if (params.slug === "find-piggy") {
    return <FindPiggyGame data={findPiggyData} />;
  }

  if (params.slug === "piggy-puzzler") {
    return <PiggyPuzzlerGame images={piggyPuzzlerImages} />;
  }

  if (params.slug === "catch-the-treat") {
    return <CatchTheTreatGame items={catchTheTreatItems} />;
  }

  if (params.slug === "piggy-whack-a-paw") {
    return <PiggyWhackAPawGame data={whackAPawData} />;
  }

  if (params.slug === "piggy-treat-sort") {
    return <PiggyTreatSortGame items={piggyTreatSortItems} />;
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-red-950/30 via-black to-black px-6 py-24 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold">Game not found</h1>
          <Link
            href="/profile/piggy"
            className="mt-8 inline-flex rounded-md bg-white px-5 py-3 font-semibold text-black"
          >
            Back to Piggy Games
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-950/30 via-black to-black px-6 py-24 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/profile/piggy"
          className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Back to Piggy Games
        </Link>

        <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40">
          <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-slate-950">
              <img
                src={game.thumbnail}
                alt={game.title}
                className="h-full min-h-72 w-full object-cover"
              />
            </div>

            <div className="p-8 md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-400">
                Game coming soon
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
                {game.title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-200">
                {game.description}
              </p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Future Gameplay
                </h2>
                <p className="mt-3 leading-relaxed text-slate-300">
                  {game.futureGameplay}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
