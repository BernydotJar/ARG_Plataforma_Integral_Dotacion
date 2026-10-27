import type { AppUser } from "@/lib/types/app";

export class SedeAccessError extends Error {
  constructor(message = "Sede no autorizada para esta operación") {
    super(message);
    this.name = "SedeAccessError";
  }
}

// Resolve BEFORE network calls, database writes, or dispatching integrations.
// Never infer an enterprise sede from environment defaults or a global wildcard.
export function resolveWriteSede(user: AppUser, requested?: string): string {
  const global = user.roles.includes("SuperAdmin") && user.sedeIds.includes("*");
  const allowed = user.sedeIds.filter((site) => site.trim().length > 0 && site !== "*");

  if (requested !== undefined) {
    const site = requested.trim();
    if (!site || site === "*") throw new SedeAccessError();
    if (!global && !allowed.includes(site)) throw new SedeAccessError();
    return site;
  }

  const preferred = user.preferredSedeId?.trim();
  if (preferred && preferred !== "*") {
    if (!global && !allowed.includes(preferred)) throw new SedeAccessError();
    return preferred;
  }

  if (!global && allowed.length === 1) return allowed[0];

  throw new SedeAccessError("Selecciona una sede explícita antes de operar");
}
