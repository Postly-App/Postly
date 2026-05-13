import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishPost } from "@/lib/social";
import { logger } from "@/lib/logger";
import { PUBLISH_STALE_PROCESSING_MS } from "@/lib/db/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const staleBefore = new Date(now.getTime() - PUBLISH_STALE_PROCESSING_MS);
  const due = await prisma.post.findMany({
    where: {
      OR: [
        { status: "SCHEDULED", scheduledAt: { lte: now } },
        {
          status: "PROCESSING",
          OR: [
            { processingStartedAt: { lte: staleBefore } },
            { processingStartedAt: null, updatedAt: { lte: staleBefore } },
          ],
        },
      ],
    },
    select: { id: true, userId: true },
    take: 50,
    orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
  });

  const settled = await Promise.allSettled(
    due.map((post) => publishPost(post.id, post.userId, { source: "cron" }))
  );

  let published = 0;
  let failed = 0;
  let skipped = 0;
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    if (r.status === "rejected") {
      failed++;
      continue;
    }
    const rows = r.value;
    if (rows.some((row) => row.skipped)) {
      skipped++;
      continue;
    }
    const allOk = rows.length > 0 && rows.every((row) => row.success);
    if (allOk) published++;
    else failed++;
  }

  logger.audit("cron.publish_scheduled.complete", {
    route: "/api/cron/publish-scheduled",
    processed: due.length,
    published,
    failed,
    skipped,
  });

  return NextResponse.json({
    processed: due.length,
    published,
    failed,
    skipped,
  });
}
