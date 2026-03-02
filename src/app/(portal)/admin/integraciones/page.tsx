import { IntegracionesPageClient } from "@/components/admin/IntegracionesPageClient";
import { requirePageUser } from "@/lib/auth/page-guard";

export default async function IntegracionesPage() {
  await requirePageUser(["SuperAdmin", "AdminLocal", "UsuarioPedidos"]);

  return <IntegracionesPageClient />;
}
