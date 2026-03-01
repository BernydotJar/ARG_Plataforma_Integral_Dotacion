import "server-only";

import { isDemoMode } from "@/lib/config/env";
import { scopeBySede } from "@/lib/auth/roles";
import { getDataverseClient } from "@/lib/dataverse/client";
import { getMockDb } from "@/lib/dataverse/mock-store";
import { dataverseEntitySet } from "@/lib/dataverse/schema";
import type {
  CentroCosto,
  KitDotacion,
  KitDotacionItem,
} from "@/lib/dataverse/types";
import type { AppUser } from "@/lib/types/app";
import { APP_ROLES } from "@/lib/types/app";

import {
  createMockEntityId,
  getRequestedSede,
  rowToCentroCosto,
  rowToKit,
  rowToKitItem,
  scopeMatchesFilters,
} from "./common";
import {
  QUERY_TOP_DEFAULT,
  QUERY_TOP_LARGE,
} from "./constants";
import { logHistorialEvent } from "./integration.repository";
import type {
  CentroCostoCreateInput,
  IAdminRepository,
  KitDotacionCreateInput,
  KitDotacionWithItems,
} from "./types";

const toKitCollection = (
  kits: KitDotacion[],
  allItems: KitDotacionItem[],
): KitDotacionWithItems[] => kits.map((kit) => ({
  ...kit,
  items: allItems.filter((entry) => entry.kitId === kit.id),
}));

const demoAdminRepository: IAdminRepository = {
  async listCatalogos(user: AppUser) {
    const db = getMockDb();

    return {
      sedes: scopeBySede(db.sedes, user),
      areas: scopeBySede(db.areas, user),
      bodegas: scopeBySede(db.bodegas, user),
      ubicaciones: scopeBySede(db.ubicaciones, user),
      empleados: scopeBySede(db.empleados, user),
      itemsDotacion: scopeBySede(db.itemsDotacion, user),
      tallas: scopeBySede(db.tallas, user),
      proveedores: scopeBySede(db.proveedores, user),
      centrosCosto: scopeBySede(db.centrosCosto, user),
      kitsDotacion: scopeBySede(db.kitsDotacion, user),
      kitDotacionItems: scopeBySede(db.kitDotacionItems, user),
      tiposDefecto: scopeBySede(db.tiposDefecto, user),
      severidades: scopeBySede(db.severidades, user),
      criteriosChecklist: scopeBySede(db.criteriosChecklist, user),
      equipos: scopeBySede(db.equipos, user),
    };
  },

  async listUserRoleCatalog(user: AppUser) {
    const db = getMockDb();

    return {
      availableRoles: APP_ROLES,
      sampleUsers: [
        {
          id: "usr-001",
          nombre: "Administrador Central",
          correo: "admin.central@argos.local",
          roles: ["SuperAdmin"],
          sedes: db.sedes.map((entry) => entry.id),
        },
        {
          id: "usr-002",
          nombre: "Coordinador Operaciones",
          correo: "admin.local@argos.local",
          roles: ["AdminLocal", "UsuarioPedidos"],
          sedes: scopeBySede(db.sedes, user).map((entry) => entry.id),
        },
        {
          id: "usr-003",
          nombre: "Técnico Mantenimiento",
          correo: "tecnico@argos.local",
          roles: ["TecnicoMantenimiento"],
          sedes: scopeBySede(db.sedes, user).map((entry) => entry.id),
        },
      ],
    };
  },

  async listCentrosCosto(user: AppUser): Promise<CentroCosto[]> {
    const db = getMockDb();
    return db.centrosCosto.filter((entry) => scopeMatchesFilters(entry, user));
  },

  async createCentroCosto(user: AppUser, input: CentroCostoCreateInput): Promise<CentroCosto> {
    const db = getMockDb();
    const now = new Date().toISOString();
    const sedeId = getRequestedSede(user, input.sedeId);

    const centroCosto: CentroCosto = {
      id: createMockEntityId("ceco"),
      sedeId,
      codigo: input.codigo,
      nombre: input.nombre,
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    };

    db.centrosCosto.unshift(centroCosto);

    await logHistorialEvent({
      user,
      sedeId,
      entidad: "CentroCosto",
      entidadId: centroCosto.id,
      tipo: "Creación",
      mensaje: `Centro de costo ${centroCosto.codigo} creado`,
      metadata: { codigo: centroCosto.codigo, nombre: centroCosto.nombre },
    });

    return centroCosto;
  },

  async listKits(user: AppUser): Promise<KitDotacionWithItems[]> {
    const db = getMockDb();
    const kits = db.kitsDotacion.filter((entry) => scopeMatchesFilters(entry, user));
    const items = db.kitDotacionItems.filter((entry) => scopeMatchesFilters(entry, user));

    return toKitCollection(kits, items);
  },

  async createKit(user: AppUser, input: KitDotacionCreateInput): Promise<KitDotacionWithItems> {
    const db = getMockDb();
    const now = new Date().toISOString();
    const sedeId = getRequestedSede(user, input.sedeId);

    const kit: KitDotacion = {
      id: createMockEntityId("kit"),
      sedeId,
      nombre: input.nombre,
      genero: input.genero,
      cargo: input.cargo,
      ciclo: input.ciclo,
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    };

    const items: KitDotacionItem[] = input.items.map((entry) => ({
      id: createMockEntityId("kit-item"),
      sedeId,
      kitId: kit.id,
      itemNombre: entry.itemNombre,
      cantidad: entry.cantidad,
      obligatorio: entry.obligatorio,
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    }));

    db.kitsDotacion.unshift(kit);
    db.kitDotacionItems.unshift(...items);

    await logHistorialEvent({
      user,
      sedeId,
      entidad: "KitDotacion",
      entidadId: kit.id,
      tipo: "Creación",
      mensaje: `Kit ${kit.nombre} creado con ${items.length} ítems`,
      metadata: { cargo: kit.cargo, ciclo: kit.ciclo },
    });

    return {
      ...kit,
      items,
    };
  },
};

const dataverseAdminRepository: IAdminRepository = {
  async listCatalogos(user: AppUser) {
    const base = await demoAdminRepository.listCatalogos(user);
    const centrosCosto = await this.listCentrosCosto(user);
    const kits = await this.listKits(user);

    return {
      ...base,
      centrosCosto,
      kitsDotacion: kits,
      kitDotacionItems: kits.flatMap((entry) => entry.items),
    };
  },

  async listUserRoleCatalog(user: AppUser) {
    return demoAdminRepository.listUserRoleCatalog(user);
  },

  async listCentrosCosto(user: AppUser): Promise<CentroCosto[]> {
    const client = getDataverseClient();
    const rows = await client.list<Record<string, unknown>>(dataverseEntitySet.CentroCosto, {
      top: QUERY_TOP_LARGE,
      orderBy: "createdon desc",
    });

    return rows.map(rowToCentroCosto).filter((entry) => scopeMatchesFilters(entry, user));
  },

  async createCentroCosto(user: AppUser, input: CentroCostoCreateInput): Promise<CentroCosto> {
    const client = getDataverseClient();
    const sedeId = getRequestedSede(user, input.sedeId);

    const created = await client.create<Record<string, unknown>>(dataverseEntitySet.CentroCosto, {
      crf1_sedeid: sedeId,
      crf1_codigo: input.codigo,
      crf1_nombre: input.nombre,
      crf1_estado: "Activo",
    });

    const centroCosto = rowToCentroCosto(created);

    await logHistorialEvent({
      user,
      sedeId,
      entidad: "CentroCosto",
      entidadId: centroCosto.id,
      tipo: "Creación",
      mensaje: `Centro de costo ${centroCosto.codigo} creado`,
      metadata: { codigo: centroCosto.codigo, nombre: centroCosto.nombre },
    });

    return centroCosto;
  },

  async listKits(user: AppUser): Promise<KitDotacionWithItems[]> {
    const client = getDataverseClient();

    const [kitRows, itemRows] = await Promise.all([
      client.list<Record<string, unknown>>(dataverseEntitySet.KitDotacion, {
        top: QUERY_TOP_DEFAULT,
        orderBy: "createdon desc",
      }),
      client.list<Record<string, unknown>>(dataverseEntitySet.KitDotacionItem, {
        top: QUERY_TOP_LARGE,
        orderBy: "createdon desc",
      }),
    ]);

    const kits = kitRows.map(rowToKit).filter((entry) => scopeMatchesFilters(entry, user));
    const items = itemRows
      .map((entry) => rowToKitItem(entry, String(entry.crf1_sedeid || "")))
      .filter((entry) => scopeMatchesFilters(entry, user));

    return toKitCollection(kits, items);
  },

  async createKit(user: AppUser, input: KitDotacionCreateInput): Promise<KitDotacionWithItems> {
    const client = getDataverseClient();
    const sedeId = getRequestedSede(user, input.sedeId);

    const createdKit = await client.create<Record<string, unknown>>(dataverseEntitySet.KitDotacion, {
      crf1_sedeid: sedeId,
      crf1_nombre: input.nombre,
      crf1_genero: input.genero,
      crf1_cargo: input.cargo,
      crf1_ciclo: input.ciclo,
      crf1_estado: "Activo",
    });

    const kit = rowToKit(createdKit);

    const items = await Promise.all(
      input.items.map(async (entry) => {
        const createdItem = await client.create<Record<string, unknown>>(dataverseEntitySet.KitDotacionItem, {
          crf1_sedeid: sedeId,
          crf1_kitid: kit.id,
          crf1_itemnombre: entry.itemNombre,
          crf1_cantidad: entry.cantidad,
          crf1_obligatorio: entry.obligatorio,
          crf1_estado: "Activo",
        });

        return rowToKitItem(createdItem, sedeId);
      }),
    );

    await logHistorialEvent({
      user,
      sedeId,
      entidad: "KitDotacion",
      entidadId: kit.id,
      tipo: "Creación",
      mensaje: `Kit ${kit.nombre} creado con ${items.length} ítems`,
      metadata: { cargo: kit.cargo, ciclo: kit.ciclo },
    });

    return {
      ...kit,
      items,
    };
  },
};

const resolveAdminRepository = (): IAdminRepository =>
  isDemoMode() ? demoAdminRepository : dataverseAdminRepository;

export const listCatalogos = async (user: AppUser) =>
  resolveAdminRepository().listCatalogos(user);

export const listUserRoleCatalog = async (user: AppUser) =>
  resolveAdminRepository().listUserRoleCatalog(user);

export const listCentrosCosto = async (user: AppUser): Promise<CentroCosto[]> =>
  resolveAdminRepository().listCentrosCosto(user);

export const createCentroCosto = async (
  user: AppUser,
  input: CentroCostoCreateInput,
): Promise<CentroCosto> => resolveAdminRepository().createCentroCosto(user, input);

export const listKits = async (user: AppUser): Promise<KitDotacionWithItems[]> =>
  resolveAdminRepository().listKits(user);

export const createKit = async (
  user: AppUser,
  input: KitDotacionCreateInput,
): Promise<KitDotacionWithItems> => resolveAdminRepository().createKit(user, input);
