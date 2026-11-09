"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const migrate=fs.readFileSync("backend/migrations/m0_vor004_postgres_default_api_grants.sql","utf8");
const sql=fs.readFileSync("backend/security/m0_vor004_data_api_assertions.sql","utf8");
const threat=fs.readFileSync("docs/M0_VOR004_DATA_API_THREAT_REVIEW_20261109.md","utf8");
const ledger=fs.readFileSync("docs/VORVAN_MILESTONE_PENDING_LEDGER.md","utf8");
assert.match(migrate,/ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public\s+REVOKE ALL ON TABLES FROM anon, authenticated/i);
assert.match(migrate,/ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public\s+REVOKE ALL ON SEQUENCES FROM anon, authenticated/i);
assert.match(migrate,/ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public\s+REVOKE ALL ON FUNCTIONS FROM anon, authenticated/i);
assert.match(migrate,/ALTER DEFAULT PRIVILEGES FOR ROLE postgres\s+REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC/i);
assert.doesNotMatch(migrate,/\b(?:DROP|TRUNCATE|DELETE|ALTER TABLE|UPDATE|CREATE POLICY|REVOKE ALL ON (?:TABLE|SCHEMA) public\.)\b/i);
assert.match(migrate,/Existing tables/i);
assert.match(migrate,/supabase_admin/i);
assert.equal((sql.match(/AS check_id/g)||[]).length,1,"expected named assertions");
for(let n=1;n<=11;n++)assert.ok(sql.includes("D"+String(n).padStart(2,"0")+"_"),"security assertion D"+n+" missing");
assert.match(sql,/has_table_privilege/);
assert.match(sql,/SECURITY DEFINER|prosecdef/);
assert.match(sql,/user_metadata/);
assert.match(sql,/pg_default_acl/);
assert.match(threat,/supabase_admin/);
assert.match(threat,/leaked.password/i);
assert.match(threat,/Data API/);
assert.match(threat,/session_id/);
assert.match(threat,/verify_jwt/);
assert.match(threat,/Pro Plan/);
assert.match(threat,/auth\.leaked_password_protection|auth_leaked_password_protection/);
assert.match(ledger,/VOR-004/);
assert.match(ledger,/default.grants|default privileges/i);
// Public static assets must not embed privileged server secrets or service-key values.
for(const p of ["assets/admin.js","assets/assistant.js","assets/site.js","assets/institutional-inquiry.js","index.html","admin.html"]){
 const body=fs.readFileSync(p,"utf8");
 assert.doesNotMatch(body,/sb_secret_[a-zA-Z0-9_-]+|SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*["'][^"']+["']|[A-Za-z0-9_-]+\.(?:eyJ|a1b)[A-Za-z0-9_-]{100,}\.[a-zA-Z0-9_-]{30,}/,p+" exposes privileged secret");
}
console.log("PASS VOR-004: forward-only default-privilege hardening, eleven SQL assertions, threat review, no service secrets in public entrypoints");
