export type ProfileId = "nora" | "piggy" | "dauda" | "atna";

export type ReminderMessage = {
  id: string;
  text: string;
  profiles?: ProfileId[];
  icon?: "heart" | "paw" | "star" | "envelope" | "sparkle";
};

export type ReminderPosition =
  | "left-top"
  | "left-middle"
  | "left-bottom"
  | "right-top"
  | "right-middle"
  | "right-bottom";

export const hiddenReminderMessages: ReminderMessage[] = [
  {
    id: "explore-everything",
    text: "Nothing much... just a reminder to go through the whole app so Atna's efforts feel valued.",
    icon: "heart",
  },
  {
    id: "late-nights",
    text: "Worth the late nights? Keep exploring and decide.",
    icon: "sparkle",
  },
  {
    id: "tiny-surprises",
    text: "Somewhere in this app is another tiny surprise waiting for you.",
    icon: "envelope",
  },
  {
    id: "questionable-decisions",
    text: "Made with late nights, snacks, love, and several questionable decisions.",
    icon: "heart",
  },
  {
    id: "detective-nora",
    text: "Nothing much. Just checking whether Detective Nora is paying attention to every corner.",
    profiles: ["nora", "atna"],
    icon: "star",
  },
  {
    id: "piggy-not-done",
    text: "Piggy says you are not done exploring yet.",
    profiles: ["piggy", "nora"],
    icon: "paw",
  },
  {
    id: "hidden-layers",
    text: "This app has more layers than Atna's overthinking. Please inspect suspicious things.",
    icon: "sparkle",
  },
  {
    id: "slowly",
    text: "Take your time. This little world was made to be explored slowly.",
    icon: "heart",
  },
  {
    id: "found-me",
    text: "You found me. Now go find the rest. There is definitely more hidden around here.",
    icon: "star",
  },
  {
    id: "every-corner",
    text: "Every little corner has something waiting for you.",
    icon: "envelope",
  },
  {
    id: "nora-monthly",
    text: "The monthly movies are only one part of the story.",
    profiles: ["nora"],
    icon: "heart",
  },
  {
    id: "nora-suspicious-buttons",
    text: "Check every row. Atna hides things where normal people would simply stop.",
    profiles: ["nora"],
    icon: "sparkle",
  },
  {
    id: "piggy-treats",
    text: "Porky inspected this page and demanded more treats.",
    profiles: ["piggy"],
    icon: "paw",
  },
  {
    id: "piggy-game",
    text: "There may be a game here that Piggy definitely cannot win.",
    profiles: ["piggy"],
    icon: "paw",
  },
  {
    id: "dauda-wheel",
    text: "Dauda ran several wheel laps while this page was being built.",
    profiles: ["dauda"],
    icon: "sparkle",
  },
  {
    id: "dauda-content",
    text: "Tiny hamster. Suspiciously large amount of content.",
    profiles: ["dauda"],
    icon: "star",
  },
  {
    id: "atna-buttons",
    text: "This page may contain feelings disguised as buttons.",
    profiles: ["atna"],
    icon: "envelope",
  },
  {
    id: "atna-say-out-loud",
    text: "Some things here were easier to build than to say out loud.",
    profiles: ["atna"],
    icon: "heart",
  },
];
