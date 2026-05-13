import type { SocialAccount } from "@prisma/client"
import type { PublishContext } from "../../types"
import { ensureFreshAccessToken } from "../token-refresh"
import {
  fetchWithTimeout,
  PUBLISH_FETCH_TIMEOUT_MS,
  providerHttpErrorFromStatus,
  withPublishRetry,
} from "../retry-policy"

const API = "https://api.linkedin.com/v2"

export async function publishLinkedInMember(
  account: SocialAccount,
  ctx: PublishContext
): Promise<{ remoteId: string }> {
  const acc = await ensureFreshAccessToken("LINKEDIN", account)
  const authorUrn = acc.accountId.startsWith("urn:li:")
    ? acc.accountId
    : `urn:li:person:${acc.accountId}`

  const body = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: ctx.content.slice(0, 3000) },
        shareMediaCategory: "NONE" as const,
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  }

  const json = await withPublishRetry(
    async () => {
      const res = await fetchWithTimeout(
        `${API}/ugcPosts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${acc.accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": "202401",
          },
          body: JSON.stringify(body),
        },
        PUBLISH_FETCH_TIMEOUT_MS
      )
      const raw = await res.text()
      if (!res.ok) throw providerHttpErrorFromStatus("LinkedIn", res.status, raw.slice(0, 400))
      return JSON.parse(raw) as { id?: string }
    },
    { maxAttempts: 3, baseDelayMs: 600 }
  )

  if (!json.id) throw new Error("LinkedIn : pas d’URN de publication retourné.")
  return { remoteId: json.id }
}
