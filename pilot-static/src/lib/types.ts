export type AppRole =
  | "SuperAdmin"
  | "AdminLocal"
  | "UsuarioPedidos"
  | "UsuarioFinal"
  | "OperarioBodega"
  | "InspectorCalidad"
  | "TecnicoMantenimiento";

export interface AppUser {
  id: string;
  name: string;
  roles: AppRole[];
  sedeIds: string[];
}

export interface DashboardCard {
  id: string;
  title: string;
  description: string;
  count: number;
}

export interface PendingItem {
  id: string;
  tipo: string;
  titulo: string;
  estado: string;
  fecha: string;
}
