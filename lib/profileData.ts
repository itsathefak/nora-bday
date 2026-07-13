import noraMovies from "../data/nora/movies.json";
import noraOriginals from "../data/nora/originals.json";
import piggyGames from "../data/piggy/games.json";
import piggyVideos from "../data/piggy/videos.json";
import piggyQuotes from "../data/piggy/quotes.json";
import piggyAchievements from "../data/piggy/achievements.json";
import daudaGames from "../data/dauda/games.json";
import daudaVideos from "../data/dauda/videos.json";
import daudaQuotes from "../data/dauda/quotes.json";
import daudaAchievements from "../data/dauda/achievements.json";
import atnaLetters from "../data/atna/letters.json";
import atnaMemories from "../data/atna/memories.json";
import type { ProfileId } from "./profiles";

export interface SectionItem {
  id: string;
  title: string;
  subtitle?: string;
  poster?: string;
  slug?: string;
  description?: string;
  futureGameplay?: string;
  thumbnail?: string;
}

export interface ProfilePageData {
  hero: {
    title: string;
    description: string;
  };
  sections: {
    title: string;
    items: SectionItem[];
  }[];
}

export function getProfileData(profile: ProfileId): ProfilePageData {
  switch (profile) {
    case "nora":
      return {
        hero: {
          title: "Nora’s Picks",
          description:
            "A private collection of birthday movies and originals just for you.",
        },
        sections: [
          { title: "Movies", items: noraMovies },
          { title: "Originals", items: noraOriginals },
        ],
      };
    case "piggy":
      return {
        hero: {
          title: "Piggy’s Corner",
          description:
            "Cuddly videos, playful games, and cozy memories from the sweetest cat.",
        },
        sections: [
          { title: "Games", items: piggyGames },
          { title: "Videos", items: piggyVideos },
          { title: "Quotes", items: piggyQuotes },
          { title: "Achievements", items: piggyAchievements },
        ],
      };
    case "dauda":
      return {
        hero: {
          title: "Dauda’s Playground",
          description:
            "Tiny adventures, fast wheels, and heartwarming hamster stories.",
        },
        sections: [
          { title: "Games", items: daudaGames },
          { title: "Videos", items: daudaVideos },
          { title: "Quotes", items: daudaQuotes },
          { title: "Achievements", items: daudaAchievements },
        ],
      };
    case "atna":
      return {
        hero: {
          title: "Atna’s Studio",
          description:
            "Letters, memories, and creative moments made just for Nora.",
        },
        sections: [
          { title: "Letters", items: atnaLetters },
          { title: "Memories", items: atnaMemories },
        ],
      };
    default:
      return {
        hero: {
          title: "Profiles",
          description: "Choose a profile to continue.",
        },
        sections: [],
      };
  }
}
