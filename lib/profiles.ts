export type ProfileId = "nora" | "piggy" | "dauda" | "atna";

export interface ProfileInfo {
  id: ProfileId;
  name: string;
  subtitle: string;
  image: string;
  accent: string;
}

export const profiles: ProfileInfo[] = [
  {
    id: "nora",
    name: "Nora",
    subtitle: "The birthday star",
    image: "/images/profiles/nora.svg",
    accent: "#e50914",
  },
  {
    id: "piggy",
    name: "Piggy",
    subtitle: "Ragdoll cat royalty",
    image: "/images/profiles/piggy.svg",
    accent: "#ff5c8a",
  },
  {
    id: "dauda",
    name: "Dauda",
    subtitle: "Hamster energy",
    image: "/images/profiles/dauda.svg",
    accent: "#ffb84d",
  },
  {
    id: "atna",
    name: "Atna",
    subtitle: "The creator",
    image: "/images/profiles/atna.svg",
    accent: "#7c64ff",
  },
];
