# VORVAN AI Guidance V1 — gated backend

**Deploy:** Supabase project `vorvan-dev-india` (region `ap-south-1`), function `ai-guidance`.

**Public status:** prototype only; this is a fully separate server-side, deterministic guidance engine for **fictional** profiles, *not* a connected generative AI model. It cannot fetch a real credit score or report, evaluate a borrower, approve a loan or match lender offers.

## Security guarantees implemented in this version

- Edge Function configured with `verify_jwt=true`, and validates actual Supabase Auth user access tokens again against the Auth User API.
- Rejects unauthenticated calls (401), and browser-origin requests outside VORVAN's known GitHub Pages origin.
- Rejects real financial information, free-text prompts and unknown JSON fields by accepting only three scenario labels (`building`, `steady`, `strong`) and languages (`en`, `bn`, `hi`).
- Bounded request body (1 KiB), no database writes or reads, no persistent user information, no external AI/credit provider, no third-party client libraries.
- Server returns no-store JSON responses; all scores (620, 742, 812) are synthetic and generated server-side.
- Real bureau, lender application, document upload, payments and production AI feature gates are explicitly **false** in `private.feature_gates`.

## API contract

Endpoint: `https://kukfpsqujlutlgwndplh.supabase.co/functions/v1/ai-guidance`.

`GET` with a real Supabase Auth user bearer token: returns version/status only.

`POST` with the same bearer token and `Content-Type: application/json`:

```json
{"mode":"demo","scenario":"steady","locale":"en"}
```

Returns a fictional score, rule-based educational recommendations, clearly labeled disclaimer and `customer_data_stored:false`.

All non-demo request bodies should fail closed. Do **not** send real scores, names, identity documents or financial profiles to this endpoint.

## To build genuine AI guidance (separate future milestone)

1. Obtain required bureau/lender agreements and document product use cases with legal/compliance teams.
2. Select a suitable hosting/model provider *after* validating India data residency, supplier privacy commitments, retention controls and per-invocation costs.
3. Put any model/provider key only into Supabase managed secrets—not GitHub, HTML or JavaScript.
4. Add a dedicated server-only AI adapter with strict task schema, output verification, budgets, redaction and fail-closed response behavior.
5. Gate all production routes through verified account authorization, documented consumer consent, data minimisation, audit logs and rate limits.
6. Complete security review, threat model, independent penetration test and compliance approval. Move out of demo mode only with evidence and documented signoff.

### Notes

- Supabase Edge Functions Free tier usage is subject to provider quotas; `₹0` is not an unlimited lifetime guarantee.
- This prototype is not a substitute for a production AI model or a live CIBIL integration.
- The public Bank/NBFC Partner Desk is informational and uses `mailto:`; it is not an authenticated partner system.

## References

- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/guides/functions/pricing
- https://www.rbi.org.in/
