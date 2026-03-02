import "server-only";

import { env } from "@/lib/config/env";
import { createIntegrationRequest, getRuntimeModeLabel } from "@/lib/dataverse/repository";
import type { AppUser } from "@/lib/types/app";

export interface FlowExecutionResult {
  ok: boolean;
  mode: "http" | "api" | "stub";
  trackingId: string;
  message: string;
  response?: unknown;
}

type TriggerInput = {
  user: AppUser;
  sedeId: string;
  flowName: string;
  endpointUrl?: string;
  payload: Record<string, unknown>;
};

const executeHttpFlow = async (url: string, payload: Record<string, unknown>): Promise<unknown> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.flow.apiKey ? { "x-api-key": env.flow.apiKey } : {}),
      ...(env.flow.bearerToken ? { Authorization: `Bearer ${env.flow.bearerToken}` } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Flow HTTP error ${response.status}: ${body}`);
  }

  try {
    return await response.json();
  } catch {
    return {
      status: "accepted",
      message: "Flow ejecutado sin payload JSON de respuesta",
    };
  }
};

const triggerFlow = async ({ user, sedeId, flowName, endpointUrl, payload }: TriggerInput): Promise<FlowExecutionResult> => {
  const shouldCallHttp = env.flow.mode === "http" && endpointUrl;

  if (shouldCallHttp) {
    const response = await executeHttpFlow(endpointUrl, payload);
    const trackingId =
      (typeof response === "object" && response && "trackingId" in response
        ? String((response as { trackingId?: string }).trackingId)
        : `HTTP-${crypto.randomUUID().slice(0, 8)}`);

    return {
      ok: true,
      mode: "http",
      trackingId,
      message: `Flow ${flowName} ejecutado por endpoint HTTP`,
      response,
    };
  }

  const integrationRequest = await createIntegrationRequest({
    user,
    sedeId,
    flujo: flowName,
    payload,
  });

  const mode = getRuntimeModeLabel() === "demo" ? "stub" : "api";
  return {
    ok: true,
    mode,
    trackingId: integrationRequest.referencia || integrationRequest.id,
    message:
      mode === "stub"
        ? `Flow ${flowName} registrado en stub local (modo demo)`
        : `Flow ${flowName} registrado como IntegrationRequest en backend API/Azure SQL`,
    response: integrationRequest,
  };
};

export const triggerApprovalPedidoFlow = async (
  user: AppUser,
  sedeId: string,
  payload: Record<string, unknown>,
): Promise<FlowExecutionResult> =>
  triggerFlow({
    user,
    sedeId,
    flowName: "ApprovalPedidoDotacion",
    endpointUrl: env.flow.approvalPedidoUrl,
    payload,
  });

export const triggerApprovalAjusteFlow = async (
  user: AppUser,
  sedeId: string,
  payload: Record<string, unknown>,
): Promise<FlowExecutionResult> =>
  triggerFlow({
    user,
    sedeId,
    flowName: "ApprovalAjusteInventario",
    endpointUrl: env.flow.approvalAjusteUrl,
    payload,
  });

export const triggerSapEnviarPedidoFlow = async (
  user: AppUser,
  sedeId: string,
  payload: Record<string, unknown>,
): Promise<FlowExecutionResult> =>
  triggerFlow({
    user,
    sedeId,
    flowName: "SAPEnviarPedido",
    endpointUrl: env.flow.sapEnviarPedidoUrl,
    payload,
  });

export const triggerSapSyncStatusFlow = async (
  user: AppUser,
  sedeId: string,
  payload: Record<string, unknown>,
): Promise<FlowExecutionResult> =>
  triggerFlow({
    user,
    sedeId,
    flowName: "SAPSyncStatus",
    endpointUrl: env.flow.sapSyncStatusUrl,
    payload,
  });
