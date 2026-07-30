export type HeartPingSender = "atna" | "nora";
export type HeartPingMessageType = "miss-you" | "love-you" | "support";

export type HeartPingRequest = {
  sender: HeartPingSender;
  messageType: HeartPingMessageType;
  note?: string;
};

export type HeartPingSummary = {
  id: string;
  sender: HeartPingSender;
  messageType: HeartPingMessageType;
  sentAt: string;
  status: "sent";
};

export const HEART_PING_LABELS: Record<HeartPingMessageType, string> = {
  "miss-you": "I Miss You",
  "love-you": "I Love You",
  support: "Necky Want",
};

export const HEART_PING_SUBJECTS: Record<HeartPingMessageType, string> = {
  "miss-you": "A little Heart Ping: I miss you 💌",
  "love-you": "A little Heart Ping: I love you ❤️",
  support: "A little Heart Ping: necky want please",
};

export const HEART_PING_PEOPLE: Record<HeartPingSender, { name: string; image: string }> = {
  atna: { name: "Atna", image: "/videos/atna/atna.png" },
  nora: { name: "Nora", image: "/videos/nora/nora.png" },
};

export function getHeartPingRecipient(sender: HeartPingSender): HeartPingSender {
  return sender === "atna" ? "nora" : "atna";
}
