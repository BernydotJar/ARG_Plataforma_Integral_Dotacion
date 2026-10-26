import type { AppRole } from "@/lib/types/app";

// September 2026 baseline: inventory belongs to Super Administrators and
// Administradores Locales. Legacy OperarioBodega is not an authorized business role.
export const INVENTORY_ROLES = ["SuperAdmin", "AdminLocal"] satisfies AppRole[];
