# VORVAN — Real Mobile OTP / MSG91 technical adapter readiness (12 Nov 2026)

## Classification: SOURCE READY FOR REVIEW; SMS NOT ACTIVE

- The production VORVAN Applicant Login at \`customer.html\` MUST retain \`SMS_PROVIDER_READY=false\`. Real customer signup, delivery, payment and compliant DLT registration have NOT been demonstrated.
- This PR adds a FIRST-PARTY **Supabase Auth HTTP Send SMS hook** at \`backend/msg91-send-sms/index.ts\` calling the fixed MSG91 Flow SMS endpoint. It forwards **only the OTP issued by Supabase Auth**, not MSG91's independently generated OTP. Phone ownership remains verified by Supabase Auth \`/auth/v1/user\` and existing RLS checks.
- The handler has both \`SMS_SENDER_ACTIVATED\` and \`MSG91_DLT_APPROVED\` fail-closed settings (default OFF), Standard Webhooks HMAC verification, a ±5-minute signed timestamp guard, a bounded 20KB body, India-only phone, fixed six-digit OTP, HTTPS fixed host, 3.5-second timeout, strict vendor success response and no OTP/phone/provider-secret logging.
- No API key, sender ID approval, DLT PE ID, DLT content template ID, provider Flow template ID, vendor account or real recipient is in this repository. No Edge Function was deployed; no Supabase Auth settings changed; no provider signed up, no SMS sent and no payment made.

## Official prerequisites and deployment gating

1. VORVAN PRIVATE LIMITED's legally authorized representative registers or retrieves an existing **DLT Principal Entity ID** on a telecom DLT portal. Verify the registration in that operator's dashboard.
2. Register and obtain approval for an appropriate VORVAN sender/header and OTP content template. Draft for operator review ONLY: \`VORVAN: Your login verification code is {#var#}. Do not share it.\` Real template type/category and exact variable syntax require operator confirmation; no approved template is claimed.
3. Open/verify VORVAN's MSG91 account, link the registered PE/telemarketer chain, sender and approved DLT template. MSG91's Flow template must match the *exact approved wording*, with one variable named **OTP** mapped to the Supabase-generated six-digit code, e.g. \`##OTP##\`. Capture the assigned Flow template ID and official vendor acceptance test, not private keys in chat.
4. **Owner approval is required before fees**. Obtain a current official DLT portal checkout/receipt and official MSG91 pricing. MSG91's help center lists a ₹5,000 + GST entity registration figure as an *indicative*, not guaranteed 2026 checkout amount; actual payable amount and SMS charges must be verified. Never authorize payment automatically.
5. Supabase Edge Function: deploy **only after code review**; because this is a pre-auth Auth Hook, deployment requires \`verify_jwt=false\`, replaced by **mandatory signed HTTP webhook verification**. In Supabase secure server-side environment, separately set \`SUPABASE_SEND_SMS_HOOK_SECRET\` (full Standard Webhooks \`v1,whsec_...\` secret), \`MSG91_AUTHKEY\`, \`MSG91_FLOW_TEMPLATE_ID\`, \`MSG91_DLT_PE_ID\`, \`MSG91_DLT_TEMPLATE_ID\`, \`MSG91_SENDER_ID\`. Never put these values into static pages, git, screenshots, unsecured chat or logs. Hook settings are managed in **Authentication → Hooks → Send SMS (HTTP)**, using the SAME signing secret, after ensuring Phone Auth settings are correct and **auto-confirm is OFF**.
6. Only after DLT proof + provider acceptance and owner approval set \`MSG91_DLT_APPROVED=true\` and \`SMS_SENDER_ACTIVATED=true\` on the server. The flags are human-reviewed release gates, **not automated certification**. Confirm provider success/error semantics with controlled test SMS, especially that MSG91 SMS Flow API returns \`type:"success"\` when it accepts a request; revise fail-closed behavior if the contract differs. This acknowledges *provider acceptance*, not final handset delivery.
7. Before enabling \`SMS_PROVIDER_READY=true\` in website source: capture real controlled mobile OTP delivery, verification, rate limits, expired/incorrect code, bot-abuse controls, login/logout, government/business applicant form submission, User A/B profile isolation, Owner AAL2 access, legal privacy/retention compliance and independent VAPT. Do not weaken phone-verified RLS or enable real lender/bureau/payments.
8. Avoid sending code by alternate SMS OTP provider without reviewing identity model. Signed-hook replay remains bounded only by timestamp, not a durable idempotency record; introduce an atomic short-lived event-ID dedupe store or equivalent provider-supported protection **before broad production use**. Check whether MSG91 API returns a delivery receipt and configure delivery reporting only after data minimisation review.

## Validation evidence

\`backend/tests/msg91_sms_hook.test.ts\` exercises HMAC-signed synthetic OTP, default-off, missing DLT, invalid signature, stale/future timestamp, non-Indian phone, malformed code, HTTP failure and fail-closed provider responses. GitHub CI must run Deno tests and type checks with **no external network**, credentials, real phone or messaging. Keep all 20-ticket milestone classifications unchanged; real OTP onboarding remains BLOCKED.

## Authoritative references

- TRAI: https://www.trai.gov.in/advice-to-senders
- MSG91 DLT: https://msg91.com/help/dlt-registration-in-india/dlt-process/
- MSG91 API: https://docs.msg91.com/sms/send-sms
- MSG91 template setup: https://msg91.com/help/template/how-to-create-flow-id-to-send-sms-via-api
- Supabase Auth Hooks: https://supabase.com/docs/guides/auth/auth-hooks
- Supabase Send SMS: https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook
