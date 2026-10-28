/* eslint-disable @typescript-eslint/no-require-imports -- Azure standalone CommonJS entrypoint */
"use strict";
/** Dependency-free, read-only preview. No business sessions or mutations. */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const routes = Object.freeze({
  "/":"index.html", "/login":"index.html", "/preview":"index.html",
  "/pedidos":"pedidos.html", "/inventario":"inventario.html", "/catalogos":"catalogos.html",
  "/style.css":"style.css", "/argos-logo.webp":"argos-logo.webp", "/robots.txt":"robots.txt"
});
const mime = {
  ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8",
  ".webp":"image/webp", ".txt":"text/plain; charset=utf-8"
};
const headers = Object.freeze({
  "Cache-Control":"no-store",
  "X-Content-Type-Options":"nosniff",
  "X-Frame-Options":"DENY",
  "Referrer-Policy":"strict-origin-when-cross-origin",
  "X-Robots-Tag":"noindex,nofollow,noarchive",
  "Content-Security-Policy":"default-src 'none'; style-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
});
const server = http.createServer((req,res)=>{
  let route;
  try {
    route = new URL(req.url,"http://localhost").pathname.replace(/\/$/,"") || "/";
  } catch {
    res.writeHead(400,headers).end("Solicitud no válida");
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405,{...headers,"Allow":"GET, HEAD"}).end("Vista de solo lectura");
    return;
  }
  if (route === "/api/health") {
    res.writeHead(200,{...headers,"Content-Type":"application/json; charset=utf-8"})
      .end(JSON.stringify({status:"ok",mode:"preview",readOnly:true,backendConfigured:false}));
    return;
  }
  if (route.startsWith("/api/")) {
    res.writeHead(403,{...headers,"Content-Type":"application/json; charset=utf-8"})
      .end(JSON.stringify({error:"No hay APIs de negocio en este preview"}));
    return;
  }
  const file = routes[route];
  if (!file) {
    res.writeHead(404,headers).end("Esta sección no forma parte de la demostración.");
    return;
  }
  fs.readFile(path.join(__dirname,file),(error,data)=>{
    if (error) {
      res.writeHead(500,headers).end();
      return;
    }
    res.writeHead(200,{...headers,"Content-Type":mime[path.extname(file)]||"application/octet-stream","Content-Length":data.length});
    res.end(req.method === "HEAD" ? undefined : data);
  });
});
server.listen(Number(process.env.PORT||3000),process.env.HOSTNAME||"0.0.0.0");
