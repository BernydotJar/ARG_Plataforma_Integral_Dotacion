import { describe, expect, it, vi } from "vitest";

import {
  executeAuthorizedAdjustment,
  type CycleWindow,
} from "@/lib/dotacion/cycle-policy";
import type { AppUser } from "@/lib/types/app";

// Adapter-level integration: a synthetic persistence callback stands in for
// the future transactional SQL repository. This does not verify real SQL I/O.
const assignedLocal: AppUser = {
  id: "synthetic-admin",
  name: "Synthetic administrator",
  roles: ["AdminLocal"],
  sedeIds: ["planta-a"],
};
const window: CycleWindow = {
  opensAtUtc: "2026-10-27T00:00:00Z",
  closesAtUtc: "2026-10-28T00:00:00Z",
  enabled: true,
  endUserEditsLocked: true,
  tallaEditsLocked: true,
};

describe("Pedido/talla adapter integration (isolated fake persistence)", () => {
  it("rejects cross-sede writes before invoking persistence", async () => {
    const save = vi.fn(async () => ({ id: "order-1" }));
    await expect(executeAuthorizedAdjustment(
      assignedLocal, "planta-b", window, "2026-10-27T12:00:00Z", "pedido", save,
    )).rejects.toMatchObject({ code: "SEDE_FORBIDDEN" });
    expect(save).not.toHaveBeenCalled();
  });

  it("allows a pedido adjustment inside its own window with exact site identity", async () => {
    const save = vi.fn(async (sedeId: string) => ({ id: "order-2", sedeId }));
    const result = await executeAuthorizedAdjustment(
      assignedLocal, "planta-a", window, "2026-10-27T12:00:00Z", "pedido", save,
    );
    expect(result).toEqual({ id: "order-2", sedeId: "planta-a" });
    expect(save).toHaveBeenCalledExactlyOnceWith("planta-a");
  });

  it("never saves a talla change once tallas are locked for the cycle", async () => {
    const save = vi.fn(async () => ({ id: "talla-1" }));
    await expect(executeAuthorizedAdjustment(
      assignedLocal, "planta-a", window, "2026-10-27T12:00:00Z", "talla", save,
    )).rejects.toMatchObject({ code: "TALLAS_LOCKED" });
    expect(save).not.toHaveBeenCalled();
  });

  it("denies writes at exact period closure (server-side time)", async () => {
    const save = vi.fn(async () => ({ id: "order-3" }));
    await expect(executeAuthorizedAdjustment(
      assignedLocal, "planta-a", window, window.closesAtUtc, "pedido", save,
    )).rejects.toMatchObject({ code: "WINDOW_EXPIRED" });
    expect(save).not.toHaveBeenCalled();
  });

  it("denies writes when opening condition was revoked after opening", async () => {
    const save = vi.fn(async () => ({ id: "order-4" }));
    await expect(executeAuthorizedAdjustment(
      assignedLocal, "planta-a", { ...window, endUserEditsLocked: false },
      "2026-10-27T12:00:00Z", "pedido", save,
    )).rejects.toMatchObject({ code: "END_USER_NOT_LOCKED" });
    expect(save).not.toHaveBeenCalled();
  });
});
