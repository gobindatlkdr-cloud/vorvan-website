"use strict";
const fs = require("node:fs");
const assert = require("node:assert/strict");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root,p),"utf8");
const manifest = JSON.parse(read("docs/M0_VOR001_BASELINE_MANIFEST.json"));
const workflow = read(".github/workflows/m0-baseline-freeze.yml");
const inventory = read("docs/M0_VOR001_ARCHITECTURE_20261109.md");
const recovery = read("docs/M0_VOR001_ROLLBACK_RUNBOOK.md");
const ledger = read("docs/VORVAN_MILESTONE_PENDING_LEDGER.md");

assert.equal(manifest.repo,"gobindatlkdr-cloud/vorvan-website");
assert.match(manifest.baseline_sha,/^[0-9a-f]{40}$/);
assert.equal(manifest.baseline_sha,"d8456ffa0fad97b653f590e0cf02429bd6288cc3");
assert.equal(manifest.annotated_tag,"m0-baseline-20261109");
assert.equal(manifest.tag_protection,"RULESET_NOT_VERIFIED");
assert.equal(manifest.baseline_checks.length,3);
assert.ok(manifest.baseline_checks.every(c=>c.result==="success"&&Number.isInteger(c.run_id)));
assert.equal(manifest.observed.public_tables,23);
assert.equal(manifest.observed.supabase_functions,7);
assert.equal(manifest.deployment.model.includes("pre-incorporation"),true);

assert.match(workflow,/contents: write/);
assert.match(workflow,/branches: \[main\]/);
assert.doesNotMatch(workflow,/pull_request:/);
assert.match(workflow,/d8456ffa0fad97b653f590e0cf02429bd6288cc3/);
assert.match(workflow,/m0-baseline-20261109/);
assert.match(workflow,/git merge-base --is-ancestor/);
assert.match(workflow,/git tag -a/);
assert.match(workflow,/git ls-remote --exit-code/);
assert.match(workflow,/git push origin "refs\/tags\/\$TAG"/);
assert.match(workflow,/git worktree add --detach/);
assert.doesNotMatch(workflow,/git push[^\n]*--force|git push[^\n]*\+-|git reset --hard.*main/);

for(const p of ["index.html","solutions.html","partners.html","partner-desk.html","admin.html","assets/admin.js","assets/assistant.js","backend/compliance-vault/index.ts","backend/site-assistant/index.ts","backend/security/m0_vor004_exposure_assertions.sql"]){
 assert.ok(fs.existsSync(path.join(root,p)),"missing declared architecture component: "+p);
}
for(const s of ["GitHub Pages","Supabase","23","Seven active Edge Functions","api","MFA","Incorporation","pending"]){
 assert.ok(inventory.toLowerCase().includes(s.toLowerCase()),"inventory missing "+s);
}
assert.match(inventory,/Source missing from current repository tree/);
assert.match(recovery,/Never run `git push --force`/);
assert.match(recovery,/separate environment first/);
assert.match(recovery,/not a tested full disaster-recovery guarantee/);
assert.match(recovery,/tag does not include Supabase Postgres or Storage contents/);
assert.match(ledger,/VOR-001/);
assert.match(ledger,/RULESET_NOT_VERIFIED|tag ruleset/);
assert.match(ledger,/VOR-002/);
assert.match(ledger,/Incorporation|incorporation/);
console.log("PASS: M0 VOR-001 pinned baseline manifest, append-only tagging workflow, architecture inventory, recovery safeguards and pending ledger");
