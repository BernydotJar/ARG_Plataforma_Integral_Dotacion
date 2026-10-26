# Argos SHIP | Evidence-backed external dependencies

This is a decision/dependency register, not a competing task scheduler.
Node status and revision are authoritative only in `graph-harness.events.jsonl`.

| Area | Exact dependency | Independent safe work | Closure evidence |
| --- | --- | --- | --- |
| Commercial baseline | Locate and approve final September 2026 DATTICS deliverables; older Power Platform/WebCustom documents are not the final scope | Scope matrix uses updated 35 RF only | Signed/approved final deliverables baseline |
| Architecture | SUMMA approves modular-monolith/SQL replacement vs external .NET API | Proposed ADR-001; preserve existing adapter | Approved architectural decision and migration plan |
| Identity | Entra tenant/app registration, enterprise group mapping, non-digital access behavior (RF-02, RF-04, RF-24) | JWT/RBAC negative tests with synthetic actors | Corporate SSO/MFA session and server-side authorization UAT |
| Data | Azure SQL network/credentials/identity, DDL acceptance and retention policy | SQL models and isolated transactional contract tests after ADR | QA migration, concurrent transaction and restoration evidence |
| SSFF | Authorized SFTP endpoint, schema, cadence, excludes and representative sanitized files | Synthetic parser and idempotent reconciliation tests | Successful approved SFTP ingestion with reconciliation evidence |
| SAP | Definitive SOLPED file layout, codes, delimiters and expected validation | Contract parser/export tests with synthetic records | Client-verified roundtrip and SAP acceptance of generated file |
| Signature | Accepted legal/evidence mechanism, Adobe Sign availability | Provider-agnostic adapter and controlled mock | Authorized provider UAT and legal/functional acceptance |
| Email | MS Graph permissions and SUMMA controlled mailbox | Outbox and delivery error/retry tests | Confirmed delivery and audit trace to authorized mailbox |
| Security | Approved WAF, pen-test provider, access to environments | Negative security tests, scans | Independent review and remediated findings |
| Operations | Agreed RTO, RPO, SLA, backup/retention and monitoring policies | Runbooks and non-prod restore rehearsal | Signed recovery objectives and successful restore test |
| Release | QA/UAT environment, representative synthetic users and human release signoff | Isolated Playwright scenarios and reproducible gates | Final SHA UAT PASS and independent production authorization |

No paid resources, real employee communications, personal data, or production changes
are authorized by these notes. The top-level original RFQ is historical; the September
2026 35-RF scope is the development baseline. The original technical annex contains
SaaS-specific questionnaire rows that require applicability review, not a multitenancy mandate.

## Verified QA execution environment blocker (2026-10-24 UTC)

The shared Cloud Sandbox dev-main workstation had ~7.7 GiB RAM, exhausted 1 GiB swap
and sustained load averages above 50 during Next.js compilation. The original
and upgraded production builds did not finish within an explicit time budget.
Isolated Chromium reached the QA health endpoint and wrote a trace but did not
load /login within 25 seconds; the actual Browser Gate remains FAIL. Evidence:
`evidence/build-result.json`, `evidence/browser-result.json`,
`evidence/latest-browser.json`. The retry should use an isolated executor
with sufficient capacity; do not clear other projects or terminate unrelated services.

## Actualización verificada en entorno QA — 26 octubre 2026

- `npm run build` concluyó con Turbopack al retirar el flag legado `--webpack`.
- Playwright navegó el build de producción con `next start` en un servidor aislado; no está acreditado el empaquetado standalone para Azure.
- El servidor de QA utiliza URL de backend sintética no disponible; ninguna integración empresarial E2E se considera operativa.
- Las suites negativas de identidad, pedidos e inventario se ejecutaron con actores sintéticos, sin permisos corporativos reales.
