/** VOR-010: unit test ACTUAL pure admin sandbox and current VOR-009 templates. */
import {
 ADMIN_SANDBOX_VERSION,ROLES,CATEGORIES,MILESTONE_IDS,TASK_STATES,
 buildSyntheticTemplateCatalog,createAdminReadinessSandbox,mountAdminReadinessSandbox
} from "../../assets/admin-readiness-sandbox.js";
import {PLAN_VERSION} from "../../assets/readiness-action-plan.js";
function eq(a:unknown,b:unknown,label="assertion"){if(JSON.stringify(a)!==JSON.stringify(b))throw Error(label+" expected "+JSON.stringify(b)+" but got "+JSON.stringify(a));}
function yes(v:unknown,label:string){if(!v)throw Error(label);}
function denied(value:unknown,code:string){if(!value||typeof value!=="object"||!("code" in value))throw Error("Expected denial "+code);eq(value.code,code);}

function open(role:string){
 const x=createAdminReadinessSandbox(role);
 if(!x.ok||!("snapshot" in x))throw Error("Unexpected denied: "+role);
 return x;
}
function view(x:ReturnType<typeof open>,locale="en",category="all",milestone="all"){
 const r=x.snapshot(locale,category,milestone);
 if(!r.ok||!("queue" in r))throw Error("Unexpected malformed snapshot");
 return r;
}
Deno.test("Immutable template registry includes 18 canonical VOR-009 templates, same IDs in three locales",()=>{
 eq(ADMIN_SANDBOX_VERSION,"vor010-synthetic-2026-11-10-v1");
 eq(ROLES,["owner","operator","auditor"]);
 eq(CATEGORIES,["personal","business","education"]);
 eq(MILESTONE_IDS,["d30","d60","d90"]);
 eq(TASK_STATES,["todo","in_progress","reviewed"]);
 const en=buildSyntheticTemplateCatalog("en");
 if(!Array.isArray(en))throw Error("Missing templates");
 eq(en.length,18);eq(new Set(en.map(t=>t.id)).size,18);
 for(const category of CATEGORIES)eq(en.filter(t=>t.category===category).length,6);
 for(const milestone of MILESTONE_IDS)eq(en.filter(t=>t.milestone_id===milestone).length,6);
 yes(en.every(t=>t.template_version===PLAN_VERSION&&t.synthetic_only),"All templates bound to VOR-009 version");
 for(const locale of ["bn","hi"]){
  const translated=buildSyntheticTemplateCatalog(locale);
  if(!Array.isArray(translated))throw Error("Localized templates unavailable");
  eq(translated.map(t=>t.id),en.map(t=>t.id));
  yes(translated.some((t,i)=>t.title!==en[i].title),"Localized topic titles differ from English");
 }
});
Deno.test("Invalid/anonymous/role-escalation claim fails closed",()=>{
 for(const fake of [null,undefined,"","admin","superuser","customer","OWNER",{},[],false,1]){
  eq(createAdminReadinessSandbox(fake).ok,false);
 }
});
Deno.test("Owner sees all 18 versioned templates across days and can simulate stage changes",()=>{
 const s=open("owner"),r=view(s);
 eq(r.version,ADMIN_SANDBOX_VERSION);eq(r.template_version,PLAN_VERSION);
 eq(r.available_to_role,18);eq(r.visible_count,18);
 eq(r.milestones.map(m=>[m.id,m.visible,m.reviewed]),[["d30",6,0],["d60",6,0],["d90",6,0]]);
 eq(r.allowed.change,true);eq(r.allowed.reset,true);eq(r.allowed.release,false);
 const id=r.queue[0].id;
 eq(s.transition(id,"in_progress").ok,true);
 eq(s.transition(id,"reviewed").ok,true);
 eq(view(s).queue[0].status,"reviewed");
 eq(view(s).milestones[0].reviewed,1);
 eq(view(s).change_history.length,2);
});
Deno.test("Operator sees only 12 operations templates, never compliance templates",()=>{
 const s=open("operator"),r=view(s);
 eq(r.visible_count,12);eq(r.available_to_role,12);
 yes(r.queue.every((t:{assigned_scope:string})=>t.assigned_scope==="operations"),"Only team-owned scope visible");
 eq(r.milestones.map(m=>m.visible),[6,6,0]);
 const owner=view(open("owner"));
 const restricted=owner.queue.find((t:{assigned_scope:string,id:string})=>t.assigned_scope==="compliance");
 yes(restricted,"Restricted synthetic template exists");
 denied(s.transition(restricted!.id,"reviewed"),"out_of_scope");
 eq(s.transition(r.queue[0].id,"reviewed").ok,true);
 eq(view(s).queue[0].status,"reviewed");
 denied(s.reset(),"owner_only");
});
Deno.test("Auditor can see templates, gates and demo audit but cannot mutate or reset",()=>{
 const s=open("auditor"),r=view(s);
 eq(r.visible_count,18);eq(r.allowed.read,true);eq(r.allowed.change,false);
 eq(r.allowed.reset,false);eq(r.allowed.release,false);
 denied(s.transition(r.queue[0].id,"reviewed"),"read_only_role");
 denied(s.reset(),"owner_only");
 eq(view(s).queue[0].status,"todo");
});
Deno.test("All 7 production gates remain blocked for all roles after synthetic review",()=>{
 for(const role of ROLES){
  const s=open(role),before=view(s);
  eq(before.release_gates.length,7);
  eq(before.release_ready,false);eq(before.production_access_enabled,false);
  yes(before.release_gates.every(x=>x.state==="blocked"),"No stage claims legal approval");
  eq(before.real_customer_records,0);
  eq(before.customer_data_collected,false);
  eq(before.no_backend_storage,true);eq(before.real_audit_created,false);eq(before.notifications_sent,false);
  if(role!=="auditor")s.transition(before.queue[0].id,"reviewed");
  const after=view(s);
  eq(after.release_gates,before.release_gates);
  eq(after.release_ready,false);
 }
});
Deno.test("Malformed task IDs, free text, PAN/OTP strings, status values cannot change queue",()=>{
 const s=open("owner"),first=view(s).queue[0];
 for(const id of [null,{},42,"123456","ABCDE1234F","fake-user-id",first.question_id]){
  eq(s.transition(id,"reviewed").ok,false);
 }
 for(const status of [null,42,{},[],"approved","publish","go_live","customer_name","pan","loan_eligible"]){
  eq(s.transition(first.id,status).ok,false);
 }
 eq(view(s).queue[0].status,"todo");
});
Deno.test("Versioned task progress does NOT infer customer readiness or credit scoring",()=>{
 const s=open("owner"),initial=view(s);
 for(const task of initial.queue)eq(s.transition(task.id,"reviewed").ok,true);
 const r=view(s);
 eq(r.queue.filter((x:{status:string})=>x.status==="reviewed").length,18);
 eq(r.release_ready,false);eq(r.production_access_enabled,false);
 eq(r.real_customer_records,0);
 yes(!JSON.stringify(r).includes('"credit_score":790'),"No credit score field");
});
Deno.test("Filters are fixed enums, category/milestone intersection exact",()=>{
 const s=open("owner");
 eq(view(s,"en","personal","d30").visible_count,2);
 eq(view(s,"en","business","d60").visible_count,2);
 eq(view(s,"bn","education","d90").visible_count,2);
 eq(view(open("operator"),"hi","personal","d90").visible_count,0);
 for(const args of [["fr","all","all"],["en","short_term","all"],["en","all","d120"],["en","user@example.com","all"]]){
  eq(s.snapshot(...args).ok,false);
 }
});
Deno.test("Progress history is capped at 30 in-memory synthetic transitions",()=>{
 const s=open("owner"),id=view(s).queue[0].id;
 for(let i=0;i<55;i++)eq(s.transition(id,i%2===0?"reviewed":"todo").ok,true);
 const r=view(s);
 eq(r.change_history.length,30);
 yes(r.change_history.every(h=>h.synthetic_only&&h.role==="owner"),"Synthetic event markers");
 eq(r.real_audit_created,false);
});
Deno.test("Role and session never escalate: no setRole, grantRole or enableRelease methods",()=>{
 for(const role of ROLES){
  const s=open(role);
  eq(s.role,role);
  yes(!("setRole" in s)&&!("grantRole" in s)&&!("release" in s)&&!("writeToServer" in s),"No privilege elevation endpoint");
  eq(Object.isFrozen(s),true);
  eq(Object.isFrozen(view(s).release_gates),true);
 }
});
Deno.test("Only owner may reset fictional queue and audit; auditor/operator denied",()=>{
 const own=open("owner");const id=view(own).queue[0].id;
 own.transition(id,"reviewed");eq(view(own).change_history.length,1);
 eq(own.reset().ok,true);
 eq(view(own).queue[0].status,"todo");eq(view(own).change_history.length,0);
 eq(open("operator").reset().ok,false);eq(open("auditor").reset().ok,false);
});
Deno.test("Unknown filters and mocked malformed rendering calls deny access",()=>{
 eq(mountAdminReadinessSandbox(null,null).ok,false);
 eq(mountAdminReadinessSandbox(null,{ok:true,role:"customer"}).ok,false);
 eq(mountAdminReadinessSandbox({},null).ok,false);
 const s=open("owner");eq(s.snapshot({} as string,[] as unknown as string,"all").ok,false);
});
Deno.test("Pure engine never contacts network and contains no live customer data",()=>{
 const old=globalThis.fetch;
 globalThis.fetch=(()=>{throw Error("Unexpected outbound network use in sandbox");}) as typeof fetch;
 try{
  for(const role of ROLES){
   const s=open(role);const r=view(s,"bn");
   yes(JSON.stringify(r).length<85000,"Output bounded");
   yes(r.queue.every((t:{synthetic_only:boolean,id:string})=>t.synthetic_only&&t.id.includes(PLAN_VERSION)),"Fixed synthetic ids only");
  }
 }finally{globalThis.fetch=old;}
});
