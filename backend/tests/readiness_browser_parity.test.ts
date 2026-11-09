/**
 * VOR-008: browser-generated JavaScript MUST match the actual VOR-007
 * TypeScript rules for 3 categories x 3 languages x 3^6 synthetic answers.
 */
import {evaluateReadiness as evaluateSource,getQuestionnaire as questionnaireSource} from "../readiness/engine.ts";
import {evaluateReadiness as evaluateBrowser,getQuestionnaire as questionnaireBrowser} from "../../assets/readiness-engine.js";
import {CATEGORIES,LOCALES,questionsFor} from "../readiness/questions.ts";
function eq(a:unknown,b:unknown,label:string){if(JSON.stringify(a)!==JSON.stringify(b))throw Error(label+" source/browser divergence");}
const choices=["considered","not_yet","unsure"] as const;
Deno.test("Generated browser questionnaires are identical to VOR-007 source in all categories/locales",()=>{
 for(const category of CATEGORIES)for(const locale of LOCALES){
  eq(questionnaireBrowser(category,locale),questionnaireSource(category,locale),category+"/"+locale);
 }
});
Deno.test("Generated browser and VOR-007 source evaluate all 6561 complete synthetic choice combinations identically",()=>{
 let cases=0;
 for(const category of CATEGORIES){
  const ids=questionsFor(category).map(q=>q.id);
  for(const locale of LOCALES)for(let index=0;index<3**ids.length;index++){
   let z=index;const answers:Record<string,string>={};
   for(const id of ids){answers[id]=choices[z%3];z=Math.floor(z/3);}
   const payload={mode:"synthetic_only",category,locale,answers};
   const expected=evaluateSource(payload),actual=evaluateBrowser(payload);
   eq(actual,expected,category+"/"+locale+"/"+index);
   if(!actual.ok)throw Error("Expected complete questionnaire "+category+"/"+locale);
   if(actual.credit_score!==null||actual.eligibility_assessed||
     actual.approval_or_offer_available||actual.personal_data_stored)
     throw Error("Unsafe numeric eligibility, offer or stored data");
   cases++;
  }
 }
 if(cases!==6561)throw Error("Expected all 6561 combinations; got "+cases);
 console.log("PASS VOR-008: 6561 exhaustive TS source/browser rule parity evaluations");
});
Deno.test("Incomplete, unsure, forbidden PII keys and malformed categories preserve TS/browser parity",()=>{
 for(const category of CATEGORIES)for(const locale of LOCALES){
  const ids=questionsFor(category).map(q=>q.id);
  const input=[
   {},
   {[ids[0]]:"considered"},
   {[ids[0]]:"unsure",[ids[1]]:"not_yet"},
   {[ids[0]]:"1234567890"},
   {[ids[0]]:"approved"},
   {user_id:"fake"},
   {[ids[0]]:true},
  ];
  for(const answers of input){
   const payload={mode:"synthetic_only",category,locale,answers};
   eq(evaluateBrowser(payload),evaluateSource(payload),"partial/"+category+"/"+locale);
  }
 }
 for(const bad of [
  {mode:"live",category:"personal",locale:"bn",answers:{}},
  {mode:"synthetic_only",category:"short_term",locale:"en",answers:{}},
  {mode:"synthetic_only",category:"personal",locale:"fr",answers:{}},
  {mode:"synthetic_only",category:"personal",locale:"en",answers:{},pan:"ABCDE1234F"},
  null,[],42
 ])eq(evaluateBrowser(bad),evaluateSource(bad),"invalid input");
});
