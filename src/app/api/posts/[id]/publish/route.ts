import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { publishPost } from "@/lib/social"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const results = await publishPost(id, session.user.id)
    const hasFailures = results.some((r) => !r.success)

    return NextResponse.json({
      success: !hasFailures,
      results,
    })
  } catch (error) {
    console.error("[PUBLISH]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur." },
      { status: 500 }
    )
  }
}
