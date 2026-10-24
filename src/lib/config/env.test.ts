import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("fail-closed production configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PHASE", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_MODE", "false");
    vi.stubEnv("DEMO_LOGIN_ENABLED", "false");
    vi.stubEnv("BACKEND_API_BASE_URL", "");
    vi.stubEnv("APP_SESSION_SECRET", "");
    vi.stubEnv("DEMO_OPERARIO_PASSWORD", "A-distinct-nonproduction-password");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("rejects production with an absent persistent backend", async () => {
    await expect(import("./env")).rejects.toThrow(
      /Producción requiere un backend persistente/,
    );
  });

  it("rejects explicitly forced demo mode in production", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    await expect(import("./env")).rejects.toThrow(/DEMO_MODE=true/);
  });

  it("rejects demo login even when a backend is configured", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "https://api.example.invalid");
    vi.stubEnv("APP_SESSION_SECRET", "a-secure-test-only-session-secret-of-32-characters");
    vi.stubEnv("DEMO_LOGIN_ENABLED", "true");
    await expect(import("./env")).rejects.toThrow(/DEMO_LOGIN_ENABLED=true/);
  });

  it("rejects a default session secret in non-demo production", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "https://api.example.invalid");
    await expect(import("./env")).rejects.toThrow(/APP_SESSION_SECRET/);
  });

  it("accepts a configured backend and strong session secret in production", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "https://api.example.invalid");
    vi.stubEnv("APP_SESSION_SECRET", "a-secure-test-only-session-secret-of-32-characters");
    const { isDemoMode, hasBackendApiConfig } = await import("./env");
    expect(hasBackendApiConfig()).toBe(true);
    expect(isDemoMode()).toBe(false);
  });

  it("preserves in-memory demo mode for isolated development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { isDemoMode } = await import("./env");
    expect(isDemoMode()).toBe(true);
  });

  it("allows Next.js to compile without runtime secrets during its build phase", async () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    const { isDemoMode } = await import("./env");
    expect(isDemoMode()).toBe(true);
  });
});
