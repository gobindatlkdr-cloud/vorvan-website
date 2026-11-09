/** VOR-007 — tests actual pure synthetic-only readiness questionnaire + rules. */
import {evaluateReadiness,getQuestionnaire} from "../readiness/engine.ts";
import {ANSWERS,CATEGORIES,DISCLAIMERS,ENGINE_VERSION,LOCALES,questionsFor} from "../readiness/questions.ts";
function eq(a:unknown,b:unknown,msg="assertion"){if(a!==b)throw Error(msg+": expected "+String(b)+", got "+String(a));}
function ok(v:unknown,msg="assertion"){if(!v)throw Error(msg);}
function json(v:unknown){return JSON.stringify(v);}
const complete=(category:"personal"|"business"|"education",answer:"considered"|"not_yet"|"unsure"="considered")=>
  Object.fromEntries(questionsFor(category).map(q=>[q.id,answer]));
const input=(category:"personal"|"business"|"education",locale:"en"|"bn"|"hi"="en",answers:Record<string,unknown>=complete(category))=>
  ({mode:"synthetic_only",category,locale,answers});
const assertResult=(x:ReturnType<typeof evaluateReadiness>):Extract<typeof x,{ok:true}>=>{
 if(!x.ok)throw Error("unexpected error "+x.code);
 return x;
};
const assertError=(x:ReturnType<typeof evaluateReadiness>,expected:string)=>{
 if(x.ok)throw Error("unexpected successful evaluation");
 eq(x.code,expected);
};
Deno.test("Questionnaire has exact 3 categories, fixed choices and 6 unique required items each",()=>{
 eq(CATEGORIES.length,3);eq(ANSWERS.length,3);
 for(const c of CATEGORIES){
  const q=getQuestionnaire(c,"en");
  ok(q.ok,"valid category");
  if(!q.ok)continue;
  eq(q.questions.length,6,c);
  eq(new Set(q.questions.map(x=>x.id)).size,6,c+" unique");
  for(const item of q.questions){
   eq(item.required,true);
   eq(item.answer_type,"fixed_choice_only");
   eq(item.choices.length,3);
   eq(item.choices.map(x=>x.value).join(","),"considered,not_yet,unsure");
  }
  eq(q.personal_data_allowed,false);eq(q.financial_services_enabled,false);
 }
});
Deno.test("All 3 categories x 3 locales contain translated prompts and warnings",()=>{
 for(const c of CATEGORIES)for(const l of LOCALES){
  const q=getQuestionnaire(c,l);
  if(!q.ok)throw Error("get questionnaire unexpectedly failed");
  eq(q.version,ENGINE_VERSION);eq(q.locale,l);eq(q.category,c);
  ok(q.heading.length>=12,c+"/"+l+" localized heading");
  ok(q.disclaimer.length>=80,c+"/"+l+" disclaimer");
  for(const item of q.questions){
   ok(item.prompt.length>=12,c+"/"+l+"/"+item.id+" prompt");
   ok(item.explanation.length>=15,c+"/"+l+"/"+item.id+" rationale");
  }
  eq(q.disclaimer,DISCLAIMERS[l]);
 }
});
Deno.test("Complete reviewed questionnaire produces learning-only status, never score or eligibility",()=>{
 for(const c of CATEGORIES){
  const out=assertResult(evaluateReadiness(input(c)));
  eq(out.workflow_status,"educational_checklist_reviewed");
  eq(out.answered_count,6);eq(out.total_questions,6);
  eq(out.unanswered_question_ids.length,0);eq(out.unsure_question_ids.length,0);
  eq(out.explanations.length,6);eq(out.next_steps.length,0);
  eq(out.credit_score,null);eq(out.eligibility_assessed,false);
  eq(out.approval_or_offer_available,false);eq(out.personal_data_stored,false);
  eq(out.kind,"education_only");
 }
});
Deno.test("Zero answers remain incomplete with six next steps in source order",()=>{
 for(const c of CATEGORIES){
  const out=assertResult(evaluateReadiness(input(c,"en",{})));
  eq(out.workflow_status,"needs_more_information");
  eq(out.answered_count,0);eq(out.unanswered_question_ids.length,6);
  eq(out.next_steps.length,6);eq(out.explanations.length,0);
  eq(out.next_steps.map(x=>x.question_id).join(","),questionsFor(c).map(x=>x.id).join(","));
 }
});
Deno.test("Unsure answer needs clarification even when all six present",()=>{
 const answers=complete("personal");
 answers["personal_income_variability"]="unsure";
 const out=assertResult(evaluateReadiness(input("personal","en",answers)));
 eq(out.answered_count,6);eq(out.workflow_status,"needs_more_information");
 eq(out.unsure_question_ids.join(","),"personal_income_variability");
 eq(out.next_steps.length,1);
 const x=out.explanations.find(x=>x.question_id==="personal_income_variability")!;
 eq(x.observation,"clarification_suggested");eq(x.input_choice,"unsure");
 eq(x.evidence,"synthetic_self_report_only");ok(x.next_step!.length>12);
});
Deno.test("Not-yet answers give localized next steps without numerical score",()=>{
 for(const l of LOCALES){
  const answers=complete("business","not_yet");
  const out=assertResult(evaluateReadiness(input("business",l,answers)));
  eq(out.workflow_status,"educational_checklist_reviewed");
  eq(out.next_steps.length,6);
  eq(out.explanations.filter(x=>x.observation==="review_suggested").length,6);
  ok(out.next_steps.every(x=>x.suggestion.length>12));
  eq(out.credit_score,null);eq(out.approval_or_offer_available,false);
 }
});
Deno.test("Missing + unsure + reviewed mix preserves ordering and truthful counts",()=>{
 const out=assertResult(evaluateReadiness(input("education","bn",{
  repayment_budget_review:"considered",
  obligations_review:"unsure",
  education_course_research:"not_yet",
 })));
 eq(out.answered_count,3);eq(out.unanswered_question_ids.length,3);
 eq(out.unsure_question_ids.join(","),"obligations_review");
 eq(out.workflow_status,"needs_more_information");
 eq(out.next_steps.length,5);eq(out.explanations.length,3);
});
Deno.test("Category crossover answers are rejected instead of mixed",()=>{
 assertError(evaluateReadiness(input("business","en",complete("personal"))),"unknown_answer_key");
 assertError(evaluateReadiness(input("personal","en",complete("education"))),"unknown_answer_key");
});
Deno.test("Unexpected root fields including forged ID or private finances fail closed",()=>{
 const good=input("personal");
 for(const extra of [{user_id:"00000000-0000-4000-8000-000000000001"},{cibil_score:790},
  {pan:"ABCDE1234F"},{income:"50000"},{approval:true},{authorization:"Bearer fake"},
  {customer_name:"synthetic person"}]){
  assertError(evaluateReadiness({...good,...extra}),"invalid_input");
 }
});
Deno.test("Unknown choices, free text, numerical amounts, null and arrays fail closed",()=>{
 for(const value of [50000,null,true,[],{}, "ABCDE1234F","salary 50000",
  "not_applicable","approved","", "underwriting"]){
  const answers={...complete("personal"),personal_purpose:value};
  assertError(evaluateReadiness(input("personal","en",answers)),"invalid_answer_value");
 }
});
Deno.test("Unsupported locale, category and non-synthetic mode rejected",()=>{
 assertError(evaluateReadiness({...input("personal"),mode:"production"}),"invalid_mode");
 assertError(evaluateReadiness({...input("personal"),locale:"fr"}),"invalid_locale");
 assertError(evaluateReadiness({...input("personal"),category:"short_term"}),"invalid_category");
 eq(getQuestionnaire("short_term","en").ok,false);
 eq(getQuestionnaire("personal","fr").ok,false);
});
Deno.test("Malformed payloads, missing fields and non-object answers fail closed",()=>{
 for(const v of [null,[],42,"text",{},{
  category:"personal",locale:"en",answers:{}
 },{
  mode:"synthetic_only",category:"personal",locale:"en",answers:[]
 },{
  mode:"synthetic_only",category:"personal",locale:"en",answers:null
 }])eq(evaluateReadiness(v).ok,false);
});
Deno.test("EN BN HI warnings explicitly prohibit real CIBIL and loan decision claims",()=>{
 const en=assertResult(evaluateReadiness(input("personal","en")));
 const bn=assertResult(evaluateReadiness(input("personal","bn")));
 const hi=assertResult(evaluateReadiness(input("personal","hi")));
 ok(en.disclaimer.includes("No CIBIL/credit score"));
 ok(bn.disclaimer.includes("CIBIL"));ok(hi.disclaimer.includes("CIBIL"));
 for(const o of [en,bn,hi]){
  eq(o.credit_score,null);eq(o.eligibility_assessed,false);
  eq(o.approval_or_offer_available,false);
 }
});
Deno.test("Rule outputs are reproducible and do not mutate inputs",()=>{
 const sample=input("business","bn",complete("business"));
 const original=json(sample);
 const first=evaluateReadiness(sample),second=evaluateReadiness(sample);
 eq(json(first),json(second));eq(json(sample),original);
 ok(json(first).length<12000,"bounded output");
});
Deno.test("Every explanation carries stable rule ID, synthetic evidence and rationale",()=>{
 const result=assertResult(evaluateReadiness(input("education","hi",complete("education","not_yet"))));
 for(const item of result.explanations){
  ok(item.rule_id.startsWith("v1_"+item.question_id+"_"));
  eq(item.evidence,"synthetic_self_report_only");
  ok(item.reason.length>16);ok(item.next_step!==null);
 }
});
Deno.test("Pure engine performs no external network or storage interaction",()=>{
 const prev=globalThis.fetch;
 globalThis.fetch=(() => {throw Error("readiness attempted network");}) as typeof fetch;
 try{eq(evaluateReadiness(input("personal")).ok,true);}finally{globalThis.fetch=prev;}
});
