"use client";

import { useEffect } from "react";

interface PwaRegisterProps {
  basePath?: string;
}

const normalizeBasePath = (basePath: string): string => {
  if (!basePath) return "";
  if (!basePath.startsWith("/")) return `/${basePath}`;
  return basePath.replace(/\/$/, "");
};

export function PwaRegister({ basePath = "" }: PwaRegisterProps) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isLocalhost = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
    if (process.env.NODE_ENV !== "production" && !isLocalhost) return;

    const normalizedBasePath = normalizeBasePath(basePath);
    const swUrl = `${normalizedBasePath}/sw.js`;

    navigator.serviceWorker.register(swUrl).catch(() => {
      // Registration failure should not block app usage.
    });
  }, [basePath]);

  return null;
}
