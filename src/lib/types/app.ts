export const APP_ROLES = [
  "SuperAdmin",
  "AdminLocal",
  "UsuarioPedidos",
  "UsuarioFinal",
  "OperarioBodega",
  "InspectorCalidad",
  "TecnicoMantenimiento",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export interface AppUser {
  id: string;
  tenantId?: string;
  name: string;
  email?: string;
  roles: AppRole[];
  sedeIds: string[];
  preferredSedeId?: string;
}

export interface SessionPayload {
  user: AppUser;
  exp: number;
}

export interface DashboardCard {
  id: string;
  title: string;
  description: string;
  href: string;
  count: number;
}

export interface PendingItem {
  id: string;
  tipo: "Pedido" | "AjusteInventario" | "Ticket" | "Calidad";
  titulo: string;
  estado: string;
  fecha: string;
  href: string;
}

export interface ApiError {
  error: string;
  details?: string;
}
