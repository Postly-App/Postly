import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getUserActivePlan } from "@/lib/plan-limits"
import SuccessClient from "./SuccessClient"

export const dynamic = "force-dynamic"

type SearchParams = Promise<{ plan?: string; session_id?: string }>

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const params = await searchParams
  const requestedPlan = (params.plan ?? "pro").toUpperCase()

  // Lis le plan réel en DB (le webhook a déjà tourné après le redirect Stripe)
  const realPlan = await getUserActivePlan(session.user.id)

  const planDisplayed =
    realPlan === "PRO" || realPlan === "AGENCY"
      ? realPlan
      : requestedPlan === "AGENCY"
        ? "AGENCY"
        : "PRO"

  return <SuccessClient plan={planDisplayed} userName={session.user.name ?? null} />
}
