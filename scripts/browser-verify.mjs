#!/usr/bin/env node
"use strict";

// Isolated Chromium QA: synthetic-only, no authenticated personal browser sessions.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { SignJWT } from "jose";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const basePort = Number(process.env.QA_PORT || "36197");
const baseUrl = "http://127.0.0.1:" + basePort;
const qaSessionSecret = randomBytes(48).toString("hex");
const runId = "qa-" + new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(root, "artifacts", "qa", runId);
const summaryPath = path.join(root, "docs", "ship", "evidence", "latest-browser.json");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });

const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const trackedDiff = execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" }).trim();
const dirtySource = trackedDiff.split("\n").filter((file) =>
  file && file !== "graph-harness.events.jsonl" && !file.startsWith("docs/ship/evidence/")
);
const lockfileSha = createHash("sha256").update(fs.readFileSync(path.join(root, "package-lock.json"))).digest("hex");
const result = {
  runId,
  environment: "isolated Next.js production build served by next start, unreachable synthetic backend adapter, no enterprise integrations",
  backendIsSyntheticStub: true,
  sourceSha: sha,
  sourceShaIsExact: dirtySource.length === 0,
  workingTreeDirty: trackedDiff.length > 0,
  lockfileSha256: lockfileSha,
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
  // Run the actual compiled production bundle, never Next dev. Next start
  // emits a standalone-advisory for this project, but serves the same built
  // routes and static assets. Container packaging is a separate operations gate.
  if (!fs.existsSync(path.join(root, ".next", "BUILD_ID"))) {
    throw new Error("Production build is missing: run npm run build first");
  }
  const output = fs.createWriteStream(path.join(outDir, "server.log"));
  server = spawn(process.execPath, [
    path.join(root, "node_modules", "next", "dist", "bin", "next"),
    "start", "-p", String(basePort),
  ], {
    cwd: root,
    env: Object.assign({}, process.env, {
      NODE_ENV: "production",
      DEMO_MODE: "false",
      DEMO_LOGIN_ENABLED: "false",
      BACKEND_API_BASE_URL: "http://127.0.0.1:65534",
      APP_SESSION_SECRET: qaSessionSecret,
      DEMO_OPERARIO_PASSWORD: randomBytes(24).toString("hex"),
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
    if (server.exitCode !== null) throw new Error("Production QA server terminated early: " + server.exitCode);
    try {
      const response = await fetch(baseUrl + "/api/health", { signal: AbortSignal.timeout(2500) });
      if (response.ok) {
        const payload = await response.json();
        check(payload.status === "ok" && payload.mode === "backend", "production build starts without in-memory demo mode");
        check(payload.backendConfigured === true, "synthetic adapter URL configured (not a real backend)");
        return;
      }
    } catch { /* server may still be compiling */ }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Production QA server did not become ready within 75 seconds");
}

// Synthetic, locally signed sessions exercise actual server authorization without
// corporate users, browser profile access, enterprise credentials or a live backend.
async function setQaSession(context, role, sedeIds) {
  const user = {
    id: "synthetic-" + role,
    name: "QA Synthetic Actor",
    roles: [role],
    sedeIds,
    preferredSedeId: sedeIds[0],
  };
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(qaSessionSecret));
  await context.addCookies([
    { name: "argos_session", value: token, url: baseUrl, sameSite: "Lax" },
    { name: "argos_csrf", value: "qa-synthetic-csrf", url: baseUrl, sameSite: "Lax" },
  ]);
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
    await page.getByRole("heading", { name: "ARGOS" }).waitFor({ state: "visible" });
    check(await page.getByRole("heading", { name: "ARGOS" }).isVisible(), name + ": accessible Argos heading");
    check(await page.getByRole("button", { name: "Iniciar sesión con Microsoft" }).isDisabled(),
      name + ": SSO disabled when not configured");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 2, name + ": no horizontal viewport overflow (" + overflow + "px)");

    const unauthorized = await context.request.get(baseUrl + "/api/pedidos");
    check(unauthorized.status() === 401, name + ": anonymous order API request denied");

    check(await page.getByRole("button", { name: "Entrar en modo demo administrativo" }).count() === 0,
      name + ": demo admin action hidden from production UI");
    check(await page.getByRole("button", { name: "Ingresar como operario" }).count() === 0,
      name + ": unapproved operario login hidden from production UI");

    const demoDenied = await context.request.post(baseUrl + "/api/auth/session/demo", {
      headers: { origin: baseUrl },
    });
    check(demoDenied.status() === 403, name + ": demo API blocked server-side in production");
    check((await context.cookies()).every((cookie) => cookie.name !== "argos_session"),
      name + ": rejected login did not create session");

    await setQaSession(context, "UsuarioFinal", ["SEDE-CENTRAL"]);
    const finalRead = await context.request.get(baseUrl + "/api/pedidos");
    check(finalRead.status() === 403 && (await finalRead.json()).error === "No autorizado",
      name + ": UsuarioFinal denied order read by RBAC, not by missing session");

    const finalWrite = await context.request.post(baseUrl + "/api/pedidos", {
      headers: { origin: baseUrl, "x-csrf-token": "qa-synthetic-csrf" },
      data: {},
    });
    check(finalWrite.status() === 403 && (await finalWrite.json()).error === "No autorizado",
      name + ": UsuarioFinal denied order mutation with valid CSRF");

    const finalStock = await context.request.get(baseUrl + "/api/inventario/stock");
    check(finalStock.status() === 403 && (await finalStock.json()).error === "No autorizado",
      name + ": UsuarioFinal denied inventory read by RBAC");

    await setQaSession(context, "UsuarioPedidos", ["SEDE-CENTRAL"]);
    const pedidosStock = await context.request.get(baseUrl + "/api/inventario/stock");
    check(pedidosStock.status() === 403 && (await pedidosStock.json()).error === "No autorizado",
      name + ": UsuarioPedidos denied inventory read");

    const pedidosWrite = await context.request.post(baseUrl + "/api/pedidos", {
      headers: { origin: baseUrl, "x-csrf-token": "qa-synthetic-csrf" },
      data: {},
    });
    check(pedidosWrite.status() === 403 && (await pedidosWrite.json()).error === "No autorizado",
      name + ": UsuarioPedidos cannot mutate order with valid CSRF");

    await setQaSession(context, "OperarioBodega", ["SEDE-CENTRAL"]);
    const legacyMovement = await context.request.post(baseUrl + "/api/inventario/movimientos", {
      headers: { origin: baseUrl, "x-csrf-token": "qa-synthetic-csrf" },
      data: {},
    });
    check(legacyMovement.status() === 403 && (await legacyMovement.json()).error === "No autorizado",
      name + ": legacy OperarioBodega denied inventory mutation");

    await setQaSession(context, "AdminLocal", ["sede-centro"]);
    const foreignOrder = await context.request.post(baseUrl + "/api/pedidos", {
      headers: { origin: baseUrl, "x-csrf-token": "qa-synthetic-csrf" },
      data: {
        sedeId: "sede-norte",
        empleadoNombre: "Persona QA Sintética",
        areaNombre: "Área de pruebas",
        prioridad: "Media",
        detalles: [{ itemNombre: "Camisa", talla: "M", cantidad: 1 }],
      },
    });
    check(foreignOrder.status() === 403 && (await foreignOrder.json()).error === "Sede no autorizada",
      name + ": AdminLocal cross-site order rejected before remote backend");

    const foreignStockMovement = await context.request.post(baseUrl + "/api/inventario/movimientos", {
      headers: { origin: baseUrl, "x-csrf-token": "qa-synthetic-csrf" },
      data: {
        sedeId: "sede-norte", tipo: "Ingreso", itemNombre: "Camisa",
        bodegaNombre: "Bodega QA", ubicacionNombre: "Estante QA", cantidad: 2,
      },
    });
    check(foreignStockMovement.status() === 403 &&
      (await foreignStockMovement.json()).error === "Sede no autorizada",
      name + ": AdminLocal cross-site inventory mutation rejected before remote backend");

    await setQaSession(context, "SuperAdmin", ["*"]);
    const noSedeAdmin = await context.request.post(baseUrl + "/api/pedidos", {
      headers: { origin: baseUrl, "x-csrf-token": "qa-synthetic-csrf" },
      data: {
        empleadoNombre: "Persona QA Sintética",
        areaNombre: "Área de pruebas",
        prioridad: "Media",
        detalles: [{ itemNombre: "Camisa", talla: "M", cantidad: 1 }],
      },
    });
    check(noSedeAdmin.status() === 403 && (await noSedeAdmin.json()).error === "Sede no autorizada",
      name + ": SuperAdmin must explicitly target a real site for writing");

    await setQaSession(context, "AdminLocal", ["*"]);
    const unauthorizedWildcard = await context.request.get(baseUrl + "/api/pedidos");
    check(unauthorizedWildcard.status() === 401,
      name + ": AdminLocal global wildcard token rejected before authorization");

    await page.screenshot({ path: path.join(outDir, name + ".png"), fullPage: true });
    record.result = "PASS";
  } catch (err) {
    logFailure(name, err);
    try { await page.screenshot({ path: path.join(outDir, name + "-failure.png"), fullPage: true }); } catch {}
  } finally {
    try {
      await context.tracing.stop({ path: path.join(outDir, name + "-trace.zip") });
    } catch (err) {
      record.result = "FAIL";
      logFailure(name + ": trace collection", err);
    }
    try {
      await context.close();
    } catch (err) {
      logFailure(name + ": context cleanup", err);
    }
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
