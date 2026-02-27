"use client";

import {
  Badge,
  Button,
  Divider,
  OverlayDrawer,
  Text,
  Tooltip,
} from "@fluentui/react-components";
import { Dismiss24Regular, Navigation24Regular, SignOut24Regular } from "@fluentui/react-icons";
import Image from "next/image";
import { useMemo, useState } from "react";

import type { AppRole, AppUser } from "../../lib/types";
import { navItems } from "./navigation";

interface PortalShellProps {
  user: AppUser;
  children: React.ReactNode;
  activeKey?: string;
}

const ROLE_DISPLAY_NAMES: Record<AppRole, string> = {
  SuperAdmin: "SuperAdmin",
  AdminLocal: "AdminLocal",
  UsuarioPedidos: "UsuarioPedidos",
  UsuarioFinal: "UsuarioFinal",
  OperarioBodega: "OperarioBodega",
  InspectorCalidad: "InspectorCalidad",
  TecnicoMantenimiento: "TecnicoMantenimiento",
};

const formatSedeName = (sedeId: string): string => {
  if (sedeId === "*") return "Todas";
  return sedeId
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function PortalShell({ user, children, activeKey = "inicio" }: PortalShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const roleLabel = useMemo(
    () => user.roles.map((role) => ROLE_DISPLAY_NAMES[role] ?? role).join(", "),
    [user.roles],
  );

  const sedeLabel = useMemo(() => {
    if (user.sedeIds.includes("*")) return "Todas";
    return user.sedeIds.map(formatSedeName).join(", ");
  }, [user.sedeIds]);

  const closeDrawer = () => setDrawerOpen(false);

  const renderNav = (onItemClick?: () => void) => (
    <nav className="portal-nav-list" aria-label="Navegación principal">
      {navItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`portal-nav-link ${item.key === activeKey ? "active" : ""}`}
          onClick={onItemClick}
        >
          <span aria-hidden="true">{item.icon}</span>
          <Text className="portal-nav-link-label">{item.label}</Text>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="portal-shell">
      <OverlayDrawer
        position="start"
        open={drawerOpen}
        onOpenChange={(_, data) => setDrawerOpen(data.open)}
        className="portal-drawer"
      >
        <div className="portal-drawer-header">
          <Text weight="semibold">Navegación</Text>
          <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={closeDrawer} aria-label="Cerrar menú" />
        </div>
        {renderNav(closeDrawer)}
      </OverlayDrawer>

      <aside className="portal-sidebar">
        <div className="portal-brand">
          <div>
            <div className="portal-brand-logo-wrap">
              <Image src="/argos-logo.webp" alt="Argos" width={116} height={40} className="portal-brand-logo" priority />
            </div>
            <div className="portal-brand-text">
              <Text weight="semibold" block>
                ARGOS
              </Text>
              <Text size={200} className="portal-brand-caption" block>
                Plataforma Integral
              </Text>
            </div>
          </div>
        </div>

        {renderNav()}
      </aside>

      <div className="portal-main-wrap">
        <header className="portal-topbar">
          <div className="portal-topbar-left">
            <Button
              appearance="subtle"
              icon={<Navigation24Regular />}
              onClick={() => setDrawerOpen(true)}
              className="only-mobile"
              aria-label="Abrir menú"
            />
            <div>
              <Text weight="semibold" block>
                ARGOS - Plataforma Integral
              </Text>
              <Text size={200} className="muted-text" block>
                Sede: {sedeLabel}
              </Text>
            </div>
          </div>

          <div className="portal-topbar-right">
            <Badge appearance="tint" color="informative">
              {roleLabel}
            </Badge>
            <Tooltip content="Cerrar sesión" relationship="label">
              <Button appearance="subtle" icon={<SignOut24Regular />} aria-label="Cerrar sesión" />
            </Tooltip>
          </div>
        </header>

        <Divider />

        <main className="portal-main">{children}</main>
      </div>
    </div>
  );
}
