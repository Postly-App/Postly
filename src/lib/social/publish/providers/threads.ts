import type { SocialAccount } from "@prisma/client"
import type { PublishContext } from "../../types"
import { ensureFreshAccessToken } from "../token-refresh"
import { withRetry } from "../retry"

const GRAPH = "https://graph.threads.net/v1.0"

export async function publishThreads(
  account: SocialAccount,
  ctx: PublishContext
): Promise<{ remoteId: string }> {
  const acc = await ensureFreshAccessToken("THREADS", account)
  const userId = acc.accountId
  const token = acc.accessToken
  const text = ctx.content.slice(0, 500)

  const createParams = new URLSearchParams({
    media_type: "TEXT",
    text,
    access_token: token,
  })

  const create = await withRetry(
    async () => {
      const res = await fetch(`${GRAPH}/${userId}/threads?${createParams.toString()}`, {
        method: "POST",
      })
      const raw = await res.text()
      if (!res.ok) throw new Error(`Threads HTTP ${res.status} : ${raw.slice(0, 800)}`)
      return JSON.parse(raw) as { id?: string; error?: { message: string } }
    },
    { retries: 2, baseDelayMs: 600 }
  )

  if (create.error?.message) throw new Error(create.error.message)
  if (!create.id) throw new Error("Threads : création du brouillon échouée.")

  const pubParams = new URLSearchParams({
    creation_id: create.id,
    access_token: token,
  })

  const pub = await withRetry(
    async () => {
      const res = await fetch(`${GRAPH}/${userId}/threads_publish?${pubParams.toString()}`, {
        method: "POST",
      })
      const raw = await res.text()
      if (!res.ok) throw new Error(`Threads publish HTTP ${res.status} : ${raw.slice(0, 800)}`)
      return JSON.parse(raw) as { id?: string; error?: { message: string } }
    },
    { retries: 2, baseDelayMs: 600 }
  )

  if (pub.error?.message) throw new Error(pub.error.message)
  if (!pub.id) throw new Error("Threads : publication sans identifiant retourné.")
  return { remoteId: pub.id }
}
