import { describe, expect, it } from "vitest";

import {
  requireReviewFreeSolpedSelection,
  selectSolpedCandidates,
  type SolpedCollaborator,
} from "@/lib/dotacion/solped-eligibility";
import type { AppUser } from "@/lib/types/app";

const actor = (role: AppUser["roles"][number]): AppUser => ({
  id: "synthetic-" + role,
  name: "QA synthetic user",
  roles: [role],
  sedeIds: ["*"],
});

const pedido = actor("UsuarioPedidos");
const cycle = "CO-2026-S2";
const candidate = (
  id: string,
  values: Partial<SolpedCollaborator> = {},
): SolpedCollaborator => ({
  collaboratorId: id,
  active: true,
  semestralIndicator: true,
  ...values,
});

describe("RF-22 eligibility before SAP SOLPED layout", () => {
  it("requires UsuarioPedidos role", () => {
    for (const role of ["SuperAdmin", "AdminLocal", "UsuarioFinal"] as const) {
      expect(() => selectSolpedCandidates(actor(role), cycle, [candidate("emp-1")]))
        .toThrowError(expect.objectContaining({ code: "ROLE_FORBIDDEN" }));
    }
  });

  it("requires cycle identifier and refuses empty periods", () => {
    expect(() => selectSolpedCandidates(pedido, " ", []))
      .toThrowError(expect.objectContaining({ code: "INVALID_CYCLE" }));
  });

  it("includes only active employees with explicit semestral indicator", () => {
    const result = selectSolpedCandidates(pedido, cycle, [
      candidate("emp-1"),
      candidate("emp-2", { semestralIndicator: false }),
      candidate("emp-3", { active: false }),
    ]);
    expect(result.eligible.map((x) => x.collaboratorId)).toEqual(["emp-1"]);
    expect(result.excluded).toEqual([
      { collaboratorId: "emp-2", reason: "NO_SEMESTRAL_INDICATOR" },
      { collaboratorId: "emp-3", reason: "INACTIVE" },
    ]);
  });

  it("excludes deliveries already completed in advance for the target cycle", () => {
    const result = selectSolpedCandidates(pedido, cycle, [
      candidate("emp-1", { advancedDeliveryCoversCycleId: cycle }),
    ]);
    expect(result.eligible).toHaveLength(0);
    expect(result.excluded).toEqual([
      { collaboratorId: "emp-1", reason: "EARLY_DELIVERY_FOR_CYCLE" },
    ]);
  });

  it("does not permanently exclude employees for other cycles after an advanced delivery", () => {
    const result = selectSolpedCandidates(pedido, "CO-2027-S1", [
      candidate("emp-1", { advancedDeliveryCoversCycleId: cycle }),
    ]);
    expect(result.eligible).toHaveLength(1);
    expect(result.excluded).toHaveLength(0);
  });

  it("never assumes a missing semestral indicator means eligible", () => {
    const result = selectSolpedCandidates(pedido, cycle, [
      candidate("emp-1", { semestralIndicator: null }),
      candidate("emp-2", { semestralIndicator: undefined }),
    ]);
    expect(result.eligible).toHaveLength(0);
    expect(result.needsReview).toEqual([
      { collaboratorId: "emp-1", reason: "UNKNOWN_SEMESTRAL_INDICATOR" },
      { collaboratorId: "emp-2", reason: "UNKNOWN_SEMESTRAL_INDICATOR" },
    ]);
  });

  it("blocks export when a source collaborator ID is empty", () => {
    const result = selectSolpedCandidates(pedido, cycle, [candidate("")]);
    expect(result.needsReview).toEqual([
      { collaboratorId: "", reason: "MISSING_COLLABORATOR_ID" },
    ]);
    expect(() => requireReviewFreeSolpedSelection(result))
      .toThrowError(expect.objectContaining({ code: "REVIEW_REQUIRED" }));
  });

  it("detects duplicates instead of creating repeated requests", () => {
    const result = selectSolpedCandidates(pedido, cycle, [
      candidate("emp-1"), candidate("emp-1"),
    ]);
    expect(result.needsReview).toEqual([
      { collaboratorId: "emp-1", reason: "DUPLICATE_COLLABORATOR" },
    ]);
    expect(() => requireReviewFreeSolpedSelection(result))
      .toThrowError(expect.objectContaining({ code: "REVIEW_REQUIRED" }));
  });

  it("refuses invalid active flags rather than assuming active", () => {
    const result = selectSolpedCandidates(pedido, cycle, [
      candidate("emp-1", { active: undefined } as unknown as Partial<SolpedCollaborator>),
    ]);
    expect(result.needsReview).toEqual([
      { collaboratorId: "emp-1", reason: "INVALID_ACTIVE_FLAG" },
    ]);
  });

  it("always produces the same order regardless of ingestion sequence", () => {
    const a = [candidate("emp-20"), candidate("emp-01"), candidate("emp-10")];
    const left = selectSolpedCandidates(pedido, cycle, a);
    const right = selectSolpedCandidates(pedido, cycle, [...a].reverse());
    expect(left).toEqual(right);
    expect(left.eligible.map((x) => x.collaboratorId)).toEqual(["emp-01", "emp-10", "emp-20"]);
  });

  it("returns only eligible candidates to a future file serializer when review is clear", () => {
    const result = selectSolpedCandidates(pedido, cycle, [
      candidate("emp-1"),
      candidate("emp-2", { active: false }),
    ]);
    expect(requireReviewFreeSolpedSelection(result).map((x) => x.collaboratorId))
      .toEqual(["emp-1"]);
  });

  it("retains an auditable exclusion reason for each excluded collaborator", () => {
    const result = selectSolpedCandidates(pedido, cycle, [
      candidate("emp-1", { active: false }),
      candidate("emp-2", { semestralIndicator: false }),
      candidate("emp-3", { advancedDeliveryCoversCycleId: cycle }),
    ]);
    expect(result.excluded.map((x) => x.reason)).toEqual([
      "INACTIVE", "NO_SEMESTRAL_INDICATOR", "EARLY_DELIVERY_FOR_CYCLE",
    ]);
  });
});
