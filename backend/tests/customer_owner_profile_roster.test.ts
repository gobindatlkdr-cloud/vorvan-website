/** Owner-only real customer contact roster: no reports, no customer data in public demo. */
function yes(x:unknown,message="assert"){if(!x)throw Error(message);}
function equal(a:unknown,b:unknown,message="assert"){if(a!==b)throw Error(message+": "+String(a)+" != "+String(b));}
class Node {
 tag:string;textContent="";className="";value="";type="";disabled=false;
 attrs:Record<string,string>={};children:Node[]=[];events:Record<string,()=>void>={};
 constructor(tag:string){this.tag=tag;}
 append(...elements:Node[]){this.children.push(...elements);}
 replaceChildren(...elements:Node[]){this.children=[...elements];}
 setAttribute(name:string,value:string){this.attrs[name]=value;}
 addEventListener(name:string,cb:()=>void){this.events[name]=cb;}
}
const all=(node:Node):Node[]=>[node,...node.children.flatMap(all)];
Deno.test("Customer owner roster backend requires verified AAL2 and confirms account email before service access",async()=>{
 const edge=await Deno.readTextFile("backend/customer-operations/index.ts");
 yes(edge.includes('if(req.method==="GET"&&route==="/profiles")'),"profiles route available");
 const verified=edge.indexOf("const owner=await verifiedOwner(req);");
 const access=edge.indexOf('if(req.method==="GET"&&route==="/profiles")');
 yes(verified>=0&&access>verified,"Auth before data");
 yes(edge.includes('claims.aal!=="aal2"'),"AAL2 required");
 yes(edge.includes('rows[0]?.admin_role!=="owner"'),"Owner only");
 yes(edge.includes('user.email_confirmed_at||user.confirmed_at'),"Verified email");
 yes(edge.includes("limit=80"),"Bounded profile list");
 yes(edge.includes("real_credit_scores:0"),"No CIBIL content");
 yes(edge.includes('"cache-control":"private, no-store, max-age=0"'),"No browser/proxy caching");
 yes(!/route==="\\/profiles"[\\s\\S]*?console\\.log/.test(edge),"No PII log");
});
Deno.test("Only Owner can mount confidential profile roster and list is not made public",async()=>{
 const previous=(globalThis as unknown as {document?:unknown}).document;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Node(tag)};
 const orig=globalThis.fetch;let calls:string[]=[];
 globalThis.fetch=(async(url:URL|string|Request)=>{
  calls.push(String(url));
  if(String(url).endsWith("/profiles"))return new Response(JSON.stringify({ok:true,owner_only:true,items:[
   {user_id:"00000000-0000-4000-8000-000000000001",full_name:"Fictional Person",
    email:"example@invalid.example",phone:"9000000000",work_category:"salaried",work_details:"Example job",
    consent_version:"contact_enquiry_v1_2026_11_11",consent_accepted_at:"2026-11-11T00:00:00Z",created_at:"2026-11-11T00:00:00Z"}
  ]}),{status:200,headers:{"content-type":"application/json"}});
  return new Response(JSON.stringify({ok:true,owner_only:true,items:[]}),{status:200,headers:{"content-type":"application/json"}});
 }) as typeof fetch;
 try{
  const {mountCustomerOperations}=await import("../../assets/customer-admin-queue.js");
  const token="x".repeat(120),notOwner=new Node("main");
  equal(mountCustomerOperations(notOwner,{role:"auditor",accessToken:token}).ok,false);
  equal(calls.length,0,"no network for non-owner");
  const root=new Node("main"),mount=mountCustomerOperations(root,{role:"owner",accessToken:token});
  equal(mount.ok,true);
  await new Promise(resolve=>setTimeout(resolve,30));
  yes(calls.some(x=>x.endsWith("/profiles")),"owner profile route");
  yes(calls.some(x=>x.endsWith("/enquiries")),"owner enquiry route");
  yes(all(root).some(x=>x.textContent==="Fictional Person"),"account visible even without enquiries");
  yes(all(root).some(x=>x.textContent==="No customer loan information enquiries yet."),"enquiry list separate");
  yes(all(root).some(x=>x.textContent.includes("No credit scores stored.")),"explicit separation");
  mount.dispose?.();equal(root.children.length,0,"dispose clears PII DOM");
 }finally{
  if(previous===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=previous;
  globalThis.fetch=orig;
 }
});
Deno.test("Owner endpoint does not expose PAN, Aadhaar, borrower bureau scores, payments or lender credentials",async()=>{
 const source=await Deno.readTextFile("backend/customer-operations/index.ts");
 const start=source.indexOf('if(req.method==="GET"&&route==="/profiles")');
 const end=source.indexOf('if(req.method==="GET"&&route==="/enquiries")',start);
 const block=source.slice(start,end);
 yes(block.includes("user_id,full_name,email,phone,work_category,work_details,consent_version,consent_accepted_at,created_at"),"only needed fields");
 for(const x of ["aadhaar","bureau_score","bank_account","loan_application","pan,","date_of_birth"]){
  yes(!block.includes(x),"unnecessary field in profile API: "+x);
 }
 const sql=await Deno.readTextFile("backend/migrations/20261111_customer_contact_enquiry_rls.sql");
 yes(sql.includes("vorvan_intake_customer_own_insert"),"real profile RLS");
 yes(sql.includes("vorvan_enquiry_customer_own_submit"),"real enquiry RLS");
 yes(sql.includes("grant all on public.vorvan_customer_intake_profiles to service_role"),"only service role sees all");
});
