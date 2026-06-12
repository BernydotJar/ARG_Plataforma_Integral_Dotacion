import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkAuthRateLimit, registerAuthAttempt } from "@/lib/auth/rate-limit";
import { env } from "@/lib/config/env";

// El estado del rate limiter vive en un Map a nivel de módulo: cada test usa
// una clave única para no interferir con los demás.
let keyCounter = 0;
const uniqueKey = () => `test-key-${keyCounter++}`;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("registerAuthAttempt", () => {
  it("permite intentos hasta alcanzar el máximo configurado", () => {
    const key = uniqueKey();

    for (let attempt = 1; attempt < env.authRateLimit.maxAttempts; attempt += 1) {
      const status = registerAuthAttempt(key, false);
      expect(status.allowed).toBe(true);
    }

    const blocked = registerAuthAttempt(key, false);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(env.authRateLimit.lockMs);
  });

  it("un intento exitoso limpia el contador de fallos", () => {
    const key = uniqueKey();

    registerAuthAttempt(key, false);
    registerAuthAttempt(key, false);
    const success = registerAuthAttempt(key, true);
    expect(success.allowed).toBe(true);
    expect(success.remaining).toBe(env.authRateLimit.maxAttempts);

    const next = checkAuthRateLimit(key);
    expect(next.allowed).toBe(true);
    expect(next.remaining).toBe(env.authRateLimit.maxAttempts);
  });

  it("mantiene el bloqueo hasta que expira lockMs", () => {
    const key = uniqueKey();

    for (let attempt = 0; attempt < env.authRateLimit.maxAttempts; attempt += 1) {
      registerAuthAttempt(key, false);
    }

    expect(checkAuthRateLimit(key).allowed).toBe(false);

    vi.advanceTimersByTime(env.authRateLimit.lockMs + env.authRateLimit.windowMs + 1);
    expect(checkAuthRateLimit(key).allowed).toBe(true);
  });

  it("reinicia la ventana después de windowMs sin alcanzar el máximo", () => {
    const key = uniqueKey();

    registerAuthAttempt(key, false);
    registerAuthAttempt(key, false);

    vi.advanceTimersByTime(env.authRateLimit.windowMs + 1);

    const status = registerAuthAttempt(key, false);
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(env.authRateLimit.maxAttempts - 1);
  });
});

describe("checkAuthRateLimit", () => {
  it("permite por defecto a claves sin historial", () => {
    const status = checkAuthRateLimit(uniqueKey());
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(env.authRateLimit.maxAttempts);
  });
});
