import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishPost } from "@/lib/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const due = await prisma.post.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: now } },
    select: { id: true, userId: true },
    take: 50,
  });

  const settled = await Promise.allSettled(
    due.map((post) => publishPost(post.id, post.userId))
  );

  let published = 0;
  let failed = 0;
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    if (r.status === "rejected") {
      failed++;
      continue;
    }
    const allOk =
      r.value.length > 0 && r.value.every((row) => row.success);
    if (allOk) published++;
    else failed++;
  }

  return NextResponse.json({
    processed: due.length,
    published,
    failed,
  });
}
