#!/usr/bin/env node
"use strict";

// Isolated Chromium QA: synthetic-only, no authenticated personal browser sessions.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFileSync } from "node:child_process";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const basePort = Number(process.env.QA_PORT || "36197");
const baseUrl = "http://127.0.0.1:" + basePort;
const runId = "qa-" + new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(root, "artifacts", "qa", runId);
const summaryPath = path.join(root, "docs", "ship", "evidence", "latest-browser.json");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });

const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const result = {
  runId,
  environment: "isolated next dev, synthetic demo, no enterprise integrations",
  sourceSha: sha,
  platform: process.platform,
  engine: "Playwright Chromium headless",
  assertions: [],
  viewports: [],
  integrationsReal: false,
  result: "FAIL",
};
let server;
let browser;

function check(condition, label) {
  assert.ok(condition, label);
  result.assertions.push({ label, result: "PASS" });
}

function logFailure(label, err) {
  result.assertions.push({ label, result: "FAIL", message: String(err.message || err).slice(0, 500) });
}

function startServer() {
  const output = fs.createWriteStream(path.join(outDir, "server.log"));
  server = spawn(process.execPath, [
    path.join(root, "node_modules", "next", "dist", "bin", "next"), "dev", "-p", String(basePort),
  ], {
    cwd: root,
    env: Object.assign({}, process.env, {
      NODE_ENV: "development",
      DEMO_MODE: "true",
      DEMO_LOGIN_ENABLED: "false",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
      NEXT_PUBLIC_ENTRA_CLIENT_ID: "",
      NEXT_PUBLIC_ENTRA_TENANT_ID: "",
      APP_ORIGIN: baseUrl,
      NEXT_TELEMETRY_DISABLED: "1",
    }),
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.pipe(output);
  server.stderr.pipe(output);
}

async function awaitReady() {
  const end = Date.now() + 75000;
  while (Date.now() < end) {
    if (server.exitCode !== null) throw new Error("Next dev terminated early: " + server.exitCode);
    try {
      const response = await fetch(baseUrl + "/api/health", { signal: AbortSignal.timeout(2500) });
      if (response.ok) {
        const payload = await response.json();
        check(payload.status === "ok" && payload.mode === "demo", "health advertises controlled demo mode");
        check(payload.backendConfigured === false, "no real backend claimed in isolated QA");
        return;
      }
    } catch { /* server may still be compiling */ }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Next dev did not become ready within 75 seconds");
}

async function verifyViewport(name, width, height) {
  const context = await browser.newContext({
    locale: "es-CO",
    timezoneId: "America/Bogota",
    colorScheme: "light",
    reducedMotion: "reduce",
    viewport: { width, height },
    serviceWorkers: "block",
  });
  const record = { name, width, height, result: "FAIL" };
  result.viewports.push(record);
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);
  try {
    const response = await page.goto(baseUrl + "/login", { waitUntil: "domcontentloaded" });
    check(response && response.status() === 200, name + ": login HTTP 200");
    await page.getByRole("button", { name: "Entrar en modo demo administrativo" }).waitFor({ state: "visible" });
    check(await page.getByRole("heading", { name: "ARGOS" }).isVisible(), name + ": accessible Argos heading");
    check(await page.getByRole("button", { name: "Iniciar sesión con Microsoft" }).isDisabled(),
      name + ": SSO disabled when not configured");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 2, name + ": no horizontal viewport overflow (" + overflow + "px)");

    const unauthorized = await context.request.get(baseUrl + "/api/pedidos");
    check(unauthorized.status() === 401, name + ": anonymous order API request denied");

    const [demoDenied] = await Promise.all([
      page.waitForResponse((item) => item.url().endsWith("/api/auth/session/demo") && item.request().method() === "POST"),
      page.getByRole("button", { name: "Entrar en modo demo administrativo" }).click(),
    ]);
    check(demoDenied.status() === 403, name + ": demo admin login denied without explicit enablement");
    check((await context.cookies()).every((cookie) => cookie.name !== "argos_session"),
      name + ": rejected demo login did not create session");
    await page.screenshot({ path: path.join(outDir, name + ".png"), fullPage: true });
    record.result = "PASS";
  } catch (err) {
    logFailure(name, err);
    try { await page.screenshot({ path: path.join(outDir, name + "-failure.png"), fullPage: true }); } catch {}
  } finally {
    await context.tracing.stop({ path: path.join(outDir, name + "-trace.zip") });
    await context.close();
  }
}

async function run() {
  try {
    startServer();
    await awaitReady();
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_BIN || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    for (const [name, width, height] of [
      ["desktop-1440", 1440, 900],
      ["tablet-768", 768, 1024],
      ["mobile-390", 390, 844],
    ]) await verifyViewport(name, width, height);
    result.result = result.viewports.every((v) => v.result === "PASS") ? "PASS" : "FAIL";
  } catch (err) {
    logFailure("runner", err);
  } finally {
    if (browser) await browser.close();
    if (server) server.kill("SIGTERM");
    result.artifacts = { localRoot: path.relative(root, outDir), countViewports: result.viewports.length };
    fs.writeFileSync(path.join(outDir, "result.json"), JSON.stringify(result, null, 2) + "\n");
    fs.writeFileSync(summaryPath, JSON.stringify(result, null, 2) + "\n");
    console.log(JSON.stringify(result, null, 2));
    if (result.result !== "PASS") process.exitCode = 1;
  }
}
run();
