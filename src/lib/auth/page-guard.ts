import { redirect } from "next/navigation";

import { hasAnyRole } from "@/lib/auth/roles";
import { requireServerSessionUser } from "@/lib/auth/session";
import type { AppRole, AppUser } from "@/lib/types/app";

export const requirePageUser = async (roles?: AppRole[]): Promise<AppUser> => {
  const user = await requireServerSessionUser();
  if (roles && roles.length > 0 && !hasAnyRole(user, roles)) {
    redirect("/");
  }
  return user;
};
