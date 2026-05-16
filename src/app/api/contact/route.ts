import { NextResponse } from "next/server";
import { Resend } from "resend";
import { enforceRateLimit, getClientIp } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const TO = "support@getpostly.space";
const FROM = process.env.RESEND_FROM ?? "Postly <onboarding@resend.dev>";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function sanitize(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = await enforceRateLimit(
    "contactIp",
    `ip:${ip}`,
    "Trop de messages. Réessayez plus tard."
  );
  if (limited) return limited;

  let body: { name?: unknown; email?: unknown; subject?: unknown; message?: unknown; website?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const name = sanitize(body.name, 120);
  const email = sanitize(body.email, 200);
  const subject = sanitize(body.subject, 200);
  const message = sanitize(body.message, 4000);

  if (!name || !email || !subject || message.length < 10) {
    return NextResponse.json(
      { error: "Nom, email, sujet et message (10 caractères min.) sont requis." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }

  const resend = getResend();
  if (!resend) {
    return NextResponse.json(
      { error: "Envoi d’e-mails non configuré (RESEND_API_KEY)." },
      { status: 503 }
    );
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `[Postly Contact] ${subject}`,
      html: `<p><strong>Nom</strong> : ${escapeHtml(name)}</p>
<p><strong>Email</strong> : ${escapeHtml(email)}</p>
<p><strong>Message</strong></p><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("api.contact.send_failed", { err: e });
    return NextResponse.json({ error: "Impossible d’envoyer le message." }, { status: 502 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
