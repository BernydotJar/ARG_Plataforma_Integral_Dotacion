import "server-only";

import { backendApiFetch } from "@/lib/backend/client";
import { isDemoMode } from "@/lib/config/env";
import type { AppUser } from "@/lib/types/app";

export type SsffSyncStatus = "Idle" | "Running" | "Success" | "Failed";

export interface SsffSyncRun {
  id: string;
  status: SsffSyncStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  altas: number;
  bajas: number;
  cambios: number;
  errores: number;
  triggeredBy: string;
  source: "manual" | "scheduled";
  details?: string;
}

export interface SsffSyncOverview {
  currentStatus: SsffSyncStatus;
  lastSuccessfulAt?: string;
  lastExecutionAt?: string;
  nextScheduledAt?: string;
  recentRuns: SsffSyncRun[];
}

export interface SsffSyncTriggerInput {
  mode?: "manual" | "retry";
  sinceDate?: string;
}

export interface SsffSyncTriggerResult {
  accepted: boolean;
  runId: string;
  status: SsffSyncStatus;
  message: string;
}

const unwrap = <T>(payload: T | { data: T }): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};

const createDemoOverview = (): SsffSyncOverview => {
  const now = Date.now();
  const lastRunAt = new Date(now - 1000 * 60 * 90).toISOString();
  const nextRunAt = new Date(now + 1000 * 60 * 60 * 10).toISOString();

  return {
    currentStatus: "Idle",
    lastSuccessfulAt: lastRunAt,
    lastExecutionAt: lastRunAt,
    nextScheduledAt: nextRunAt,
    recentRuns: [
      {
        id: "ssff-run-demo-001",
        status: "Success",
        startedAt: new Date(now - 1000 * 60 * 95).toISOString(),
        finishedAt: lastRunAt,
        durationMs: 300000,
        altas: 7,
        bajas: 2,
        cambios: 14,
        errores: 0,
        triggeredBy: "scheduler@argos.local",
        source: "scheduled",
      },
    ],
  };
};

export const getSsffSyncOverview = async (): Promise<SsffSyncOverview> => {
  if (isDemoMode()) {
    return createDemoOverview();
  }

  const payload = await backendApiFetch<SsffSyncOverview | { data: SsffSyncOverview }>("/integraciones/ssff/estado");
  return unwrap(payload);
};

export const triggerSsffSync = async (
  user: AppUser,
  input: SsffSyncTriggerInput,
): Promise<SsffSyncTriggerResult> => {
  if (isDemoMode()) {
    return {
      accepted: true,
      runId: `ssff-demo-${crypto.randomUUID().slice(0, 8)}`,
      status: "Running",
      message: "Sincronización SSFF iniciada en modo demo",
    };
  }

  const payload = await backendApiFetch<SsffSyncTriggerResult | { data: SsffSyncTriggerResult }>(
    "/integraciones/ssff/sync",
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        triggeredBy: user.email || user.name,
      }),
    },
  );

  return unwrap(payload);
};
