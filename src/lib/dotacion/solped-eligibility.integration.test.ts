import { describe, expect, it, vi } from "vitest";

import {
  withReviewedSolpedCandidates,
  type SolpedCollaborator,
} from "@/lib/dotacion/solped-eligibility";
import type { AppUser } from "@/lib/types/app";

// Integration to a synthetic formatter callback only. The SAP layout and
// persistent collaborator repository are NOT available in this environment.
const actor: AppUser = {
  id: "qa-pedido",
  name: "QA synthetic order operator",
  roles: ["UsuarioPedidos"],
  sedeIds: ["*"],
};

const employee = (
  collaboratorId: string,
  values: Partial<SolpedCollaborator> = {},
): SolpedCollaborator => ({
  collaboratorId,
  active: true,
  semestralIndicator: true,
  ...values,
});

describe("SOLPED classification to approved-formatter integration boundary", () => {
  it("passes only eligible rows to the next export stage", async () => {
    const serialize = vi.fn(async (rows: readonly SolpedCollaborator[]) => rows.map((r) => r.collaboratorId));
    const ids = await withReviewedSolpedCandidates(actor, "2026-S2", [
      employee("emp-2", { semestralIndicator: false }),
      employee("emp-1"),
      employee("emp-3", { advancedDeliveryCoversCycleId: "2026-S2" }),
    ], serialize);
    expect(ids).toEqual(["emp-1"]);
    expect(serialize).toHaveBeenCalledTimes(1);
  });

  it("refuses to call the serializer when a semestral indicator is missing", async () => {
    const serialize = vi.fn(async () => "content");
    await expect(withReviewedSolpedCandidates(actor, "2026-S2", [
      employee("emp-1", { semestralIndicator: undefined }),
    ], serialize)).rejects.toMatchObject({ code: "REVIEW_REQUIRED" });
    expect(serialize).not.toHaveBeenCalled();
  });

  it("refuses duplicate source collaborators before downstream processing", async () => {
    const serialize = vi.fn(async () => "content");
    await expect(withReviewedSolpedCandidates(actor, "2026-S2", [
      employee("emp-1"), employee("emp-1"),
    ], serialize)).rejects.toMatchObject({ code: "REVIEW_REQUIRED" });
    expect(serialize).not.toHaveBeenCalled();
  });

  it("denies non-UsuarioPedidos without invoking the serializer", async () => {
    const serialize = vi.fn(async () => "content");
    await expect(withReviewedSolpedCandidates(
      { ...actor, roles: ["AdminLocal"] },
      "2026-S2",
      [employee("emp-1")],
      serialize,
    )).rejects.toMatchObject({ code: "ROLE_FORBIDDEN" });
    expect(serialize).not.toHaveBeenCalled();
  });
});
