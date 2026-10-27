# ADR-001 | Decision on transactional backend (PROPOSED — NOT APPROVED)

**Status:** Proposed / awaiting SUMMA architecture decision.
**Scope:** September 2026 requirements for Regional Colombia only.
**No migration is authorized by this document alone.**

## Verified current state

The current Next.js 16 frontend/BFF uses REST repositories under `src/lib/dataverse/repositories`,
an in-memory demo store, and an HTTP client expecting an external .NET 8 backend that is not in
this checkout. No Azure SQL migrations are present in this repository. The demo is not a
transactional enterprise backend. Existing quality and maintenance modules and Power Automate
triggers derive from a broader prototype and are not automatically part of the updated scope.

## Alternatives

| Option | Advantages | Risks and costs |
| --- | --- | --- |
| A. Keep external .NET 8 API | Reuses existing REST interface; .NET operational familiarity | Missing backend repository and integration evidence; two deployment units and BFF/API duplication |
| B. Next.js server-side modular monolith + Azure SQL | One cohesive deployment boundary; reuse React/TypeScript, consistent identity and transaction services; less orchestration | New SQL repository adapters, schema/migrations, data migration, pooled connection strategy and independent security QA |
| C. Separate new microservices | Independent scaling | Disproportionate operations, distributed transaction and integration complexity for current regional scope |

## Proposed direction

Prefer **B**, conditional on documented SUMMA/Argos architecture approval, infrastructure
availability, a tested migration plan, and confirmation of compliance requirements.
Do not delete the existing API adapter or change production configuration until equivalent
functional and security gates pass in a controlled environment.

Define explicit server-side domain boundaries for Master Data, SSFF ingestion, Tallas,
Pedidos/SOLPED, Entregas/Firma, Inventory and Reporting. Use transactional SQL storage,
outbox/idempotency for external delivery, and Azure managed integrations when approved.
Browser clients must never access the database directly. The application must enforce
role and sede access at the service layer, not only in visual UI filters.

## Migration sequence if approved

1. Agree entity lifecycle, IDs, concurrency/versioning, audit and retention constraints.
2. Create reviewed SQL schema, migration strategy, transaction and rollback tests.
3. Introduce repository interface behind current BFF routes, no forced demo fallback.
4. Validate controlled synthetic end-to-end order-to-delivery process in QA.
5. Integrate SFTP, Graph and signature providers only with approved accounts and evidence.
6. Run security/performance/restore/UAT gates; production promotion requires separate signoff.

## Required approvals / open questions

- Decide whether architecture B supersedes the baseline external .NET API.
- Confirm Azure SQL tier, network/managed identity, DEV/QA/PROD and cost ownership.
- Confirm current organizational security design, WAF, audit retention, RTO/RPO.
- Confirm SOLPED layout and SSFF file contract; no schema assumptions in production.
- Resolve RF-02, RF-04 and RF-24 users without corporate credentials.
