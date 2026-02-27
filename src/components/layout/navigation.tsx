import {
  CheckmarkCircle24Regular,
  Box24Regular,
  ClipboardTask24Regular,
  DatabaseSearch24Regular,
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
    href: "/admin/catalogos",
    label: "Admin Catálogos",
    icon: <DatabaseSearch24Regular />,
    roles: ["SuperAdmin", "AdminLocal"],
  },
  {
    href: "/admin/usuarios-roles",
    label: "Admin Usuarios",
    icon: <PeopleTeam24Regular />,
    roles: ["SuperAdmin", "AdminLocal"],
  },
];
