/** No external network, real PII, SMS or payment: HMAC-signed synthetic scenarios. */
import {handleSmsHook,type SmsHookConfig} from "../msg91-send-sms/handler.ts";
function ok(value:unknown,label:string){if(!value)throw Error(label);}
function eq(a:unknown,b:unknown,label:string){if(a!==b)throw Error(label+": "+String(a)+" != "+String(b));}
const NOW=1_730_000_000_000,RAW_SECRET="0123456789abcdef0123456789abcdef";
const HOOK_SECRET="v1,whsec_"+btoa(RAW_SECRET);
const CONFIG:SmsHookConfig={
 SMS_SENDER_ACTIVATED:"true",MSG91_DLT_APPROVED:"true",
 SUPABASE_SEND_SMS_HOOK_SECRET:HOOK_SECRET,
 MSG91_AUTHKEY:"synthetic_fake_authkey_123456",
 MSG91_FLOW_TEMPLATE_ID:"synthetic_flow_00001",
 MSG91_DLT_PE_ID:"1234567890123456789",
 MSG91_DLT_TEMPLATE_ID:"9876543210987654321",
 MSG91_SENDER_ID:"VORVAN"
};
const sample={user:{id:"fictional",phone:"+919876543210"},sms:{otp:"123456"}};
async function signed(value:unknown=sample,opts:{ts?:number; badSig?:boolean; method?:string; id?:string}={}):Promise<Request>{
 const body=JSON.stringify(value),ts=String(opts.ts??NOW/1000),id=opts.id??"msg_synthetic_001";
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(RAW_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const raw=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(id+"."+ts+"."+body));
 const signature=btoa(String.fromCharCode(...new Uint8Array(raw)));
 return new Request("https://test.invalid/functions/v1/msg91-send-sms",{
  method:opts.method??"POST",
  headers:{"content-type":"application/json","webhook-id":id,"webhook-timestamp":ts,
   "webhook-signature":"v1,"+(opts.badSig?btoa("not_a_valid_hmac"):signature)},
  body:opts.method==="GET"?undefined:body
 });
}
function provider(params:{status?:number;body?:unknown}={}) {
 let calls=0,seenBody:unknown=null,seenUrl="",seenKey="";
 const fetcher=(async (url: string | URL | Request,init?:RequestInit)=>{
  calls++;
  seenUrl=String(url);seenKey=new Headers(init?.headers).get("authkey")||"";
  seenBody=JSON.parse(String(init?.body));
  return new Response(JSON.stringify(params.body??{type:"success",message:"synthetic_request_id"}),{status:params.status??200});
 }) as typeof fetch;
 return {fetcher,get calls(){return calls},get body(){return seenBody},get url(){return seenUrl},get key(){return seenKey}};
}
const run=(req:Request,c:SmsHookConfig=CONFIG,p=provider())=>
 handleSmsHook(req,c,{now:()=>NOW,fetcher:p.fetcher});
Deno.test("signed OTP sends Supabase-issued code only to fixed MSG91 flow API",async()=>{
 const p=provider(),res=await run(await signed(),CONFIG,p);
 eq(res.status,200,"accepted");eq(await res.text(),"{}","empty auth-hook result");
 eq(p.calls,1,"exactly one vendor call");eq(p.url,"https://control.msg91.com/api/v5/flow","fixed endpoint");
 eq(p.key,CONFIG.MSG91_AUTHKEY,"server-only vendor key");
 const body=p.body as {template_id:string;short_url:string;recipients:Array<{mobiles:string;OTP:string}>};
 eq(body.template_id,CONFIG.MSG91_FLOW_TEMPLATE_ID,"flow ID");
 eq(body.recipients.length,1,"one recipient");
 eq(body.recipients[0].mobiles,"919876543210","E164 transport");
 eq(body.recipients[0].OTP,"123456","Supabase-provided OTP is unchanged");
 eq(body.short_url,"0","URL shortening disabled");
});
Deno.test("disabled provider gate rejects without touching network",async()=>{
 const p=provider(),res=await run(await signed(),{...CONFIG,SMS_SENDER_ACTIVATED:"false"},p);
 eq(res.status,503,"gate off");eq(p.calls,0,"no provider request");
});
Deno.test("unapproved DLT or missing account settings reject even with enable requested",async()=>{
 for(const missing of ["MSG91_DLT_APPROVED","MSG91_DLT_PE_ID","MSG91_AUTHKEY","MSG91_FLOW_TEMPLATE_ID","MSG91_SENDER_ID"] as const){
  const p=provider();const res=await run(await signed(),{...CONFIG,[missing]:""},p);
  eq(res.status,503,"missing "+missing);eq(p.calls,0,"no request for "+missing);
 }
});
Deno.test("invalid HMAC rejects, despite well-formed OTP",async()=>{
 const p=provider(),res=await run(await signed(sample,{badSig:true}),CONFIG,p);
 eq(res.status,401,"signature denial");eq(p.calls,0,"no sending");
});
Deno.test("expired and future webhook timestamps deny replay",async()=>{
 for(const ts of [NOW/1000-301,NOW/1000+301]){
  const p=provider(),res=await run(await signed(sample,{ts}),CONFIG,p);
  eq(res.status,401,"timestamp denial");eq(p.calls,0,"no network");
 }
});
Deno.test("reject malformed, international, and unverified-shape phone or OTP",async()=>{
 const invalid=[
  {user:{phone:"+12125550123"},sms:{otp:"123456"}},
  {user:{phone:"+919876543210"},sms:{otp:"12345"}},
  {user:{phone:"+919876543210"},sms:{otp:"ABCDEF"}},
  {user:{phone:"+919876543210"},sms:{otp:"1234567"}},
  {user:{phone:"9876543210"},sms:{otp:"123456"}},
  {sms:{otp:"123456"}},[],null
 ];
 for(const item of invalid){
  const p=provider(),res=await run(await signed(item),CONFIG,p);
  eq(res.status,400,"invalid signed payload");eq(p.calls,0,"no request with invalid payload");
 }
});
Deno.test("HTTP 200 alone is not provider acceptance",async()=>{
 for(const body of [{type:"error",message:"test DLT reject"},{},[],{success:true}]){
  const p=provider({body}),res=await run(await signed(),CONFIG,p);
  eq(res.status,502,"deny ambiguous provider response");eq(p.calls,1,"vendor called");
  ok(!(await res.text()).includes("123456"),"no OTP in errors");
 }
});
Deno.test("provider HTTP error fails closed",async()=>{
 const p=provider({status:401,body:{type:"error",message:"unapproved template"}}),res=await run(await signed(),CONFIG,p);
 eq(res.status,502,"provider rejection");eq(p.calls,1,"provider called");
 ok(!(await res.text()).includes("unapproved template"),"no vendor response exposed");
});
Deno.test("method and content type reject before signature handling",async()=>{
 const p=provider();
 const get=await run(new Request("https://test.invalid/functions/v1/msg91-send-sms"),CONFIG,p);
 eq(get.status,405,"GET denied");
 const bad=new Request("https://test.invalid/functions/v1/msg91-send-sms",{method:"POST",headers:{"content-type":"text/plain"},body:"nothing"});
 const res=await run(bad,CONFIG,p);
 eq(res.status,415,"bad type denied");eq(p.calls,0,"no network");
});
