import {
  Box24Regular,
  CheckmarkCircle24Regular,
  ClipboardTask24Regular,
  DatabaseSearch24Regular,
  Home24Regular,
  PeopleTeam24Regular,
  Wrench24Regular,
} from "@fluentui/react-icons";

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

export const navItems: NavItem[] = [
  { key: "inicio", label: "Inicio", icon: <Home24Regular /> },
  { key: "pedidos", label: "Dotación / Pedidos", icon: <ClipboardTask24Regular /> },
  { key: "inventario", label: "Inventario", icon: <Box24Regular /> },
  { key: "calidad", label: "Calidad", icon: <CheckmarkCircle24Regular /> },
  { key: "mantenimiento", label: "Mantenimiento", icon: <Wrench24Regular /> },
  { key: "catalogos", label: "Admin Catálogos", icon: <DatabaseSearch24Regular /> },
  { key: "usuarios", label: "Admin Usuarios", icon: <PeopleTeam24Regular /> },
];
