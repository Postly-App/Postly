import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const deleted = await prisma.apiKey.deleteMany({
    where: { id, userId: session.user.id },
  })
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Clé introuvable." }, { status: 404 })
  }
  logger.info("api_keys.revoked", {
    route: `/api/api-keys/${id}`,
    userId: session.user.id,
    keyId: id,
  })
  return NextResponse.json({ success: true })
}
