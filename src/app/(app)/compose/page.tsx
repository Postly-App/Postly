import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizePlatformId } from "@/lib/platforms";
import { getUserActivePlan, PLAN_LIMITS } from "@/lib/plan-limits";
import { isAiChatConfigured } from "@/lib/ai/chat";
import StudioClient from "./StudioClient";

export const dynamic = "force-dynamic";

interface SearchParams {
  id?: string;
}

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const params = await searchParams;
  const requestedId = params.id?.trim();

  const plan = await getUserActivePlan(userId);
  const aiEnabled = isAiChatConfigured() && PLAN_LIMITS[plan].aiAssistant;

  const [connectedAccounts, requestedDraft, latestDraft] = await Promise.all([
    prisma.socialAccount.findMany({
      where: { userId },
      select: { platform: true, accountName: true },
      orderBy: { updatedAt: "desc" },
    }),
    // If user navigated with ?id=xxx, load that specific post
    requestedId
      ? prisma.post.findFirst({
          where: { id: requestedId, userId },
          select: {
            id: true,
            content: true,
            platforms: true,
            mediaUrls: true,
            scheduledAt: true,
            status: true,
            updatedAt: true,
          },
        })
      : Promise.resolve(null),
    // Most recent DRAFT to offer resume (only if no requestedId)
    requestedId
      ? Promise.resolve(null)
      : prisma.post.findFirst({
          where: { userId, status: "DRAFT" },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            content: true,
            platforms: true,
            mediaUrls: true,
            scheduledAt: true,
            updatedAt: true,
          },
        }),
  ]);

  // Normalize platforms on connected accounts (legacy ids tolerated)
  const connectedPlatforms = Array.from(
    new Set(
      connectedAccounts
        .map((a) => normalizePlatformId(a.platform))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
    )
  );

  // Initial state passed to client
  const initialDraft = requestedDraft
    ? {
        id: requestedDraft.id,
        content: requestedDraft.content,
        platforms: requestedDraft.platforms
          .map((p) => normalizePlatformId(p))
          .filter((p): p is NonNullable<typeof p> => Boolean(p)),
        mediaUrls: requestedDraft.mediaUrls,
        scheduledAt: requestedDraft.scheduledAt?.toISOString() ?? null,
        status: requestedDraft.status,
        updatedAt: requestedDraft.updatedAt.toISOString(),
      }
    : null;

  const resumableDraft =
    !initialDraft && latestDraft && (latestDraft.content?.trim() || latestDraft.mediaUrls.length > 0)
      ? {
          id: latestDraft.id,
          content: latestDraft.content,
          platforms: latestDraft.platforms
            .map((p) => normalizePlatformId(p))
            .filter((p): p is NonNullable<typeof p> => Boolean(p)),
          mediaUrls: latestDraft.mediaUrls,
          scheduledAt: latestDraft.scheduledAt?.toISOString() ?? null,
          updatedAt: latestDraft.updatedAt.toISOString(),
        }
      : null;

  return (
    <StudioClient
      user={{
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      }}
      connectedPlatforms={connectedPlatforms}
      connectedAccounts={connectedAccounts.map((a) => ({
        platform: normalizePlatformId(a.platform) ?? a.platform,
        accountName: a.accountName,
      }))}
      aiEnabled={aiEnabled}
      plan={plan}
      initialDraft={initialDraft}
      resumableDraft={resumableDraft}
    />
  );
}
