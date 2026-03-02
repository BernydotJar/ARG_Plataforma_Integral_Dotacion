import "server-only";

import { isDemoMode } from "@/lib/config/env";
import { backendApiFetch } from "@/lib/backend/client";
import { createMockIntegrationRequest, getMockDb } from "@/lib/dataverse/mock-store";
import type { IntegrationRequest } from "@/lib/dataverse/types";

import { addMockHistorialEvent, createMockEntityId, generateCode } from "./common";
import type {
  HistorialEventInput,
  IIntegrationRepository,
  IntegrationRequestInput,
  RepositoryRuntimeMode,
} from "./types";

const toRuntimeMode = (): RepositoryRuntimeMode => (isDemoMode() ? "demo" : "api");

const demoIntegrationRepository: IIntegrationRepository = {
  async logHistorialEvent(params: HistorialEventInput): Promise<void> {
    addMockHistorialEvent(params);
  },

  async createIntegrationRequest(params: IntegrationRequestInput): Promise<IntegrationRequest> {
    const db = getMockDb();

    const request = createMockIntegrationRequest({
      sedeId: params.sedeId,
      flujo: params.flujo,
      payload: params.payload,
      estado: "Pendiente",
      referencia: generateCode("INT"),
    });

    db.integrationRequests.unshift(request);

    await this.logHistorialEvent({
      user: params.user,
      sedeId: params.sedeId,
      entidad: "IntegrationRequest",
      entidadId: request.id,
      tipo: "Flow",
      mensaje: `Solicitud de integración registrada para ${params.flujo}`,
      metadata: params.payload,
    });

    return request;
  },
};

const apiIntegrationRepository: IIntegrationRepository = {
  async logHistorialEvent(params: HistorialEventInput): Promise<void> {
    await backendApiFetch<void>("/integration/historial", {
      method: "POST",
      body: JSON.stringify({
        sedeId: params.sedeId,
        entidad: params.entidad,
        entidadId: params.entidadId,
        tipo: params.tipo,
        mensaje: params.mensaje,
        usuario: params.user.name,
        metadata: params.metadata,
      }),
    });
  },

  async createIntegrationRequest(params: IntegrationRequestInput): Promise<IntegrationRequest> {
    const request = await backendApiFetch<IntegrationRequest>("/integration/requests", {
      method: "POST",
      body: JSON.stringify({
        sedeId: params.sedeId,
        flujo: params.flujo,
        payload: params.payload,
      }),
    });

    await this.logHistorialEvent({
      user: params.user,
      sedeId: params.sedeId,
      entidad: "IntegrationRequest",
      entidadId: request.id || createMockEntityId("int"),
      tipo: "Flow",
      mensaje: `Solicitud de integración registrada para ${params.flujo}`,
      metadata: params.payload,
    });

    return request;
  },
};

const resolveIntegrationRepository = (): IIntegrationRepository =>
  toRuntimeMode() === "demo" ? demoIntegrationRepository : apiIntegrationRepository;

export const logHistorialEvent = async (params: HistorialEventInput): Promise<void> =>
  resolveIntegrationRepository().logHistorialEvent(params);

export const createIntegrationRequest = async (params: IntegrationRequestInput): Promise<IntegrationRequest> =>
  resolveIntegrationRepository().createIntegrationRequest(params);

export const getRuntimeModeLabel = (): RepositoryRuntimeMode => toRuntimeMode();
