# SHIP evidence snapshot — 2026-10-26 UTC

Graph Harness events are authoritative for node status; this file is an independent
summary of commands executed on an isolated QA consumer of the September 2026 scope.

| Test category | Verified result | Trace |
| --- | --- | --- |
| TypeScript | PASS | `evidence/engineering-typecheck.log` |
| ESLint | PASS | `evidence/engineering-lint.log` |
| Vitest | 91/91 PASS | `evidence/engineering-test.log` |
| Next.js production build | PASS using default Turbopack | `evidence/engineering-build.log` |
| npm audit | 0 vulnerabilities reported | `evidence/dependency-audit.json` |
| Playwright Chromium | 59/59 PASS, desktop/tablet/mobile | `evidence/latest-browser.json`, `evidence/qa-manifest.json` |
| Explicit out-of-sede write tests | 17/17 PASS in focused suite | `evidence/negative-SEC-005.log` |
| Real Azure/Entra/SSFF/SAP/Graph/Signature | NOT VERIFIED | External permissions, environment and signoff outstanding |
| SQL persistence / rollback / concurrency | NOT IMPLEMENTED AS APPROVED BUSINESS STORAGE | Awaiting architecture and infrastructure decisions |
| Business E2E and UAT | NOT EXECUTED | No approved real transactional backend |
| Release recommendation | NO-GO | Await all global SHIP release gates |

The Playwright server uses the compiled Next.js production build but points its
backend adapter to a deliberately unreachable loopback URL. Synthetic JWTs
exercise actual server-side RBAC and site guards, not Microsoft login.
Neither production operations nor legal signature validation can be inferred.

Raw screenshot, trace ZIP, and execution logs remain in the local ignored
`artifacts/qa/` run folder; exact paths and SHA-256 hashes are in the manifest.
The CI workflow uploads those artifacts from each remote run after execution.
