import { access } from "node:fs/promises";
import path from "node:path";
import tls from "node:tls";
import { NextRequest, NextResponse } from "next/server";
import { renderHeartPingEmail, getHeartPingSubject, renderHeartPingText } from "../../../../emails/heart-ping-email";
import {
  HEART_PING_PEOPLE,
  getHeartPingRecipient,
  type HeartPingMessageType,
  type HeartPingRequest,
  type HeartPingSender,
} from "../../../../lib/heart-ping/types";
import {
  checkFailedAttemptLimit,
  checkHeartPingRateLimit,
  getIdempotentSend,
  recordFailedAttempt,
  recordHeartPingSend,
  recordIdempotentSend,
} from "../../../../lib/heart-ping/rate-limit";

export const dynamic = "force-dynamic";

const SEND_ERROR = "The message could not be sent. Please try again in a little while.";
const RATE_LIMIT_ERROR = "This little envelope needs a moment before it can travel again.";

function sanitizeNote(note: string) {
  return note.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim().slice(0, 300);
}

function validateBody(body: unknown): HeartPingRequest | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid request." };
  }

  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.some((key) => !["sender", "messageType", "note"].includes(key))) {
    return { error: "Invalid request." };
  }

  if (record.sender !== "atna" && record.sender !== "nora") {
    return { error: "Invalid request." };
  }

  if (
    record.messageType !== "miss-you" &&
    record.messageType !== "love-you" &&
    record.messageType !== "support"
  ) {
    return { error: "Invalid request." };
  }

  if (record.note !== undefined && typeof record.note !== "string") {
    return { error: "Invalid request." };
  }

  const rawNote = typeof record.note === "string" ? record.note.trim() : undefined;
  if (rawNote && rawNote.length > 300) {
    return { error: "Invalid request." };
  }
  const note = rawNote ? sanitizeNote(rawNote) : undefined;

  return {
    sender: record.sender as HeartPingSender,
    messageType: record.messageType as HeartPingMessageType,
    ...(note ? { note } : {}),
  };
}

function getClientIdentity(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function getRecipientEmail(sender: HeartPingSender) {
  return sender === "atna" ? process.env.HEART_PING_NORA_EMAIL : process.env.HEART_PING_ATNA_EMAIL;
}

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === request.nextUrl.origin) return true;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return false;

  try {
    return origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}

async function getHeroImageUrl(messageType: HeartPingMessageType) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!appUrl || appUrl.includes("localhost")) return undefined;

  const imageName = messageType === "miss-you" ? "miss-you" : messageType;
  const imagePath = path.join(process.cwd(), "public", "images", "atna", "heart-ping", `${imageName}.jpg`);

  try {
    await access(imagePath);
    return `${appUrl}/images/atna/heart-ping/${imageName}.jpg`;
  } catch {
    return undefined;
  }
}

async function sendWithResend({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.HEART_PING_FROM_EMAIL;
  if (!apiKey || !from) return { ok: false, id: undefined };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "noraflix-heart-ping/1.0",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    if (process.env.NODE_ENV !== "production") {
      console.info("heart_ping_resend_error", {
        status: response.status,
        body: errorBody,
      });
    }
    return { ok: false, id: undefined };
  }
  const result = (await response.json().catch(() => ({}))) as { id?: string };
  return { ok: true, id: result.id };
}

function escapeHeader(value: string) {
  return value.replace(/[\r\n]/g, " ").trim();
}

function dotStuff(value: string) {
  return value.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function buildMimeMessage({
  from,
  to,
  subject,
  html,
  text,
}: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const boundary = `heart-ping-${crypto.randomUUID()}`;
  return [
    `From: NoraFlix Heart Ping <${escapeHeader(from)}>`,
    `To: ${escapeHeader(to)}`,
    `Subject: ${escapeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

async function sendWithGmailSmtp({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const user = process.env.GMAIL_SMTP_USER;
  const password = process.env.GMAIL_SMTP_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !password) return { ok: false, id: undefined };

  const message = buildMimeMessage({ from: user, to, subject, html, text });
  const auth = Buffer.from(`\0${user}\0${password}`).toString("base64");

  return new Promise<{ ok: boolean; id?: string }>((resolve) => {
    const socket = tls.connect({
      host: "smtp.gmail.com",
      port: 465,
      servername: "smtp.gmail.com",
      rejectUnauthorized: true,
    });
    let buffer = "";
    let settled = false;

    const close = (result: { ok: boolean; id?: string }) => {
      if (settled) return;
      settled = true;
      socket.end();
      resolve(result);
    };

    const readResponse = () =>
      new Promise<string>((resolveStep) => {
        const onData = (chunk: Buffer) => {
          buffer += chunk.toString("utf8");
          const lines = buffer.split(/\r?\n/).filter(Boolean);
          const last = lines[lines.length - 1];
          if (!last || !/^\d{3} /.test(last)) return;
          socket.off("data", onData);
          buffer = "";
          resolveStep(last);
        };
        socket.on("data", onData);
      });

    const command = async (expected: number | number[], nextCommand?: string) => {
      const response = await readResponse();
      const expectedCodes = Array.isArray(expected) ? expected : [expected];
      const code = Number(response.slice(0, 3));

      if (!expectedCodes.includes(code)) {
        if (process.env.NODE_ENV !== "production") {
          console.info("heart_ping_gmail_smtp_error", { code, response });
        }
        return false;
      }

      if (nextCommand) socket.write(`${nextCommand}\r\n`);
      return true;
    };

    socket.setTimeout(20000, () => close({ ok: false }));
    socket.on("error", (error) => {
      if (process.env.NODE_ENV !== "production") {
        console.info("heart_ping_gmail_smtp_error", { message: error.message });
      }
      close({ ok: false });
    });

    socket.on("secureConnect", async () => {
      const steps = [
        await command(220, "EHLO localhost"),
        await command(250, `AUTH PLAIN ${auth}`),
        await command(235, `MAIL FROM:<${user}>`),
        await command(250, `RCPT TO:<${to}>`),
        await command(250, "DATA"),
        await command(354, `${dotStuff(message)}\r\n.`),
        await command(250, "QUIT"),
      ];
      close(steps.every(Boolean) ? { ok: true, id: crypto.randomUUID() } : { ok: false });
    });
  });
}

export async function POST(request: NextRequest) {
  const identity = getClientIdentity(request);

  if (!isAllowedOrigin(request)) {
    recordFailedAttempt(identity);
    return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  }

  if (!checkFailedAttemptLimit(identity)) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2048) {
    recordFailedAttempt(identity);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const idempotencyKey = request.headers.get("x-heart-ping-idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > 120) {
    recordFailedAttempt(identity);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const existingSendId = getIdempotentSend(idempotencyKey);
  if (existingSendId) {
    return NextResponse.json({ ok: true, sendId: existingSendId, duplicate: true });
  }

  const body = validateBody(await request.json().catch(() => null));
  if ("error" in body) {
    recordFailedAttempt(identity);
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const rateLimit = checkHeartPingRateLimit(body.sender, identity);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 });
  }

  const recipient = getHeartPingRecipient(body.sender);
  const recipientEmail = getRecipientEmail(body.sender);
  if (!recipientEmail) {
    return NextResponse.json({ error: SEND_ERROR }, { status: 503 });
  }

  const senderName = HEART_PING_PEOPLE[body.sender].name;
  const recipientName = HEART_PING_PEOPLE[recipient].name;
  const sentAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(new Date());

  const html = renderHeartPingEmail({
    senderName,
    recipientName,
    messageType: body.messageType,
    note: body.note,
    sentAt,
    heroImageUrl: await getHeroImageUrl(body.messageType),
  });
  const text = renderHeartPingText({
    senderName,
    recipientName,
    messageType: body.messageType,
    note: body.note,
    sentAt,
  });

  const result = await sendWithGmailSmtp({
    to: recipientEmail,
    subject: getHeartPingSubject(body.messageType),
    html,
    text,
  }).then((gmailResult) =>
    gmailResult.ok
      ? gmailResult
      : sendWithResend({
          to: recipientEmail,
          subject: getHeartPingSubject(body.messageType),
          html,
          text,
        }),
  );

  if (!result.ok) {
    console.info("heart_ping_send", {
      sender: body.sender,
      messageType: body.messageType,
      status: "failed",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: SEND_ERROR }, { status: 502 });
  }

  const sendId = result.id ?? crypto.randomUUID();
  recordHeartPingSend(body.sender, identity);
  recordIdempotentSend(idempotencyKey, sendId);

  console.info("heart_ping_send", {
    sendId,
    sender: body.sender,
    messageType: body.messageType,
    status: "sent",
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, sendId });
}
