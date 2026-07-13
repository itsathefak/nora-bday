import Link from "next/link";
import { CatchTheSeedsGame } from "../../../../../components/games/CatchTheSeedsGame";
import { HamsterMazeGame } from "../../../../../components/games/HamsterMazeGame";
import { WheelChampionGame } from "../../../../../components/games/WheelChampionGame";
import { WhereDidDaudaHideItGame } from "../../../../../components/games/WhereDidDaudaHideItGame";
import catchTheSeedsData from "../../../../../data/dauda/catchTheSeeds.json";
import hamsterMazeData from "../../../../../data/dauda/hamsterMaze.json";
import whereDidDaudaHideItData from "../../../../../data/dauda/whereDidDaudaHideIt.json";
import games from "../../../../../data/dauda/games.json";

interface DaudaGamePageProps {
  params: {
    slug: string;
  };
}

export default function DaudaGamePage({ params }: DaudaGamePageProps) {
  const game = games.find((item) => item.slug === params.slug);

  if (params.slug === "wheel-champion") {
    return <WheelChampionGame />;
  }

  if (params.slug === "hamster-maze") {
    return <HamsterMazeGame data={hamsterMazeData} />;
  }

  if (params.slug === "catch-the-seeds") {
    return <CatchTheSeedsGame data={catchTheSeedsData} />;
  }

  if (params.slug === "where-did-dauda-hide-it") {
    return <WhereDidDaudaHideItGame data={whereDidDaudaHideItData} />;
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-red-950/30 via-black to-black px-6 py-24 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold">Game not found</h1>
          <Link
            href="/profile/dauda"
            className="mt-8 inline-flex rounded-md bg-white px-5 py-3 font-semibold text-black"
          >
            Back to Dauda Games
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-red-950/30 via-black to-black px-6 py-24 text-white">
      <div className="absolute left-[-8rem] top-20 h-80 w-80 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-[-8rem] top-1/3 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
        <div className="absolute left-[10%] top-[18%] text-4xl">🌻</div>
        <div className="absolute right-[16%] top-[24%] text-3xl">🐾</div>
        <div className="absolute bottom-[18%] left-[42%] text-4xl">🌻</div>
      </div>

      <div className="relative mx-auto max-w-4xl">
        <Link
          href="/profile/dauda"
          className="inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Back to Dauda Games
        </Link>

        <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur">
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
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-amber-200">
                Tiny hamster world loading soon.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
