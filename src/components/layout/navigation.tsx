import {
  ArrowSync24Regular,
  Box24Regular,
  CheckmarkCircle24Regular,
  ClipboardTask24Regular,
  DatabaseSearch24Regular,
  Chat24Regular,
  Home24Regular,
  PeopleTeam24Regular,
  Wrench24Regular,
} from "@fluentui/react-icons";

import type { AppRole } from "@/lib/types/app";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: AppRole[];
}

export const navItems: NavItem[] = [
  {
    href: "/",
    label: "Inicio",
    icon: <Home24Regular />,
  },
  {
    href: "/pedidos",
    label: "Dotación / Pedidos",
    icon: <ClipboardTask24Regular />,
    roles: ["SuperAdmin", "AdminLocal", "UsuarioPedidos", "UsuarioFinal"],
  },
  {
    href: "/inventario",
    label: "Inventario",
    icon: <Box24Regular />,
    roles: ["SuperAdmin", "AdminLocal", "OperarioBodega"],
  },
  {
    href: "/calidad",
    label: "Calidad",
    icon: <CheckmarkCircle24Regular />,
    roles: ["SuperAdmin", "AdminLocal", "InspectorCalidad"],
  },
  {
    href: "/mantenimiento",
    label: "Mantenimiento",
    icon: <Wrench24Regular />,
    roles: ["SuperAdmin", "AdminLocal", "TecnicoMantenimiento"],
  },
  {
    href: "/asistente-rag",
    label: "Asistente RAG",
    icon: <Chat24Regular />,
  },
  {
    href: "/admin/catalogos",
    label: "Admin Catálogos",
    icon: <DatabaseSearch24Regular />,
    roles: ["SuperAdmin", "AdminLocal"],
  },
  {
    href: "/admin/integraciones",
    label: "Integraciones",
    icon: <ArrowSync24Regular />,
    roles: ["SuperAdmin", "AdminLocal", "UsuarioPedidos"],
  },
  {
    href: "/admin/usuarios-roles",
    label: "Admin Usuarios",
    icon: <PeopleTeam24Regular />,
    roles: ["SuperAdmin", "AdminLocal"],
  },
];
