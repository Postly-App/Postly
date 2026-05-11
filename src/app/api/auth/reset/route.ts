import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, email, password } = await req.json();
    if (!token || !email || !password)
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });

    if (password.length < 8)
      return NextResponse.json({ error: "Mot de passe trop court (8 car. min)." }, { status: 400 });

    const record = await prisma.passwordResetToken.findFirst({
      where: { token, user: { email } },
    });

    if (!record) return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
    if (record.expires < new Date()) return NextResponse.json({ error: "Lien expiré." }, { status: 400 });

    const hash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { email }, data: { password: hash } });
    await prisma.passwordResetToken.delete({ where: { id: record.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RESET]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
