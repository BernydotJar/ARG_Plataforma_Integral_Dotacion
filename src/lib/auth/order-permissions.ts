import type { AppRole } from "@/lib/types/app";

// Alcance Sept 2026: los colaboradores son registros y firmantes, no operadores de pedidos.
export const ORDER_READ_ROLES = ["SuperAdmin", "AdminLocal", "UsuarioPedidos"] satisfies AppRole[];
export const ORDER_MUTATE_ROLES = ["SuperAdmin", "AdminLocal"] satisfies AppRole[];
