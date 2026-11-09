/** Customer identity is explicitly OFF unless the sandbox flag is set. */
Deno.env.set("SUPABASE_URL","https://synthetic-identity.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY","synthetic-anon");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY","synthetic-service");
Deno.env.set("VORVAN_CUSTOMER_SANDBOX_ENABLED","false");
let handler:((req:Request)=>Promise<Response>)|null=null;
const serve=Deno.serve;
(Deno as unknown as {serve:unknown}).serve=((fn:(req:Request)=>Promise<Response>)=>{
 handler=fn;return {finished:Promise.resolve(),shutdown(){},ref(){},unref(){}};
}) as typeof Deno.serve;
try{await import("../customer-identity/index.ts");}
finally{(Deno as unknown as {serve:unknown}).serve=serve;}
Deno.test("VOR-006 customer identity endpoints are fail-closed by default",async()=>{
 if(!handler)throw Error("No handler captured");
 const r=await handler(new Request("https://synthetic-identity.supabase.co/functions/v1/customer-identity/v1/customer/session",{
  method:"GET",headers:{origin:"https://vorvan.co.in"}
 }));
 if(r.status!==503)throw Error("Disabled module unexpectedly accessible: "+r.status);
 const j=await r.json();
 if(j.code!=="customer_sandbox_disabled")throw Error("Incorrect default feature gate");
});
