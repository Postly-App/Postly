import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import InvitationClient from "./InvitationClient"

export const dynamic = "force-dynamic"

type SearchParams = Promise<Record<string, never>>

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>
  searchParams: SearchParams
}) {
  const { token } = await params
  const session = await getServerSession(authOptions)

  const inv = await prisma.teamInvitation.findUnique({
    where: { token },
    include: { team: { select: { name: true } } },
  })

  const expired = !inv || inv.expiresAt.getTime() < Date.now()
  const wrongAccount =
    !!inv && !!session?.user?.email &&
    inv.email.toLowerCase() !== session.user.email.toLowerCase()

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: "var(--clr-bg)",
    }}>
      <div style={{
        maxWidth: 460,
        width: "100%",
        background: "var(--clr-card)",
        border: "1px solid var(--clr-border)",
        borderRadius: 20,
        padding: 32,
        textAlign: "center",
      }}>
        <InvitationClient
          token={token}
          teamName={inv?.team.name ?? null}
          invitationEmail={inv?.email ?? null}
          inviteRole={inv?.role ?? null}
          expired={expired}
          wrongAccount={wrongAccount}
          authenticated={!!session?.user?.id}
          currentEmail={session?.user?.email ?? null}
        />
      </div>
    </div>
  )
}
