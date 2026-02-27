import "server-only";

import { isDemoMode } from "@/lib/config/env";
import { getDataverseClient } from "@/lib/dataverse/client";
import { createMockIntegrationRequest, getMockDb } from "@/lib/dataverse/mock-store";
import { dataverseEntitySet } from "@/lib/dataverse/schema";
import type { IntegrationRequest } from "@/lib/dataverse/types";

import { addMockHistorialEvent, createMockEntityId, generateCode } from "./common";
import type {
  HistorialEventInput,
  IIntegrationRepository,
  IntegrationRequestInput,
  RepositoryRuntimeMode,
} from "./types";

const toRuntimeMode = (): RepositoryRuntimeMode => (isDemoMode() ? "demo" : "dataverse");

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

const dataverseIntegrationRepository: IIntegrationRepository = {
  async logHistorialEvent(params: HistorialEventInput): Promise<void> {
    const client = getDataverseClient();
    await client.create(dataverseEntitySet.HistorialEvento, {
      crf1_sedeid: params.sedeId,
      crf1_entidad: params.entidad,
      crf1_entidadid: params.entidadId,
      crf1_tipo: params.tipo,
      crf1_mensaje: params.mensaje,
      crf1_usuario: params.user.name,
      crf1_fecha: new Date().toISOString(),
      crf1_metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      crf1_estado: "Registrado",
    });
  },

  async createIntegrationRequest(params: IntegrationRequestInput): Promise<IntegrationRequest> {
    const client = getDataverseClient();
    const created = await client.create<Record<string, unknown>>(dataverseEntitySet.IntegrationRequest, {
      crf1_sedeid: params.sedeId,
      crf1_flujo: params.flujo,
      crf1_payload: JSON.stringify(params.payload),
      crf1_estado: "Pendiente",
      crf1_referencia: generateCode("INT"),
    });

    const request: IntegrationRequest = {
      id: String(created.crf1_integrationrequestid || created.id || createMockEntityId("int")),
      sedeId: params.sedeId,
      flujo: params.flujo,
      payload: params.payload,
      estado: "Pendiente",
      referencia: String(created.crf1_referencia || ""),
      createdOn: String(created.createdon || new Date().toISOString()),
      modifiedOn: String(created.modifiedon || new Date().toISOString()),
    };

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

const resolveIntegrationRepository = (): IIntegrationRepository =>
  toRuntimeMode() === "demo" ? demoIntegrationRepository : dataverseIntegrationRepository;

export const logHistorialEvent = async (params: HistorialEventInput): Promise<void> =>
  resolveIntegrationRepository().logHistorialEvent(params);

export const createIntegrationRequest = async (params: IntegrationRequestInput): Promise<IntegrationRequest> =>
  resolveIntegrationRepository().createIntegrationRequest(params);

export const getRuntimeModeLabel = (): RepositoryRuntimeMode => toRuntimeMode();
