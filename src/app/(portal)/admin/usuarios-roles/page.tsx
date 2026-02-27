import { UsersRolesPageClient } from "@/components/admin/UsersRolesPageClient";
import { requirePageUser } from "@/lib/auth/page-guard";

export default async function UsuariosRolesPage() {
  await requirePageUser(["SuperAdmin", "AdminLocal"]);

  return <UsersRolesPageClient />;
}
