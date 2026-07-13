"use client";

import ProfileHomePage from "../../../components/ProfileHomePage";
import homeData from "../../../data/piggy/home.json";
import rows from "../../../data/piggy/rows.json";
import games from "../../../data/piggy/games.json";

export default function PiggyProfilePage() {
  const hero = homeData.hero;
  const mediaMap: Record<string, any> = {};
  games.forEach((game: any) => {
    mediaMap[game.id] = {
      ...game,
      href: `/profile/piggy/games/${game.slug}`,
    };
  });

  return <ProfileHomePage heroData={hero} rows={rows} mediaMap={mediaMap} />;
}
