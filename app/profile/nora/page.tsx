"use client";

import ProfileHomePage from "../../../components/ProfileHomePage";
import homeData from "../../../data/nora/home.json";
import rows from "../../../data/nora/rows.json";
import media from "../../../data/nora/media.json";
import monthlyMovies from "../../../data/nora/monthlyMovies.json";
import featuredMovies from "../../../data/nora/featuredMovies.json";

export default function NoraProfilePage() {
  const hero = homeData.hero;
  const mediaMap: Record<string, any> = {};
  media.forEach((m: any) => (mediaMap[m.id] = m));

  return (
    <ProfileHomePage
      heroData={hero}
      rows={rows}
      mediaMap={mediaMap}
      noraMonthlyMovies={monthlyMovies}
      noraFeaturedMovies={featuredMovies}
    />
  );
}
