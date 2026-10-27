import type { AppUser } from "@/lib/types/app";

/**
 * RF-22 and RF-19: eligibility is evaluated before SAP SOLPED formatting.
 *
 * The definitive SAP layout, quantity rules and material-code grouping need
 * client approval. This module never writes a SAP file nor modifies SAP.
 */
export interface SolpedCollaborator {
  collaboratorId: string;
  active: boolean;
  /** Missing indicator must not silently become 'eligible'. */
  semestralIndicator?: boolean | null;
  /** If an early delivery covers a period, skip only that exact period. */
  advancedDeliveryCoversCycleId?: string | null;
}

export type SolpedExclusionReason =
  | "INACTIVE"
  | "NO_SEMESTRAL_INDICATOR"
  | "EARLY_DELIVERY_FOR_CYCLE";

export type SolpedReviewReason =
  | "MISSING_COLLABORATOR_ID"
  | "DUPLICATE_COLLABORATOR"
  | "UNKNOWN_SEMESTRAL_INDICATOR"
  | "INVALID_ACTIVE_FLAG";

export interface SolpedSelection {
  cycleId: string;
  eligible: SolpedCollaborator[];
  excluded: Array<{ collaboratorId: string; reason: SolpedExclusionReason }>;
  needsReview: Array<{ collaboratorId: string; reason: SolpedReviewReason }>;
}

export class SolpedEligibilityError extends Error {
  constructor(
    public readonly code: "ROLE_FORBIDDEN" | "INVALID_CYCLE" | "REVIEW_REQUIRED",
    message: string,
  ) {
    super(message);
    this.name = "SolpedEligibilityError";
  }
}

const normalizeId = (id: unknown): string => typeof id === "string" ? id.trim() : "";

/**
 * Read-only classification. The caller must obtain candidates from a trusted,
 * consistent snapshot of employee and delivery data; no UI-supplied eligibility
 * is authoritative.
 */
export function selectSolpedCandidates(
  user: AppUser,
  cycleId: string,
  candidates: readonly SolpedCollaborator[],
): SolpedSelection {
  if (!user.roles.includes("UsuarioPedidos")) {
    throw new SolpedEligibilityError("ROLE_FORBIDDEN", "Solo Usuario Pedidos puede generar SOLPED");
  }
  const normalizedCycle = normalizeId(cycleId);
  if (!normalizedCycle) {
    throw new SolpedEligibilityError("INVALID_CYCLE", "Es obligatorio identificar el ciclo nacional");
  }
  const selection: SolpedSelection = {
    cycleId: normalizedCycle,
    eligible: [],
    excluded: [],
    needsReview: [],
  };
  const seen = new Set<string>();

  // A fixed sort makes the classification reproducible for the same snapshot.
  const ordered = [...candidates].sort((a, b) => {
    const left = normalizeId(a.collaboratorId);
    const right = normalizeId(b.collaboratorId);
    return left < right ? -1 : left > right ? 1 : 0;
  });

  for (const record of ordered) {
    const id = normalizeId(record.collaboratorId);
    if (!id) {
      selection.needsReview.push({ collaboratorId: "", reason: "MISSING_COLLABORATOR_ID" });
      continue;
    }
    if (seen.has(id)) {
      selection.needsReview.push({ collaboratorId: id, reason: "DUPLICATE_COLLABORATOR" });
      continue;
    }
    seen.add(id);
    if (typeof record.active !== "boolean") {
      selection.needsReview.push({ collaboratorId: id, reason: "INVALID_ACTIVE_FLAG" });
    } else if (!record.active) {
      selection.excluded.push({ collaboratorId: id, reason: "INACTIVE" });
    } else if (typeof record.semestralIndicator !== "boolean") {
      selection.needsReview.push({ collaboratorId: id, reason: "UNKNOWN_SEMESTRAL_INDICATOR" });
    } else if (!record.semestralIndicator) {
      selection.excluded.push({ collaboratorId: id, reason: "NO_SEMESTRAL_INDICATOR" });
    } else if (record.advancedDeliveryCoversCycleId?.trim() === normalizedCycle) {
      selection.excluded.push({ collaboratorId: id, reason: "EARLY_DELIVERY_FOR_CYCLE" });
    } else {
      selection.eligible.push({ ...record, collaboratorId: id });
    }
  }
  return selection;
}

/** Call before feeding an approved layout formatter or external export. */
export function requireReviewFreeSolpedSelection(selection: SolpedSelection): SolpedCollaborator[] {
  if (selection.needsReview.length !== 0) {
    throw new SolpedEligibilityError(
      "REVIEW_REQUIRED",
      `SOLPED pendiente de revisión de ${selection.needsReview.length} registros`,
    );
  }
  return selection.eligible;
}

/**
 * Selection-to-serializer boundary for a future approved SAP file formatter.
 * The formatter is not invoked while any row needs human review. No real SAP
 * integration, file generation or persistence is implemented here.
 */
export async function withReviewedSolpedCandidates<T>(
  user: AppUser,
  cycleId: string,
  candidates: readonly SolpedCollaborator[],
  serializeApprovedLayout: (eligible: readonly SolpedCollaborator[]) => Promise<T>,
): Promise<T> {
  const selection = selectSolpedCandidates(user, cycleId, candidates);
  const eligible = requireReviewFreeSolpedSelection(selection);
  return serializeApprovedLayout(eligible);
}
