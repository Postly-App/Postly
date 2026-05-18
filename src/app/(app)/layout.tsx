import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getUserPlanContext } from "@/lib/plan-limits";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const planContext = await getUserPlanContext(session.user.id);

  return (
    <AppShell user={session.user} planContext={planContext}>
      {children}
    </AppShell>
  );
}
