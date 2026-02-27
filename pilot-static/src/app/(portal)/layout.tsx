import { PortalShell } from "@/components/layout/PortalShell";
import { demoUser } from "@/lib/mock-data";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell user={demoUser}>{children}</PortalShell>;
}
