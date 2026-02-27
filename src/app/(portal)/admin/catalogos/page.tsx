import { CatalogosPageClient } from "@/components/admin/CatalogosPageClient";
import { requirePageUser } from "@/lib/auth/page-guard";

export default async function CatalogosPage() {
  await requirePageUser(["SuperAdmin", "AdminLocal"]);

  return <CatalogosPageClient />;
}
