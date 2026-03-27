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
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { hasAnyRole } from "@/lib/auth/roles";
import type { AppRole, AppUser } from "@/lib/types/app";

import { navItems } from "./navigation";

interface PortalShellProps {
  user: AppUser;
  children: React.ReactNode;
}

const isRouteActive = (pathname: string, href: string): boolean => {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
};

const ROLE_DISPLAY_NAMES: Record<AppRole, string> = {
  SuperAdmin: "Administrador Global",
  AdminLocal: "Admin de Sede",
  UsuarioPedidos: "Gestor de Pedidos",
  UsuarioFinal: "Usuario",
  OperarioBodega: "Operario de Bodega",
  InspectorCalidad: "Inspector de Calidad",
  TecnicoMantenimiento: "Técnico de Mantenimiento",
};

const NAV_TOUR_TARGET_BY_ROUTE: Record<string, string> = {
  "/": "nav-inicio",
  "/pedidos": "nav-pedidos",
  "/inventario": "nav-inventario",
  "/calidad": "nav-calidad",
  "/mantenimiento": "nav-mantenimiento",
  "/admin/integraciones": "nav-integraciones",
  "/admin/usuarios-roles": "nav-admin-usuarios",
  "/asistente-rag": "nav-rag",
};

const AppTour = dynamic(() => import("@/components/tour/AppTour").then((module) => module.AppTour), {
  ssr: false,
});

const formatSedeName = (sedeId: string): string =>
  sedeId
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const repoBasePath = process.env.NODE_ENV === "production" ? "/ARG_Plataforma_Integral_Dotacion" : "";
const logoSrc = `${repoBasePath}/argos-logo.webp`;

export function PortalShell({ user, children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourRunKey, setTourRunKey] = useState(0);

  const allowedItems = useMemo(
    () => navItems.filter((item) => !item.roles || hasAnyRole(user, item.roles)),
    [user],
  );

  const activeNav = useMemo(
    () => allowedItems.find((item) => isRouteActive(pathname, item.href)),
    [allowedItems, pathname],
  );

  const roleLabel = useMemo(
    () => user.roles.map((role) => ROLE_DISPLAY_NAMES[role] ?? role).join(", "),
    [user.roles],
  );

  const sedeLabel = useMemo(() => {
    if (user.sedeIds.includes("*")) return "Todas las sedes";
    return user.sedeIds.map(formatSedeName).join(", ");
  }, [user.sedeIds]);

  const closeDrawer = () => setDrawerOpen(false);

  const startTour = () => {
    setTourRunKey((value) => value + 1);
    setTourOpen(true);
  };

  const clearOfflineCache = () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.controller?.postMessage({ type: "ARGOS_CLEAR_CACHE" });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    clearOfflineCache();

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setIsLoggingOut(false);
      router.push("/login");
      router.refresh();
    }
  };

  const renderNav = (onItemClick?: () => void) => (
    <nav className="portal-nav-list" aria-label="Navegación principal">
      {allowedItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`portal-nav-link ${isRouteActive(pathname, item.href) ? "active" : ""}`}
          data-tour={NAV_TOUR_TARGET_BY_ROUTE[item.href]}
          onClick={onItemClick}
        >
          <span aria-hidden="true">{item.icon}</span>
          <Text className="portal-nav-link-label">{item.label}</Text>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="portal-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
      <OverlayDrawer
        position="start"
        open={drawerOpen}
        onOpenChange={(_, data) => setDrawerOpen(data.open)}
        className="portal-drawer"
      >
        <div className="portal-drawer-header">
          <Text weight="semibold">Navegación</Text>
          <Button className="touch-icon-button" appearance="subtle" icon={<Dismiss24Regular />} onClick={closeDrawer} aria-label="Cerrar menú" />
        </div>
        {renderNav(closeDrawer)}
      </OverlayDrawer>

      <aside className="portal-sidebar">
        <div className="portal-brand">
          <div>
            <div className="portal-brand-logo-wrap">
              <Image src={logoSrc} alt="Argos" width={302} height={166} className="portal-brand-logo" priority />
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
        <header className="portal-topbar" data-tour="topbar">
          <div className="portal-topbar-left">
            <Button
              appearance="subtle"
              icon={<Navigation24Regular />}
              onClick={() => setDrawerOpen(true)}
              className="only-mobile touch-icon-button"
              aria-label="Abrir menú"
            />
            <div>
              <Text weight="semibold" block>
                {activeNav?.label ?? "ARGOS"}
              </Text>
              <Text size={200} className="muted-text" block>
                Sedes: {sedeLabel}
              </Text>
            </div>
          </div>

          <div className="portal-topbar-right">
            <Tooltip content="Tour guiado" relationship="label">
              <Button
                appearance="subtle"
                className="touch-action-button"
                data-tour="tour-toggle"
                onClick={startTour}
              >
                Tour
              </Button>
            </Tooltip>
            <Badge appearance="tint" color="informative" className="portal-role-badge">
              {roleLabel}
            </Badge>
            <Tooltip content="Cerrar sesión" relationship="label">
              <Button
                className="touch-icon-button"
                appearance="subtle"
                icon={<SignOut24Regular />}
                disabled={isLoggingOut}
                onClick={handleLogout}
                aria-label="Cerrar sesión"
              />
            </Tooltip>
          </div>
        </header>

        <Divider />

        <main id="main-content" className="portal-main" tabIndex={-1}>{children}</main>
      </div>

      {tourOpen ? <AppTour key={tourRunKey} pathname={pathname} userKey={user.email} onClose={() => setTourOpen(false)} /> : null}
    </div>
  );
}
