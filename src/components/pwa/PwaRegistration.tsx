"use client";

import { useEffect } from "react";

interface PwaRegistrationProps {
  swPath: string;
}

export function PwaRegistration({ swPath }: PwaRegistrationProps) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register(swPath);
      } catch {
        // Ignore registration errors in unsupported/locked environments.
      }
    };

    void register();
  }, [swPath]);

  return null;
}
