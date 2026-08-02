import {
  type HeartPingSender,
  type HeartPingMessageType,
} from "../lib/heart-ping/types";

export type HeartPingEmailProps = {
  senderName: string;
  sender: HeartPingSender;
  recipientName: string;
  messageType: HeartPingMessageType;
  note?: string;
  sentAt: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCopy(sender: HeartPingSender, messageType: HeartPingMessageType) {
  if (messageType === "miss-you") {
    return {
      eyebrow: "missing hours",
      bannerTitle: sender === "atna" ? "Atna missed you" : "Nora misses you",
      bannerSubtitle: "A tiny signal from not-so-far away.",
      heading: "Someone is missing you.",
      body: "No emergency. No complicated explanation. Just a small signal from someone who wished you were a little closer today.",
      icon: "☾",
    };
  }

  if (messageType === "love-you") {
    return {
      eyebrow: "love note",
      bannerTitle: `${sender === "atna" ? "Atna" : "Nora"} loves you`,
      bannerSubtitle: "No big speech. Just the truest thing.",
      heading: "Something worth saying again.",
      body: "You are loved on the exciting days, the ordinary days, and all the quiet days in between.",
      icon: "♥",
    };
  }

  if (sender === "atna") {
    return {
      eyebrow: "huggie request",
      bannerTitle: "Huggie wanted",
      bannerSubtitle: "A soft little request has entered the chat.",
      heading: "Huggie wanted has been officially declared.",
      body: "This is a cute, very dramatic little request for a huggie. No pressure, no emergency, just one person asking sweetly for a little closeness.",
      icon: "♡",
    };
  }

  return {
    eyebrow: "necky request",
    bannerTitle: "Necky wanted",
    bannerSubtitle: "A neck massage petition, filed with love.",
    heading: "Necky wanted has been officially declared.",
    body: "This is a soft, very dramatic little request for a neck massage. No pressure, no emergency, just one beloved neck asking politely for rescue.",
    icon: "♡",
  };
}

export function renderHeartPingEmail({
  senderName,
  sender,
  recipientName,
  messageType,
  note,
  sentAt,
}: HeartPingEmailProps) {
  const message = getCopy(sender, messageType);
  const imageBlock = `
    <div style="border-radius:24px 24px 0 0;background:linear-gradient(135deg,#3b0608 0%,#8b1d25 48%,#ffc0cb 100%);padding:34px 30px 32px;min-height:190px;">
      <div style="display:inline-block;border-radius:999px;background:rgba(18,7,7,0.58);border:1px solid rgba(255,255,255,0.18);padding:9px 13px;color:#ffe4e6;font-size:11px;font-weight:900;letter-spacing:0.26em;text-transform:uppercase;">${escapeHtml(message.eyebrow)}</div>
      <div style="margin-top:30px;color:#fff7ed;font-family:Georgia,serif;font-size:48px;line-height:1.02;font-weight:900;text-shadow:0 12px 32px rgba(0,0,0,0.24);">${escapeHtml(message.bannerTitle)}</div>
      <div style="margin-top:12px;color:#ffe4e6;font-size:17px;line-height:1.55;font-weight:700;">${escapeHtml(message.bannerSubtitle)}</div>
      <div style="margin-top:18px;color:#fff0f3;font-size:42px;line-height:1;">${escapeHtml(message.icon)}</div>
    </div>
  `;

  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#070303;padding:28px 14px;font-family:Arial,Helvetica,sans-serif;color:#f8efe2;">
        <div style="max-width:640px;margin:0 auto;border-radius:28px;background:#120707;overflow:hidden;border:1px solid rgba(255,255,255,0.12);box-shadow:0 24px 70px rgba(0,0,0,0.45);">
          ${imageBlock}
          <div style="padding:34px 30px 30px;">
            <div style="font-size:34px;font-weight:900;letter-spacing:-0.04em;"><span style="color:#dc2626;">Nora</span><span style="color:#ffffff;">Flix</span></div>
            <div style="margin-top:18px;font-size:11px;font-weight:800;letter-spacing:0.32em;color:#fca5a5;text-transform:uppercase;">A Heart Ping</div>
            <h1 style="margin:18px 0 12px;font-family:Georgia,serif;font-size:34px;line-height:1.15;color:#fff7ed;">${escapeHtml(message.heading)}</h1>
            <p style="margin:0;font-size:17px;line-height:1.7;color:#e5d5ca;">${escapeHtml(message.body)}</p>
            <p style="margin:22px 0 0;font-size:15px;line-height:1.6;color:#b9a5a0;">Sent by ${escapeHtml(senderName)} for ${escapeHtml(recipientName)} on ${escapeHtml(sentAt)}.</p>
            ${note ? `
              <div style="margin:28px 0;padding:20px;border-radius:18px;background:#f4ead5;border:1px solid #e4ceb0;color:#392515;">
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.18em;color:#8f5b4d;font-weight:700;margin-bottom:10px;">A note from ${escapeHtml(senderName)}</div>
                <div style="font-family:Georgia,serif;font-size:17px;line-height:1.65;color:#2b1b13;">${escapeHtml(note).replace(/\n/g, "<br />")}</div>
              </div>
            ` : ""}
            <div style="height:1px;background:rgba(255,255,255,0.12);margin:30px 0;"></div>
            <p style="margin:0 0 12px;font-size:13px;line-height:1.65;color:#b9a5a0;">Sent from the little place we made to keep our memories.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function renderHeartPingText({
  senderName,
  sender,
  recipientName,
  messageType,
  note,
  sentAt,
}: HeartPingEmailProps) {
  const message = getCopy(sender, messageType);
  return [
    "NoraFlix",
    "A HEART PING",
    "",
    message.heading,
    message.body,
    "",
    `Sent by ${senderName} for ${recipientName} on ${sentAt}.`,
    note ? `\nA note from ${senderName}\n${note}` : "",
    "",
    "Sent from the little place we made to keep our memories.",
  ].filter(Boolean).join("\n");
}
