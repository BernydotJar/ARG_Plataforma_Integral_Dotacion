# SHIP | RF traceability (Sept 2026)

> Status UNVERIFIED is deliberate: existing routes are candidates, not completed implementations. No customer PDFs or commercial terms are stored here.

| RF | Area | Objetivo | Candidato de codigo (no validado) | Test/E2E | Evidencia | Estado |
|---|---|---|---|---|---|---|
| RF-01 | Identity | SSO corporativo Entra ID | `src/lib/auth/session.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-02 | Identity | Autenticacion dual aprobada | `src/app/api/auth/session/operario/route.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-03 | Security | CAPTCHA y mitigacion de fuerza bruta | `src/lib/auth/captcha.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-04 | Identity | Politica de credenciales usuarios no digitales | `src/lib/auth/session.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-05 | Master Data | Migracion masiva inicial | `src/lib/dataverse/repositories/admin.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-06 | SuccessFactors | Ingesta semanal SSFF por SFTP | `src/lib/integrations/ssff.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-07 | SuccessFactors | Altas reingresos y bajas | `src/lib/integrations/ssff.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-08 | Master Data | Sincronizacion y alias de sedes | `src/lib/dataverse/repositories/admin.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-09 | Master Data | Sedes temporales controladas | `src/lib/dataverse/repositories/admin.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-10 | Identity | Asignacion y revocacion de roles | `src/lib/auth/roles.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-11 | Master Data | Administracion local por sede | `src/lib/dataverse/repositories/admin.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-12 | Tallas | Carga masiva de tallas Excel | `src/lib/dataverse/repositories/admin.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-13 | Tallas | Ventanas de bloqueo de ajustes | `src/lib/dotacion/cycle-policy.ts` (solo reglas; API/SQL pendiente) | `cycle-policy.test.ts` + `cycle-policy.integration.test.ts` | Nodo `DOMAIN-CYCLE-001` (ledger SHIP) | CONTRATO VALIDADO; RF NO CERRADO |
| RF-14 | Tallas | Actualizacion individual de tallas | `src/lib/dataverse/repositories/admin.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-15 | Entregas | Entrega fechada con evidencia de firma | `src/lib/dataverse/repositories/inventario.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-16 | Entregas | Cambio de talla en entrega | `src/lib/dataverse/repositories/inventario.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-17 | Entregas | Faltantes novedades y observaciones | `src/lib/dataverse/repositories/inventario.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-18 | Firma | Constancia remitida a SUMMA via Graph | `src/lib/flows/triggers.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-19 | Entregas | Entrega anticipada sin duplicacion de ciclo | `src/lib/dotacion/solped-eligibility.ts` (pre-filtro; sin archivo SAP) | `solped-eligibility.test.ts` + `solped-eligibility.integration.test.ts` | Nodo `DOMAIN-SOLPED-001` (ledger SHIP) | CONTRATO VALIDADO; RF NO CERRADO |
| RF-20 | Firma | Constancia PDF por ciclo y sede | No identificado | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-21 | Pedidos | Ajustes y Excel en ventana habilitada | `src/lib/dotacion/cycle-policy.ts` (solo reglas; API/SQL pendiente) | `cycle-policy.test.ts` + `cycle-policy.integration.test.ts` | Nodo `DOMAIN-CYCLE-001` (ledger SHIP) | CONTRATO VALIDADO; RF NO CERRADO |
| RF-22 | SOLPED | Archivo plano SAP con exclusion semestral | `src/lib/dotacion/solped-eligibility.ts` (pre-filtro; sin archivo SAP) | `solped-eligibility.test.ts` + `solped-eligibility.integration.test.ts` | Nodo `DOMAIN-SOLPED-001` (ledger SHIP) | CONTRATO VALIDADO; RF NO CERRADO |
| RF-23 | Pedidos | Validaciones por administrador y periodo | `src/app/(portal)/pedidos/page.tsx` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-24 | Pedidos | Configuracion de apertura y cierre | `src/lib/dotacion/cycle-policy.ts` (solo reglas; API/SQL pendiente) | `cycle-policy.test.ts` + `cycle-policy.integration.test.ts` | Nodo `DOMAIN-CYCLE-001` (ledger SHIP) | CONTRATO VALIDADO; RF NO CERRADO |
| RF-25 | Reporting | Reporte de colaboradores por sede | `src/lib/dataverse/repositories/dashboard.service.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-26 | Reporting | Reporte plano facturacion SOLPED | `src/lib/dataverse/repositories/pedidos.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-27 | Reporting | Reporte de entregas Excel y PDF | No identificado | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-28 | Master Data | Cargas maestras recurrentes | `src/lib/dataverse/repositories/admin.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-29 | Master Data | Maestro materiales y codigos proveedor | `src/lib/dataverse/repositories/admin.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-30 | Master Data | Centros costo-sedes N:M | `src/lib/dataverse/repositories/admin.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-31 | Master Data | Direcciones entrega por sede | `src/lib/dataverse/repositories/admin.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-32 | Master Data | Deshabilitar sedes sin activos | `src/lib/dataverse/repositories/admin.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-33 | SuccessFactors | Bandeja ultimo lote de novedades | `src/lib/integrations/ssff.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-34 | Master Data | Relacion administradores-sedes N:M | `src/lib/dataverse/repositories/admin.repository.ts` | PENDIENTE | PENDIENTE | UNVERIFIED |
| RF-35 | Reporting | Visibilidad de reportes por rol | No identificado | PENDIENTE | PENDIENTE | UNVERIFIED |
