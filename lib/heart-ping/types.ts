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

export const HEART_PING_PEOPLE: Record<HeartPingSender, { name: string; image: string }> = {
  atna: { name: "Atna", image: "/videos/atna/atna.png" },
  nora: { name: "Nora", image: "/videos/nora/nora.png" },
};

export function getHeartPingRecipient(sender: HeartPingSender): HeartPingSender {
  return sender === "atna" ? "nora" : "atna";
}

export function getHeartPingSenderDisplayName(sender: HeartPingSender) {
  return sender === "atna" ? "Atna bb" : "Nora bb";
}

export function getHeartPingLabel(sender: HeartPingSender, messageType: HeartPingMessageType) {
  if (messageType === "love-you") return "I Love You";
  if (messageType === "miss-you") return "I Miss You";
  return sender === "atna" ? "Huggie Wanted" : "Necky Wanted";
}

export function getHeartPingSubject(sender: HeartPingSender, messageType: HeartPingMessageType) {
  const name = HEART_PING_PEOPLE[sender].name;
  if (messageType === "love-you") return `${name} loves you`;
  if (messageType === "miss-you") return sender === "atna" ? "Atna missed you" : "Nora misses you";
  return sender === "atna" ? `${name} wants a huggie` : `${name} wants a neckie`;
}
