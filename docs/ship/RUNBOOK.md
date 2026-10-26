# Graph Harness SHIP | Non-production runbook

Pinned framework: see `runtime-pin.json`. The Graph Harness kernel must remain separate
from Argos. Do not install an unpinned `latest` or point to a different product checkout.

Use an exact clean checkout of the pinned Graph Harness commit and export its root via
`PYTHONPATH`. With the framework available:

```sh
python3 scripts/verify_ship_graph.py --runtime-checkout /path/to/pinned/Graph-harness-sdlc
python3 -m graph_harness --project graph-harness.project.json --events graph-harness.events.jsonl validate
python3 -m graph_harness --project graph-harness.project.json --events graph-harness.events.jsonl status --pretty
python3 -m graph_harness --project graph-harness.project.json --events graph-harness.events.jsonl ready
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Never manually change an append-only ledger line, force transitions, or fabricate
evidence IDs. A new feature changes the project graph through review; a completed
node must pass every current-revision gate. Evidence artifacts are hashed and
must reference the actual source commit and test environment. Production needs
separate human authorization regardless of CI result.

The QA browser strategy is isolated headless Playwright Chromium first.
No browser E2E success is claimed until assertions, traces, screenshots,
run ID, source SHA, and environment are captured.

## QA production-build browser routine

Build first using `npm run build` (Turbopack on Next.js 16.4.x), then run
`CHROMIUM_BIN=/usr/bin/chromium npm run test:e2e` on the workstation.
The browser runner uses `next start` on a compiled build, not `next dev`,
and synthetic JWTs plus an unreachable loopback API endpoint.
It writes screenshots, Playwright traces and JSON to ignored `artifacts/qa/`;
`docs/ship/evidence/qa-manifest.json` records file hashes. This does not
verify corporate SSO, real backend, transactional operations, or standalone
Azure container packaging. Those remain separate acceptance gates.
