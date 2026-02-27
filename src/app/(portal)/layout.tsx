import { PortalShell } from "@/components/layout/PortalShell";
import { requirePageUser } from "@/lib/auth/page-guard";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();

  return <PortalShell user={user}>{children}</PortalShell>;
}
