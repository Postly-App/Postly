import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import DataClient from "./DataClient"

export const dynamic = "force-dynamic"
export const metadata = { title: "Mes données — Postly" }

export default async function DataPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  return <DataClient userEmail={session.user.email ?? ""} />
}
