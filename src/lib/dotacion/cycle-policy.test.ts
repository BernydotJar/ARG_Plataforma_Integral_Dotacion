import { describe, expect, it, vi } from "vitest";

import {
  authorizeAdjustment,
  authorizeWindowActivation,
  CyclePolicyError,
  executeAuthorizedAdjustment,
  validateCycleWindow,
  type CycleWindow,
} from "@/lib/dotacion/cycle-policy";
import type { AppUser } from "@/lib/types/app";

const makeUser = (
  roles: AppUser["roles"],
  sedeIds = ["sede-1"],
): AppUser => ({
  id: "qa-synthetic-id", name: "QA synthetic", sedeIds, roles,
});

const local = makeUser(["AdminLocal"]);
const pedidos = makeUser(["UsuarioPedidos"]);
const base: CycleWindow = {
  opensAtUtc: "2026-10-27T12:00:00Z",
  closesAtUtc: "2026-10-28T12:00:00Z",
  enabled: true,
  endUserEditsLocked: true,
  tallaEditsLocked: false,
};
const inside = "2026-10-27T16:00:00Z";

const assertDenied = (fn: () => void, code: CyclePolicyError["code"]) => {
  try {
    fn();
    throw new Error("Expected explicit domain denial");
  } catch (error) {
    expect(error).toBeInstanceOf(CyclePolicyError);
    expect((error as CyclePolicyError).code).toBe(code);
  }
};

describe("RF-24 order-window activation", () => {
  it("lets UsuarioPedidos activate a valid locked window", () => {
    expect(() => authorizeWindowActivation(pedidos, base)).not.toThrow();
  });

  it("does not allow AdminLocal or SuperAdmin to activate by implicit privilege", () => {
    for (const role of ["AdminLocal", "SuperAdmin", "UsuarioFinal"] as const) {
      assertDenied(() => authorizeWindowActivation(makeUser([role]), base), "ROLE_FORBIDDEN");
    }
  });

  it("rejects activation when end-user changes are not locked", () => {
    assertDenied(
      () => authorizeWindowActivation(pedidos, { ...base, endUserEditsLocked: false }),
      "END_USER_NOT_LOCKED",
    );
  });

  it("rejects timestamps without explicit UTC and invalid order", () => {
    for (const broken of [
      { ...base, opensAtUtc: "2026-10-27" },
      { ...base, opensAtUtc: "2026-10-27T12:00:00-05:00" },
      { ...base, closesAtUtc: base.opensAtUtc },
      { ...base, closesAtUtc: "invalid" },
      { ...base, closesAtUtc: "2026-10-26T12:00:00Z" },
      { ...base, opensAtUtc: "2026-02-30T12:00:00Z" },
      { ...base, opensAtUtc: "2026-10-27T25:00:00Z" },
    ]) {
      assertDenied(() => validateCycleWindow(broken), "INVALID_WINDOW");
    }
  });

  it("rejects incomplete persisted state before activation", () => {
    assertDenied(
      () => authorizeWindowActivation(pedidos, { ...base, endUserEditsLocked: undefined } as unknown as CycleWindow),
      "INVALID_WINDOW",
    );
  });
});

describe("RF-21 order adjustment window", () => {
  it("allows AdminLocal to adjust their assigned sede inside the window", () => {
    expect(() => authorizeAdjustment(local, "sede-1", base, inside, "pedido")).not.toThrow();
  });

  it("rejects cross-sede edits independent of the calendar", () => {
    assertDenied(() => authorizeAdjustment(local, "sede-2", base, inside, "pedido"), "SEDE_FORBIDDEN");
  });

  it("rejects UsuarioPedidos, UsuarioFinal, and SuperAdmin editing as AdminLocal", () => {
    for (const role of ["UsuarioPedidos", "UsuarioFinal", "SuperAdmin"] as const) {
      assertDenied(
        () => authorizeAdjustment(makeUser([role]), "sede-1", base, inside, "pedido"),
        "ROLE_FORBIDDEN",
      );
    }
  });

  it("rejects disabled windows", () => {
    assertDenied(
      () => authorizeAdjustment(local, "sede-1", { ...base, enabled: false }, inside, "pedido"),
      "WINDOW_NOT_ENABLED",
    );
  });

  it("rejects windows without end-user lock", () => {
    assertDenied(
      () => authorizeAdjustment(local, "sede-1", { ...base, endUserEditsLocked: false }, inside, "pedido"),
      "END_USER_NOT_LOCKED",
    );
  });

  it("accepts the exact opening instant and rejects the exact closing instant", () => {
    expect(() => authorizeAdjustment(local, "sede-1", base, base.opensAtUtc, "pedido")).not.toThrow();
    assertDenied(
      () => authorizeAdjustment(local, "sede-1", base, base.closesAtUtc, "pedido"),
      "WINDOW_EXPIRED",
    );
  });

  it("rejects changes before opening", () => {
    assertDenied(
      () => authorizeAdjustment(local, "sede-1", base, "2026-10-27T11:59:59Z", "pedido"),
      "WINDOW_NOT_OPEN",
    );
  });

  it("rejects changes after closure", () => {
    assertDenied(
      () => authorizeAdjustment(local, "sede-1", base, "2026-10-29T00:00:00Z", "pedido"),
      "WINDOW_EXPIRED",
    );
  });
});

describe("RF-13 talla locking and side effects", () => {
  it("rejects talla changes when locked while allowing pedido adjustments within the window", () => {
    const locked = { ...base, tallaEditsLocked: true };
    assertDenied(() => authorizeAdjustment(local, "sede-1", locked, inside, "talla"), "TALLAS_LOCKED");
    expect(() => authorizeAdjustment(local, "sede-1", locked, inside, "pedido")).not.toThrow();
  });

  it("allows talla changes when not locked and the adjustment window is open", () => {
    expect(() => authorizeAdjustment(local, "sede-1", base, inside, "talla")).not.toThrow();
  });

  it("does not invoke a write callback when a sede is unauthorized", async () => {
    const persist = vi.fn(async () => "persisted");
    await expect(executeAuthorizedAdjustment(local, "sede-2", base, inside, "pedido", persist))
      .rejects.toMatchObject({ code: "SEDE_FORBIDDEN" });
    expect(persist).not.toHaveBeenCalled();
  });

  it("does not invoke a write callback when the period is closed", async () => {
    const persist = vi.fn(async () => "persisted");
    await expect(executeAuthorizedAdjustment(local, "sede-1", base, base.closesAtUtc, "pedido", persist))
      .rejects.toMatchObject({ code: "WINDOW_EXPIRED" });
    expect(persist).not.toHaveBeenCalled();
  });

  it("executes a validated write with an explicit sede", async () => {
    const persist = vi.fn(async (sede: string) => ({ sede, saved: true }));
    await expect(executeAuthorizedAdjustment(local, "sede-1", base, inside, "pedido", persist))
      .resolves.toEqual({ sede: "sede-1", saved: true });
    expect(persist).toHaveBeenCalledExactlyOnceWith("sede-1");
  });
});
