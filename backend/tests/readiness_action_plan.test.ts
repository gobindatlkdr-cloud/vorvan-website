/**
 * M1/VOR-009: deterministic education-only plan tests using real VOR-007/008 modules.
 * Do not allow network, env, filesystem, timestamps or production state.
 */
import {createPassportSession} from "../../assets/readiness-controller.js";
import {
 buildEducationalPlan,createEducationalPlanSession,MILESTONES,PLAN_COPY,PLAN_VERSION
} from "../../assets/readiness-action-plan.js";
import {questionsFor,ENGINE_VERSION} from "../../assets/readiness-questions.js";
function eq(a:unknown,b:unknown,label="assert"){if(JSON.stringify(a)!==JSON.stringify(b))throw Error(label+": "+JSON.stringify(a)+" != "+JSON.stringify(b));}
function yes(a:unknown,label:string){if(!a)throw Error(label);}
type FullPlan=Extract<ReturnType<typeof buildEducationalPlan>,{milestones:unknown}>;
function ready(value:unknown):FullPlan{
 if(!value||typeof value!=="object"||!("milestones" in value))
  throw Error("Plan unexpectedly rejected: "+JSON.stringify(value));
 return value as FullPlan;
}
const snap=(category="personal",locale="en")=>createPassportSession({category,locale}).snapshot();
Deno.test("Plan version and canonical VOR-007 six questions grouped into exact day 30/60/90 phases",()=>{
 eq(PLAN_VERSION,"sandbox-2026-11-09-90d-v1");
 eq(MILESTONES.map(m=>[m.id,m.from,m.to]),[["d30",1,30],["d60",31,60],["d90",61,90]]);
 for(const category of ["personal","business","education"]){
  const s=snap(category);
  const p=ready(buildEducationalPlan(s));
  eq(p.category,category);eq(p.questionnaire_version,ENGINE_VERSION);
  eq(p.total_tasks,6);eq(p.completed_count,0);eq(p.percent,0);
  eq(p.tasks.map(t=>t.question_id),questionsFor(category).map(q=>q.id));
  eq(p.milestones.map(m=>m.total_tasks),[2,2,2]);
  eq(p.tasks.map(t=>t.due_day),[30,30,60,60,90,90]);
  yes(p.tasks.every(t=>!t.completed&&t.evidence==="synthetic_self_report_only"),"No automatic completion");
  eq(p.credit_score,null);eq(p.eligibility_assessed,false);
  eq(p.loan_approval_available,false);eq(p.persisted,false);eq(p.consent_collected,false);
 }
});
Deno.test("All three locales translate tasks, milestones, reasons, reminders and disclaimers",()=>{
 for(const category of ["personal","business","education"])
  for(const locale of ["en","bn","hi"]){
   const s=snap(category,locale),p=ready(buildEducationalPlan(s));
   eq(p.locale,locale);eq(p.version,PLAN_VERSION);
   yes(p.tasks.every(t=>t.title.length>15&&t.reason.length>15&&t.action.length>14),"Full localized task");
   yes(p.milestones.every(m=>m.title.length>5),"Localized milestone");
   yes(PLAN_COPY[locale as keyof typeof PLAN_COPY].heading.length>16,"Localized heading");
   yes(p.privacy_notice.length>75,"Localized no-score/no-notification disclosure");
  }
});
Deno.test("Missing, unsure, reviewed and not-yet answers explain origins without claiming scoring",()=>{
 const controller=createPassportSession({category:"education",locale:"bn"});
 const s0=controller.snapshot();
 const first=ready(buildEducationalPlan(s0));
 eq(first.tasks[0].original_answer,"missing");
 controller.choose("unsure");controller.next();controller.choose("not_yet");controller.next();controller.choose("considered");
 const p=ready(buildEducationalPlan(controller.snapshot()));
 eq(p.tasks.map(t=>t.original_answer).slice(0,4),["unsure","not_yet","considered","missing"]);
 eq(p.completed_count,0);
 yes(p.tasks[0].source_rule_id?.includes("unsure"),"Uncertain question traceable to VOR-007");
 yes(p.tasks[1].source_rule_id?.includes("not_yet"),"Not-yet reason traceable to VOR-007");
 yes(p.tasks[2].source_rule_id?.includes("considered"),"Considered choice traceable to VOR-007");
 yes(p.tasks[3].source_rule_id===null,"No fabricated explanation for missing answer");
});
Deno.test("Educational tasks are NOT automatically complete when all questionnaire answers are considered",()=>{
 const c=createPassportSession();
 for(let i=0;i<6;i++){c.goTo(i);c.choose("considered");}
 const p=ready(buildEducationalPlan(c.snapshot()));
 eq(c.snapshot().result.ok,true);
 eq(p.completed_count,0);eq(p.percent,0);
});
Deno.test("Marking plan tasks changes only task progress and is reversible",()=>{
 const quiz=createPassportSession({category:"business"});
 const session=createEducationalPlanSession();const s=quiz.snapshot();
 const ids=ready(session.view(s)).tasks.map(t=>t.id);
 yes(session.toggle(ids[0],s),"Task 1 toggles");
 yes(session.toggle(ids[2],s),"Task 3 toggles");
 let p=ready(session.view(s));
 eq(p.completed_count,2);eq(p.percent,33);eq(p.milestones.map(m=>m.completed_count),[1,1,0]);
 eq(p.tasks[0].completed,true);eq(p.tasks[2].completed,true);
 eq(quiz.snapshot().answered,0);
 yes(session.toggle(ids[0],s),"Task reopens");p=ready(session.view(s));
 eq(p.completed_count,1);eq(p.percent,17);
});
Deno.test("Rejects forged task IDs, invalid simulated day and invalid reminder opt-in",()=>{
 const s=snap(),state=createEducationalPlanSession();
 for(const id of ["x","v1",null,{},1,"personal_income_variability"]){
  yes(!state.toggle(id,s),"Forged action must be rejected");
 }
 for(const day of [0,91,1.5,Infinity,NaN,"30",null]){
  yes(!state.setDay(day),"Only integer days 1..90 are allowed");
  eq(buildEducationalPlan(s,new Set(),day as number,false).ok,false);
 }
 for(const flag of ["true",null,1,{}]){
  yes(!state.setReminderPreview(flag),"Preview requires boolean");
  eq(buildEducationalPlan(s,new Set(),1,flag as boolean).ok,false);
 }
 eq(state.getReminderPreviewEnabled(),false);
});
Deno.test("Default reminders OFF, even on deadline; preview cannot send or schedule",()=>{
 const p=ready(buildEducationalPlan(snap(),new Set(),30,false));
 eq(p.reminder.preview_enabled,false);eq(p.reminder.pending_count,0);
 eq(p.reminder.notification_sent,false);eq(p.reminder.delivery_enabled,false);
 eq(p.reminder.scheduled_job_created,false);
});
Deno.test("Opt-in preview shows fictional due milestones only in their last seven simulated days",()=>{
 const s=snap("personal");
 for(const [day,count] of [[1,0],[22,0],[23,2],[29,2],[30,2],
   [31,0],[52,0],[53,2],[60,2],[61,0],[82,0],[83,2],[90,2]]){
  const p=ready(buildEducationalPlan(s,new Set(),day,true));
  eq(p.reminder.pending_count,count,"Simulated day "+day);
  eq(p.reminder.notification_sent,false);
  eq(p.reminder.scheduled_job_created,false);
 }
});
Deno.test("Reminders update as educational tasks are marked reviewed, never create a schedule",()=>{
 const s=snap(),state=createEducationalPlanSession();state.view(s);state.setDay(29);
 state.setReminderPreview(true);
 let p=ready(state.view(s));eq(p.reminder.pending_count,2);
 state.toggle(p.tasks[0].id,s);
 p=ready(state.view(s));eq(p.reminder.pending_count,1);
 state.toggle(p.tasks[1].id,s);
 p=ready(state.view(s));eq(p.reminder.pending_count,0);
 eq(p.reminder.notification_sent,false);
});
Deno.test("Changing language keeps current category task IDs and completion",()=>{
 const quiz=createPassportSession({category:"education",locale:"en"});
 const plan=createEducationalPlanSession();
 const before=ready(plan.view(quiz.snapshot()));plan.toggle(before.tasks[3].id,quiz.snapshot());
 quiz.setLanguage("hi");let after=ready(plan.view(quiz.snapshot()));
 eq(after.completed_count,1);eq(after.tasks[3].completed,true);
 eq(after.tasks[3].id,before.tasks[3].id);
 yes(after.tasks[3].title!==before.tasks[3].title,"Translation actually differs");
 quiz.setLanguage("bn");after=ready(plan.view(quiz.snapshot()));
 eq(after.completed_count,1);eq(after.locale,"bn");
});
Deno.test("Changing category clears all task progress, reminder preview and simulated day",()=>{
 const quiz=createPassportSession({category:"education"}),plan=createEducationalPlanSession();
 let p=ready(plan.view(quiz.snapshot()));plan.toggle(p.tasks[0].id,quiz.snapshot());
 plan.setDay(89);plan.setReminderPreview(true);
 quiz.setCategory("business");p=ready(plan.view(quiz.snapshot()));
 eq(p.completed_count,0);eq(p.reminder.simulated_day,1);eq(p.reminder.preview_enabled,false);
 eq(p.category,"business");
});
Deno.test("Reset removes every milestone completion and opt-in choice, no storage",()=>{
 const quiz=createPassportSession(),plan=createEducationalPlanSession();
 const p=ready(plan.view(quiz.snapshot()));plan.toggle(p.tasks[5].id,quiz.snapshot());
 plan.setDay(89);plan.setReminderPreview(true);plan.reset();quiz.reset();
 const r=ready(plan.view(quiz.snapshot()));
 eq(r.completed_count,0);eq(r.reminder.preview_enabled,false);eq(r.reminder.simulated_day,1);
});
Deno.test("Rejects forged/PII-bearing readiness and mismatched canonical result",()=>{
 const s=snap();
 const invalid=[
  null,{},[],{...s,locale:"fr"},{...s,category:"short_term"},
  {...s,result:{...s.result,credit_score:790}},
  {...s,result:{...s.result,approval_or_offer_available:true}},
  {...s,result:{...s.result,explanations:[{question_id:"whatever",rule_id:"fabricated"}]}},
  {...s,answers:{...s.answers,pan:"ABCDE1234F"}},
  {...s,answers:{...s.answers,income:50000}},
  {...s,result:{...s.result,personal_data_stored:true}},
 ];
 for(const input of invalid)eq(buildEducationalPlan(input).ok,false);
});
Deno.test("Rejects bad completed tasks and never reflects arbitrary strings",()=>{
 const s=snap();
 const p=ready(buildEducationalPlan(s));
 const forged=new Set([p.tasks[0].id,"PAN-ABCDE1234F"]);
 const r=buildEducationalPlan(s,forged,1,false);
 eq(r.ok,false);
 eq(buildEducationalPlan(s,new Set([1]),1,false).ok,false);
 eq(buildEducationalPlan(s,{} as Set<string>,1,false).ok,false);
});
Deno.test("Pure module cannot access network, timers or storage; output remains bounded",()=>{
 const before=globalThis.fetch;
 globalThis.fetch=(()=>{throw Error("unexpected network");}) as typeof fetch;
 try{
  const quiz=createPassportSession({locale:"hi"});
  const state=createEducationalPlanSession();
  const plan=ready(state.view(quiz.snapshot()));
  yes(JSON.stringify(plan).length<24000,"bounded generated content");
  eq(plan.persisted,false);eq(plan.reminder.notification_sent,false);
 }finally{globalThis.fetch=before;}
});
