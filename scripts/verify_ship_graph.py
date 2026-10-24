#!/usr/bin/env python3
"""Non-orchestrating consistency checks for the Argos Graph Harness consumer contract."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(runtime_checkout: str | None = None) -> dict:
    project = json.loads((ROOT / "graph-harness.project.json").read_text(encoding="utf-8"))
    pin = json.loads((ROOT / "docs/ship/runtime-pin.json").read_text(encoding="utf-8"))
    manifest = json.loads((ROOT / "docs/ship/source-manifest.json").read_text(encoding="utf-8"))
    technical = json.loads((ROOT / "docs/ship/technical-traceability.json").read_text(encoding="utf-8"))

    assert project["schema_version"] == "graph-harness.project.v1"
    assert project["mode"] == "SHIP"
    nodes = project["nodes"]
    rf_ids = [f"RF-{i:02d}" for i in range(1, 36)]
    ids = [node["id"] for node in nodes]
    assert len(ids) == len(set(ids)), "Duplicate graph IDs"
    assert sorted(node for node in ids if node.startswith("RF-")) == rf_ids
    assert all(node["status"] != "done" for node in nodes), "Completion must be evidence-derived, not predeclared"

    for node in nodes:
        assert node["allowed_paths"], f"{node['id']} has no file boundaries"
        assert node["capability"] and node["depends_on"] is not None
        assert node["metadata"]["objective"], f"{node['id']} has no objective"
        assert node["metadata"]["acceptance_criteria"], f"{node['id']} has no acceptance criteria"
        assert node["metadata"]["required_tests"], f"{node['id']} has no tests"
        assert node["metadata"]["expected_evidence"], f"{node['id']} has no expected evidence"
        assert node["metadata"].get("blockers") is not None, f"{node['id']} has no blockers field"
        for allowed in node["allowed_paths"]:
            assert not allowed.startswith("/") and ".." not in Path(allowed).parts, (
                f"{node['id']} has an unsafe allowed path: {allowed}"
            )

    matrix = (ROOT / "docs/ship/rf-traceability.md").read_text(encoding="utf-8")
    for rf_id in rf_ids:
        assert matrix.count(f"| {rf_id} |") == 1, f"{rf_id} lacks a traceability row"
    assert len(technical["items"]) >= 80, "Original technical annex has not been fully indexed"
    assert len({item["source_row"] for item in technical["items"]}) == len(technical["items"])
    assert all(item["status"] == "PENDING_VALIDATION" for item in technical["items"])
    assert manifest["scope_top_level_old_is_duplicate"] is True
    assert manifest["source_documents_not_copied_into_repo"] is True
    assert len(manifest["scope_updated"]["sha256"]) == 64
    assert len(pin["revision"]) == 40 and pin["repository"].endswith("/Graph-harness-sdlc.git")

    if runtime_checkout:
        commit = subprocess.check_output(
            ["git", "-C", runtime_checkout, "rev-parse", "HEAD"], text=True
        ).strip()
        assert commit == pin["revision"], f"Runtime checkout {commit} differs from pinned {pin['revision']}"

    events = ROOT / "graph-harness.events.jsonl"
    assert events.exists()
    for line in events.read_text(encoding="utf-8").splitlines():
        item = json.loads(line)
        assert item["project_id"] == project["project_id"]

    return {
        "result": "PASS",
        "graph_nodes": len(nodes),
        "rf_traced": len(rf_ids),
        "technical_source_rows_indexed": len(technical["items"]),
        "runtime_sha": pin["revision"],
        "graph_sha256": hashlib.sha256((ROOT / "graph-harness.project.json").read_bytes()).hexdigest(),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--runtime-checkout", default=None)
    arguments = parser.parse_args()
    print(json.dumps(run(arguments.runtime_checkout), indent=2))
