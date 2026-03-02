import "server-only";

import { env, isTurnstileConfigured } from "@/lib/config/env";

type TurnstileVerifyResponse = {
  success: boolean;
  ["error-codes"]?: string[];
};

export type CaptchaVerificationResult = {
  ok: boolean;
  bypassed?: boolean;
  reason?: "missing-token" | "invalid-token" | "provider-http-error" | "provider-request-failed";
  details?: string;
};

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const CAPTCHA_VERIFY_TIMEOUT_MS = 7000;

export const verifyOperarioCaptcha = async (
  captchaToken: string | undefined,
  remoteIp?: string,
): Promise<CaptchaVerificationResult> => {
  if (!isTurnstileConfigured()) {
    return { ok: true, bypassed: true };
  }

  const token = captchaToken?.trim();
  if (!token) {
    return { ok: false, reason: "missing-token" };
  }

  try {
    const body = new URLSearchParams({
      secret: env.turnstile.secretKey,
      response: token,
    });

    if (remoteIp) {
      body.append("remoteip", remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(CAPTCHA_VERIFY_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: "provider-http-error",
        details: `Turnstile respondió HTTP ${response.status}`,
      };
    }

    const payload = (await response.json()) as TurnstileVerifyResponse;
    if (!payload.success) {
      return {
        ok: false,
        reason: "invalid-token",
        details: payload["error-codes"]?.join(","),
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "provider-request-failed",
      details: error instanceof Error ? error.message : undefined,
    };
  }
};
