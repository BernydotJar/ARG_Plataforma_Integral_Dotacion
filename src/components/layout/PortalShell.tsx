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
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { hasAnyRole } from "@/lib/auth/roles";
import type { AppUser } from "@/lib/types/app";

import { navItems } from "./navigation";

interface PortalShellProps {
  user: AppUser;
  children: React.ReactNode;
}

const isRouteActive = (pathname: string, href: string): boolean => {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
};

export function PortalShell({ user, children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const allowedItems = useMemo(
    () => navItems.filter((item) => !item.roles || hasAnyRole(user, item.roles)),
    [user],
  );

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

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

  return (
    <div className="portal-shell">
      <OverlayDrawer
        position="start"
        open={drawerOpen}
        onOpenChange={(_, data) => setDrawerOpen(data.open)}
        className="portal-drawer"
      >
        <div className="portal-drawer-header">
          <Text weight="semibold">ARGOS</Text>
          <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={closeDrawer} aria-label="Cerrar menú" />
        </div>
        <nav className="portal-nav-list">
          {allowedItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`portal-nav-link ${isRouteActive(pathname, item.href) ? "active" : ""}`}
              onClick={closeDrawer}
            >
              <span>{item.icon}</span>
              <Text>{item.label}</Text>
            </Link>
          ))}
        </nav>
      </OverlayDrawer>

      <aside className="portal-sidebar">
        <div className="portal-brand">
          <div>
            <div className="portal-brand-logo-wrap">
              <Image src="/argos-logo.webp" alt="Argos" width={116} height={40} className="portal-brand-logo" priority />
            </div>
            <Text weight="semibold" block>
              ARGOS
            </Text>
            <Text size={200} className="portal-brand-caption" block>
              Plataforma Integral
            </Text>
          </div>
        </div>

        <nav className="portal-nav-list">
          {allowedItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`portal-nav-link ${isRouteActive(pathname, item.href) ? "active" : ""}`}
            >
              <span>{item.icon}</span>
              <Text>{item.label}</Text>
            </Link>
          ))}
        </nav>
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
                Sede: {user.sedeIds.includes("*") ? "Todas" : user.sedeIds.join(", ")}
              </Text>
            </div>
          </div>

          <div className="portal-topbar-right">
            <Badge appearance="tint">{user.roles.join(", ")}</Badge>
            <Tooltip content="Cerrar sesión" relationship="label">
              <Button
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

        <main className="portal-main">{children}</main>
      </div>
    </div>
  );
}
