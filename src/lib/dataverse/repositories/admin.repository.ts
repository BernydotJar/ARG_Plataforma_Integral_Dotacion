import "server-only";

import { scopeBySede } from "@/lib/auth/roles";
import { backendApiFetch } from "@/lib/backend/client";
import { isDemoMode } from "@/lib/config/env";
import { getMockDb } from "@/lib/dataverse/mock-store";
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
  scopeMatchesFilters,
} from "./common";
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

const unwrap = <T>(payload: T | { data: T }): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

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

const apiAdminRepository: IAdminRepository = {
  async listCatalogos(user: AppUser) {
    void user;
    const payload = await backendApiFetch<Awaited<ReturnType<IAdminRepository["listCatalogos"]>> | { data: Awaited<ReturnType<IAdminRepository["listCatalogos"]>> }>(
      "/admin/catalogos",
    );

    return unwrap(payload);
  },

  async listUserRoleCatalog(user: AppUser) {
    void user;
    const payload = await backendApiFetch<Awaited<ReturnType<IAdminRepository["listUserRoleCatalog"]>> | { data: Awaited<ReturnType<IAdminRepository["listUserRoleCatalog"]>> }>(
      "/admin/usuarios-roles",
    );

    return unwrap(payload);
  },

  async listCentrosCosto(user: AppUser): Promise<CentroCosto[]> {
    void user;
    const payload = await backendApiFetch<CentroCosto[] | { data: CentroCosto[] }>("/admin/catalogos/centros-costo");
    return unwrap(payload);
  },

  async createCentroCosto(user: AppUser, input: CentroCostoCreateInput): Promise<CentroCosto> {
    void user;
    const payload = await backendApiFetch<CentroCosto | { data: CentroCosto }>("/admin/catalogos/centros-costo", {
      method: "POST",
      body: JSON.stringify(input),
    });

    return unwrap(payload);
  },

  async listKits(user: AppUser): Promise<KitDotacionWithItems[]> {
    void user;
    const payload = await backendApiFetch<KitDotacionWithItems[] | { data: KitDotacionWithItems[] }>("/admin/catalogos/kits");
    return unwrap(payload);
  },

  async createKit(user: AppUser, input: KitDotacionCreateInput): Promise<KitDotacionWithItems> {
    void user;
    const payload = await backendApiFetch<KitDotacionWithItems | { data: KitDotacionWithItems }>("/admin/catalogos/kits", {
      method: "POST",
      body: JSON.stringify(input),
    });

    return unwrap(payload);
  },
};

const resolveAdminRepository = (): IAdminRepository =>
  isDemoMode() ? demoAdminRepository : apiAdminRepository;

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
