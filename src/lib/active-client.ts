import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getActiveTeamForUser } from "@/lib/team"

const COOKIE_NAME = "postly_active_client"

/**
 * Lit le clientId actif depuis le cookie, le valide vs la team de l'user.
 * Retourne null si pas de cookie ou client invalide / inaccessible.
 */
export async function getActiveClientId(userId: string): Promise<string | null> {
  const jar = await cookies()
  const raw = jar.get(COOKIE_NAME)?.value
  if (!raw) return null

  const team = await getActiveTeamForUser(userId)
  if (!team) return null

  const client = await prisma.client.findFirst({
    where: { id: raw, teamId: team.id },
    select: { id: true },
  })
  return client?.id ?? null
}

export const ACTIVE_CLIENT_COOKIE = COOKIE_NAME
