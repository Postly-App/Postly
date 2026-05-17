import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";
import { enforceRateLimit, getClientIp } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

    const ip = getClientIp(req);
    const ipBlock = await enforceRateLimit(
      "forgotIp",
      `ip:${ip}`,
      "Trop de demandes de réinitialisation. Réessayez plus tard."
    );
    if (ipBlock) return ipBlock;

    const emailKey = String(email).trim().toLowerCase();
    const emailBlock = await enforceRateLimit(
      "forgotEmail",
      `email:${emailKey}`,
      "Trop de demandes pour cette adresse e-mail. Réessayez plus tard."
    );
    if (emailBlock) return emailBlock;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ success: true });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { token, expires },
      create: { userId: user.id, token, expires },
    });

    const base = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${base}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const resend = getResend();
    if (!resend) {
      // Don't leak "Resend not configured" — return success to caller, log internally
      logger.warn("api.auth.forgot.email_skipped_no_resend", {
        route: "/api/auth/forgot",
        outcome: "email_provider_unconfigured",
      });
      return NextResponse.json({ success: true });
    }

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? process.env.RESEND_FROM ?? "Postly <onboarding@resend.dev>",
        to: email,
        subject: "Réinitialisation de votre mot de passe Postly",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
            <h2 style="color:#7C5CFC;">Réinitialiser votre mot de passe</h2>
            <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe. Ce lien expire dans 30 minutes.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#7C5CFC;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0;">
              Réinitialiser mon mot de passe
            </a>
            <p style="color:#999;font-size:0.85rem;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          </div>
        `,
      });
    } catch (sendErr) {
      // Email send failure shouldn't leak user existence either
      logger.error("api.auth.forgot.email_send_failed", {
        route: "/api/auth/forgot",
        err: sendErr,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("api.auth.forgot_failed", {
      route: "/api/auth/forgot",
      action: "POST",
      err: error,
    });
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
