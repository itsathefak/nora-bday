import {
  HEART_PING_SUBJECTS,
  type HeartPingMessageType,
} from "../lib/heart-ping/types";

export type HeartPingEmailProps = {
  senderName: string;
  recipientName: string;
  messageType: HeartPingMessageType;
  note?: string;
  sentAt: string;
  heroImageUrl?: string;
};

const copy: Record<HeartPingMessageType, { heading: string; body: string }> = {
  "miss-you": {
    heading: "Someone is missing you.",
    body: "No emergency. No complicated explanation. Just a small signal from someone who wished you were a little closer today.",
  },
  "love-you": {
    heading: "Something worth saying again.",
    body: "You are loved on the exciting days, the ordinary days, and all the quiet days in between.",
  },
  support: {
    heading: "Necky want has been officially declared.",
    body: "This is a soft, very dramatic little request for a neck massage. No pressure, no emergency, just one beloved neck asking politely for rescue.",
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderHeartPingEmail({
  senderName,
  recipientName,
  messageType,
  note,
  sentAt,
  heroImageUrl,
}: HeartPingEmailProps) {
  const message = copy[messageType];
  const imageBlock = heroImageUrl
    ? `<img src="${escapeHtml(heroImageUrl)}" alt="" style="display:block;width:100%;max-height:260px;object-fit:cover;border-radius:24px 24px 0 0;" />`
    : `<div style="height:190px;border-radius:24px 24px 0 0;background:linear-gradient(135deg,#2b0507,#7f1d1d 45%,#f5c0bd);"></div>`;

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
            <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:#f3d5c8;">Even on the heavy days, remind me why we keep choosing tomorrow.</p>
            <p style="margin:0;font-size:12px;line-height:1.55;color:#8b7a78;">This message may not be seen immediately. For anything urgent, contact the person directly or reach out to someone nearby.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getHeartPingSubject(messageType: HeartPingMessageType) {
  return HEART_PING_SUBJECTS[messageType];
}

export function renderHeartPingText({
  senderName,
  recipientName,
  messageType,
  note,
  sentAt,
}: HeartPingEmailProps) {
  const message = copy[messageType];
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
    "Even on the heavy days, remind me why we keep choosing tomorrow.",
    "This message may not be seen immediately. For anything urgent, contact the person directly or reach out to someone nearby.",
  ].filter(Boolean).join("\n");
}
