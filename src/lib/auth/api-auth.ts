import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { hasAnyRole } from "@/lib/auth/roles";
import type { AppRole, AppUser } from "@/lib/types/app";

export const requireApiUser = async (
  request: NextRequest,
  allowedRoles?: AppRole[],
): Promise<{ user: AppUser } | { response: NextResponse }> => {
  const user = await getRequestSessionUser(request);
  if (!user) {
    return {
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasAnyRole(user, allowedRoles)) {
    return {
      response: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    };
  }

  return { user };
};
