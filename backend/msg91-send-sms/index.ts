/** Supabase Auth Send SMS HTTP hook. Deploy ONLY with verify_jwt=false.
 * HMAC Standard Webhooks authentication is enforced in handler.ts instead.
 * DO NOT enable Supabase Auth hook, phone provider or frontend OTP gate
 * until DLT/provider/owner live controlled-recipient tests are approved.
 */
import {handleSmsHook} from "./handler.ts";
const names=[
 "SMS_SENDER_ACTIVATED","MSG91_DLT_APPROVED","SUPABASE_SEND_SMS_HOOK_SECRET",
 "MSG91_AUTHKEY","MSG91_FLOW_TEMPLATE_ID","MSG91_DLT_PE_ID",
 "MSG91_DLT_TEMPLATE_ID","MSG91_SENDER_ID"
] as const;
const config=Object.fromEntries(names.map(n=>[n,Deno.env.get(n)]));
Deno.serve(req=>handleSmsHook(req,config));
