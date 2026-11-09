/** VOR-005: exercise the REAL Vyn Edge handler without opening ports or using credentials. */
type Handler=(req:Request)=>Promise<Response>;
function eq(a:unknown,b:unknown,note="assert"){if(a!==b)throw Error(note+": expected "+b+" got "+a);}
function yes(v:unknown,note:string){if(!v)throw Error(note);}
const captured:Handler[]=[];
const previous=Deno.serve;
(Deno as unknown as {serve:unknown}).serve=((fn:Handler)=>{
 captured.push(fn);return {shutdown(){},finished:Promise.resolve(),ref(){},unref(){}};
}) as typeof Deno.serve;
try{await import("../site-assistant/index.ts");}
finally{(Deno as unknown as {serve:unknown}).serve=previous;}
eq(captured.length,1,"captured public Vyn handler");
const handler=captured[0];
const allowed="https://vorvan.co.in";
const endpoint="https://synthetic.invalid/functions/v1/site-assistant";
function request(value:unknown,options:{method?:string;origin?:string;raw?:string;type?:string}={}):Request{
 const headers:Record<string,string>={"origin":options.origin||allowed};
 if(options.method!=="GET"&&options.method!=="OPTIONS")headers["content-type"]=options.type||"application/json";
 return new Request(endpoint,{method:options.method||"POST",headers,
  body:options.method==="GET"||options.method==="OPTIONS"?undefined:options.raw===undefined?JSON.stringify(value):options.raw});
}
async function response(value:unknown,options:{}={}):Promise<{status:number;data:Record<string,unknown>;headers:Headers}>{
 const r=await handler(request(value,options));return {status:r.status,data:await r.json() as Record<string,unknown>,headers:r.headers};
}
const tests=[
 ["en","partnership","partnerships@vorvan.co.in",/partnership/i],
 ["bn","partnership","partnerships@vorvan.co.in",/অংশীদারত্ব|পার্টনার/i],
 ["hi","partnership","partnerships@vorvan.co.in",/साझेदारी/i],
 ["en","api","partnerships@vorvan.co.in",/API/i],
 ["bn","api","partnerships@vorvan.co.in",/স্যান্ডবক্স|integration|API/i],
 ["hi","api","partnerships@vorvan.co.in",/API/i],
 ["en","support","support@vorvan.co.in",/support/i],
 ["bn","support","support@vorvan.co.in",/সাপোর্ট/i],
 ["hi","support","support@vorvan.co.in",/सहायता/i],
 ["en","legal","legal@vorvan.co.in",/legal/i],
 ["bn","legal","legal@vorvan.co.in",/আইনি/i],
 ["hi","legal","legal@vorvan.co.in",/कानूनी/i],
 ["en","credit","info@vorvan.co.in",/no live CIBIL/i],
 ["bn","credit","info@vorvan.co.in",/বাস্তব CIBIL/i],
 ["hi","credit","info@vorvan.co.in",/लाइव CIBIL/i],
] as const;
Deno.test("Bengali Hindi English public topic routing and contextual email matrix",async()=>{
 for(const [language,topic,email,phrase] of tests){
  const v=await response({language,topic});
  eq(v.status,200,language+"/"+topic);
  eq(v.data.topic,topic);
  eq(v.data.official_email,email,language+"/"+topic+" email");
  yes(phrase.test(String(v.data.reply)),language+"/"+topic+" localized reply");
  eq(v.data.ai_model,false);eq(v.data.personal_data_saved,false);
  yes(!JSON.stringify(v.data).includes("admin@vorvan.co.in"),"no internal admin mailbox");
  yes(!String(v.data.reply).includes("loan approved"),"no fake financial approval");
 }
});
Deno.test("Explicit contact email routing and unknown fallback in three languages",async()=>{
 for(const language of ["en","bn","hi"]){
  const contact=await response({language,topic:"contact"});
  eq(contact.status,200);eq(contact.data.official_email,"info@vorvan.co.in");
  const unknown=await response({language,message:"xyzzy ???? qwerty"});
  eq(unknown.status,200);eq(unknown.data.topic,"unknown");
  eq(unknown.data.official_email,"info@vorvan.co.in");
  yes(String(unknown.data.reply).length>25,language+" unknown fallback");
  yes(!JSON.stringify(unknown.data).includes("admin@vorvan.co.in"),"no admin contact");
 }
});
Deno.test("Multilingual free-text topic and detailed institutional answers",async()=>{
 const queries=[
  {language:"en",message:"How do I request sandbox API access?",topic:"api"},
  {language:"bn",message:"ব্যাংক পার্টনার হতে কী লাগবে?",topic:"partnership"},
  {language:"hi",message:"बैंक ऑनबोर्ड के लिए क्या करना है?",topic:"partnership"},
  {language:"en",message:"I need website support",topic:"support"},
 ];
 for(const x of queries){
  const v=await response(x);
  eq(v.status,200,x.message);
  eq(v.data.topic,x.topic,x.message);
  yes(String(v.data.reply).length>40,"substantial guided answer");
 }
});
Deno.test("No live financial service claims across supported languages",async()=>{
 for(const language of ["en","bn","hi"]){
  for(const topic of ["credit","customer"]){
   // The internal customer category is reachable through free text, not direct topic buttons.
   const v=await response(topic==="credit"?{language,topic}:{language,message:"customer login apply"});
   eq(v.status,200);
   eq(v.data.ai_model,false);
   yes(!JSON.stringify(v.data).includes("admin@vorvan.co.in"),"no admin mailbox");
   yes(String(v.data.reply).length>20,"informational disabled-service message");
  }
 }
});
Deno.test("Sensitive email PAN Aadhaar phone OTP PIN password rejected without reflecting values",async()=>{
 const sensitive=[
  "test.customer@example.com",
  "ABCDE1234F",
  "abcde1234f",
  "1234 5678 9012",
  "9876543210",
  "OTP: 123456",
  "one-time code 654321",
  "PIN=1234",
  "password 987654",
 ];
 for(const message of sensitive){
  const v=await response({language:"en",message});
  eq(v.status,400,"sensitive reject "+message);
  eq(v.data.error,"please_remove_personal_information");
  yes(!JSON.stringify(v.data).includes(message),"no echo rejected input");
 }
});
Deno.test("Short non-sensitive questions are accepted and never persisted",async()=>{
 for(const language of ["en","bn","hi"]){
  const v=await response({language,message:"How is VORVAN?"});
  eq(v.status,200);eq(v.data.personal_data_saved,false);
 }
});
Deno.test("Invalid language, topics, values and unknown fields rejected",async()=>{
 const cases=[
  [{language:"fr",topic:"contact"},"invalid_language"],
  [{language:"en",topic:"unlisted"},"invalid_topic"],
  [{language:"en",topic:"support",is_admin:true},"invalid_input"],
  [{language:"en"},"input_required"],
  [{language:"en",message:12345},"invalid_message"],
  [{language:"en",message:"X".repeat(241)},"invalid_message"],
 ];
 for(const [payload,code] of cases){
  const v=await response(payload);eq(v.status,400);eq(v.data.error,code);
 }
});
Deno.test("Invalid oversized JSON, arrays and wrong content type rejected",async()=>{
 for(const r of [
  request([]),
  request({language:"en",topic:"contact"},{raw:"{"}),
  request({language:"en",topic:"support"},{raw:" ".repeat(801)}),
  request({language:"en",topic:"contact"},{type:"text/plain"}),
 ]){
  const res=await handler(r);eq(res.status,400);
  eq((await res.json()).error,"invalid_input");
 }
});
Deno.test("Origin, HTTP method, preflight and response headers",async()=>{
 let r=await handler(request({language:"en",topic:"api"},{origin:"https://untrusted.invalid"}));
 eq(r.status,403);eq((await r.json()).error,"origin_denied");
 r=await handler(request(null,{method:"GET"}));
 eq(r.status,405);eq((await r.json()).error,"method_not_allowed");
 r=await handler(request(null,{method:"OPTIONS"}));
 eq(r.status,204);eq(r.headers.get("access-control-allow-origin"),allowed);
 const v=await response({language:"en",topic:"api"});
 eq(v.headers.get("cache-control"),"no-store,max-age=0");
 eq(v.headers.get("access-control-allow-origin"),allowed);
 eq(v.headers.get("x-content-type-options"),"nosniff");
});
Deno.test("Outgoing response never contains input message or secrets",async()=>{
 const payload="Help me with a lender API";
 const v=await response({language:"en",message:payload});
 eq(v.status,200);eq(v.data.topic,"api");
 yes(!JSON.stringify(v.data).includes(payload),"message not echoed");
 yes(!("access_token" in v.data),"no tokens");
 yes(!("password" in v.data),"no credentials");
});
