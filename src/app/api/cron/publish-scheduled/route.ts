import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    include: { socialAccount: true },
    take: 50,
  });

  const results = await Promise.allSettled(
    due.map(async (post) => {
      try {
        // TODO: dispatch to provider-specific publisher
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "PUBLISHED", publishedAt: new Date() },
        });
        return { id: post.id, ok: true };
      } catch (err) {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "FAILED", errorMessage: (err as Error).message },
        });
        throw err;
      }
    })
  );

  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  });
}
