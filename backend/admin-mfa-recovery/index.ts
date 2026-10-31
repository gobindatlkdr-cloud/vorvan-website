/**
 * Owner-only recovery for a single INCOMPLETE (unverified) TOTP enrollment.
 * Does not bypass AAL2 for admin data; does not expose factor IDs or secrets.
 * Reauthenticates the bearer token against Supabase Auth on each request.
 */
const PROJECT=Deno.env.get("SUPABASE_URL")||"";
const ANON=Deno.env.get("SUPABASE_ANON_KEY")||"";
const OWNER="admin@vorvan.co.in";
const ALLOWED=new Set(["https://vorvan.co.in","https://www.vorvan.co.in","https://gobindatlkdr-cloud.github.io"]);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function headers(req:Request){
 const h=new Headers({"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff","vary":"Origin"});
 const origin=req.headers.get("origin");
 if(origin&&ALLOWED.has(origin)){
  h.set("access-control-allow-origin",origin);
  h.set("access-control-allow-methods","POST, OPTIONS");
  h.set("access-control-allow-headers","authorization, apikey, content-type");
 }
 return h;
}
function reply(req:Request,status:number,code:string){return new Response(JSON.stringify({ok:status===200,code}),{status,headers:headers(req)})}
function serverHeaders():Headers|null{
 // Never place secret keys in frontend code, public GitHub files, logs or API responses.
 const legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(legacy)return new Headers({apikey:legacy,authorization:"Bearer "+legacy,accept:"application/json"});
 try{
  const x=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
  if(typeof x==="string"&&x.startsWith("sb_secret_"))return new Headers({apikey:x,accept:"application/json"});
 }catch{}
 return null;
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(origin&&!ALLOWED.has(origin))return reply(req,403,"origin_not_allowed");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(req)});
 if(req.method!=="POST")return reply(req,405,"method_not_allowed");
 if(new URL(req.url).pathname!=="/functions/v1/admin-mfa-recovery")return reply(req,404,"not_found");
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(PROJECT)||!ANON)return reply(req,503,"service_unavailable");
 const authorization=req.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~-]+$/.test(authorization)||authorization.length>4200)return reply(req,401,"login_required");
 let user:Record<string,unknown>;
 try{
  const auth=await fetch(PROJECT+"/auth/v1/user",{headers:{authorization,apikey:ANON},signal:AbortSignal.timeout(6000)});
  if(!auth.ok)return reply(req,401,"login_required");
  user=await auth.json();
 }catch{return reply(req,503,"authentication_unavailable")}
 const uid=user.id;
 if(typeof uid!=="string"||!UUID.test(uid)||typeof user.email!=="string"||user.email.toLowerCase()!==OWNER||!(user.email_confirmed_at||user.confirmed_at)){
  return reply(req,403,"verified_owner_required");
 }
 const secret=serverHeaders();
 if(!secret)return reply(req,503,"recovery_not_configured");
 try{
  const acl=await fetch(PROJECT+"/rest/v1/vorvan_admin_acl?select=admin_role&email=eq."+encodeURIComponent(OWNER)+"&enabled=is.true&limit=1",{
   headers:secret,signal:AbortSignal.timeout(6000)});
  if(!acl.ok)return reply(req,503,"owner_check_unavailable");
  const rows=await acl.json();
  if(!Array.isArray(rows)||rows.length!==1||rows[0].admin_role!=="owner")return reply(req,403,"owner_permission_required");
  const factorsRes=await fetch(PROJECT+"/auth/v1/admin/users/"+uid+"/factors",{
   headers:secret,signal:AbortSignal.timeout(6000)});
  if(!factorsRes.ok)return reply(req,503,"factor_lookup_unavailable");
  const data=await factorsRes.json();
  const factors=Array.isArray(data)?data:Array.isArray(data?.factors)?data.factors:null;
  if(!factors)return reply(req,503,"unexpected_factor_response");
  // Absolutely never remove verified MFA. Require exactly one unverified TOTP.
  if(factors.some((f:Record<string,unknown>)=>f.status==="verified"))return reply(req,403,"verified_mfa_protected");
  const pending=factors.filter((f:Record<string,unknown>)=>f.factor_type==="totp"&&f.status==="unverified");
  if(factors.length!==1||pending.length!==1||typeof pending[0]?.id!=="string"||!UUID.test(pending[0].id)){
   return reply(req,409,"pending_mfa_not_single");
  }
  const deletion=await fetch(PROJECT+"/auth/v1/admin/users/"+uid+"/factors/"+pending[0].id,{
   method:"DELETE",headers:secret,signal:AbortSignal.timeout(6000)});
  if(!deletion.ok)return reply(req,503,"factor_reset_failed");
  return reply(req,200,"incomplete_mfa_reset");
 }catch{return reply(req,503,"recovery_unavailable")}
});
