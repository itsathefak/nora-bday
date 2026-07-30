export type NoraSong = {
  id: string;
  year: number;
  title: string;
  artist: string;
  audio: string;
  thumbnail: string;
  description: string;
  available: boolean;
  loop?: boolean;
};

export const noraSongs: NoraSong[] = [
  {
    id: "gravity-2025",
    year: 2025,
    title: "Gravity",
    artist: "Jai Wolf",
    audio: "/audio/nora/gravity.mp3",
    thumbnail: "/images/nora/songs/gravity-2025.jpg",
    description: "The song that feels like 2025.",
    available: true,
    loop: true,
  },
  {
    id: "easy-2026",
    year: 2026,
    title: "Easy",
    artist: "Troye Sivan",
    audio: "/audio/nora/easy.mp3",
    thumbnail: "/images/nora/songs/easy-2026.jpg",
    description: "The soundtrack of our 2026.",
    available: true,
    loop: true,
  },
];
