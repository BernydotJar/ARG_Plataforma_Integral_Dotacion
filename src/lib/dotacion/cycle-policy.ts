import { resolveWriteSede, SedeAccessError } from "@/lib/auth/sede-scope";
import type { AppUser } from "@/lib/types/app";

/**
 * RF-13/RF-21/RF-24: rules driven by server-loaded cycle state.
 *
 * This module does NOT manage persistence, sign off the SOW, or open cycles in
 * the absence of a trusted state repository. Callers must load cycle windows
 * from controlled server-side storage inside the same transaction as writes.
 */
export interface CycleWindow {
  opensAtUtc: string;
  closesAtUtc: string;
  enabled: boolean;
  endUserEditsLocked: boolean;
  tallaEditsLocked: boolean;
}

export type AdjustmentOperation = "pedido" | "talla";

export type CyclePolicyErrorCode =
  | "ROLE_FORBIDDEN"
  | "SEDE_FORBIDDEN"
  | "INVALID_WINDOW"
  | "END_USER_NOT_LOCKED"
  | "WINDOW_NOT_ENABLED"
  | "WINDOW_NOT_OPEN"
  | "WINDOW_EXPIRED"
  | "TALLAS_LOCKED";

export class CyclePolicyError extends Error {
  constructor(
    public readonly code: CyclePolicyErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CyclePolicyError";
  }
}

const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

const utcMillis = (timestamp: string): number => {
  if (typeof timestamp !== "string" || !timestampPattern.test(timestamp)) {
    throw new CyclePolicyError("INVALID_WINDOW", "Las fechas del ciclo deben indicar UTC explícito");
  }
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) {
    throw new CyclePolicyError("INVALID_WINDOW", "Fecha del ciclo inválida");
  }
  // Date.parse normalizes impossible calendar dates on some Node runtimes,
  // e.g. February 30. Reject those instead of silently moving a lock window.
  const normalized = timestamp.replace(/(?:\.(\d{1,3}))?Z$/, (_, fraction: string | undefined) =>
    `.${(fraction ?? "").padEnd(3, "0")}Z`);
  if (new Date(parsed).toISOString() !== normalized) {
    throw new CyclePolicyError("INVALID_WINDOW", "Fecha del ciclo no existe en el calendario");
  }
  return parsed;
};

export function validateCycleWindow(window: CycleWindow): { start: number; end: number } {
  if (typeof window?.enabled !== "boolean" ||
      typeof window.endUserEditsLocked !== "boolean" ||
      typeof window.tallaEditsLocked !== "boolean") {
    throw new CyclePolicyError("INVALID_WINDOW", "Estado del ciclo incompleto");
  }
  const start = utcMillis(window.opensAtUtc);
  const end = utcMillis(window.closesAtUtc);
  if (end <= start) {
    throw new CyclePolicyError("INVALID_WINDOW", "El cierre debe ser posterior a la apertura");
  }
  return { start, end };
}

/** RF-24: only the UsuarioPedidos role can enable the adjustment window. */
export function authorizeWindowActivation(user: AppUser, window: CycleWindow): void {
  validateCycleWindow(window);
  if (!user.roles.includes("UsuarioPedidos")) {
    throw new CyclePolicyError("ROLE_FORBIDDEN", "Solo UsuarioPedidos habilita ventanas de ajustes");
  }
  if (!window.endUserEditsLocked) {
    throw new CyclePolicyError(
      "END_USER_NOT_LOCKED",
      "No se permite abrir ajustes hasta bloquear modificaciones del usuario final",
    );
  }
}

/**
 * RF-21: AdminLocal changes only their assigned sede while the window is
 * open. RF-13: talla changes are additionally disabled after a talla lock.
 * Closed intervals use [opensAtUtc, closesAtUtc) so closing cannot be bypassed
 * at precisely the cutoff instant.
 */
export function authorizeAdjustment(
  user: AppUser,
  sedeId: string,
  window: CycleWindow,
  nowUtc: string,
  operation: AdjustmentOperation,
): void {
  const { start, end } = validateCycleWindow(window);
  if (!user.roles.includes("AdminLocal")) {
    throw new CyclePolicyError("ROLE_FORBIDDEN", "Solo Administrador Local realiza ajustes");
  }
  try {
    resolveWriteSede(user, sedeId);
  } catch (error) {
    if (error instanceof SedeAccessError) {
      throw new CyclePolicyError("SEDE_FORBIDDEN", "La sede no está asignada al administrador");
    }
    throw error;
  }
  if (!window.enabled) {
    throw new CyclePolicyError("WINDOW_NOT_ENABLED", "La ventana de ajustes no está habilitada");
  }
  if (!window.endUserEditsLocked) {
    throw new CyclePolicyError("END_USER_NOT_LOCKED", "No se ha bloqueado la modificación del usuario final");
  }
  const now = utcMillis(nowUtc);
  if (now < start) {
    throw new CyclePolicyError("WINDOW_NOT_OPEN", "La ventana todavía no está abierta");
  }
  if (now >= end) {
    throw new CyclePolicyError("WINDOW_EXPIRED", "La ventana de ajustes ha finalizado");
  }
  if (operation === "talla" && window.tallaEditsLocked) {
    throw new CyclePolicyError("TALLAS_LOCKED", "Las tallas están bloqueadas en este ciclo");
  }
}

/**
 * The callback models a repository write. The caller still needs a persistent,
 * transactional cycle-state read with concurrency protection. It is never
 * invoked if any authorization or window precondition fails.
 */
export async function executeAuthorizedAdjustment<T>(
  user: AppUser,
  sedeId: string,
  window: CycleWindow,
  nowUtc: string,
  operation: AdjustmentOperation,
  persist: (validatedSedeId: string) => Promise<T>,
): Promise<T> {
  authorizeAdjustment(user, sedeId, window, nowUtc, operation);
  return persist(sedeId);
}
