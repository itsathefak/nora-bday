"use client";

import ProfileHomePage from "../../../components/ProfileHomePage";
import homeData from "../../../data/dauda/home.json";
import rows from "../../../data/dauda/rows.json";
import games from "../../../data/dauda/games.json";

export default function DaudaProfilePage() {
  const hero = homeData.hero;
  const mediaMap: Record<string, any> = {};

  games
    .filter((game: any) => game.enabled)
    .sort((a: any, b: any) => a.order - b.order)
    .forEach((game: any) => {
      mediaMap[game.id] = {
        ...game,
        href: game.route || `/profile/dauda/games/${game.slug}`,
      };
    });

  return <ProfileHomePage heroData={hero} rows={rows} mediaMap={mediaMap} />;
}
