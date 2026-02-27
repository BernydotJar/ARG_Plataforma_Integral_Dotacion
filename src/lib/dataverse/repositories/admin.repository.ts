import "server-only";

import { scopeBySede } from "@/lib/auth/roles";
import { getMockDb } from "@/lib/dataverse/mock-store";
import type { AppUser } from "@/lib/types/app";
import { APP_ROLES } from "@/lib/types/app";

import type { IAdminRepository } from "./types";

const adminRepository: IAdminRepository = {
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
};

export const listCatalogos = async (user: AppUser) => adminRepository.listCatalogos(user);

export const listUserRoleCatalog = async (user: AppUser) => adminRepository.listUserRoleCatalog(user);
