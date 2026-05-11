import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

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

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Postly <onboarding@resend.dev>",
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FORGOT]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
