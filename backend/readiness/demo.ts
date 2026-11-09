/**
 * Run: deno run backend/readiness/demo.ts
 * Source-only deterministic fake examples; never prompts for personal information.
 */
import {evaluateReadiness,getQuestionnaire} from "./engine.ts";
import {questionsFor} from "./questions.ts";
const outputs = [
  {category:"personal",locale:"bn",answers:{
    repayment_budget_review:"considered",
    personal_purpose:"not_yet"
  }},
  {category:"business",locale:"en",answers:Object.fromEntries(
    questionsFor("business").map(q=>[q.id,"not_yet"]))},
  {category:"education",locale:"hi",answers:Object.fromEntries(
    questionsFor("education").map(q=>[q.id,"considered"]))}
] as const;
for(const x of outputs){
 const result=evaluateReadiness({mode:"synthetic_only",...x});
 if(!result.ok)throw Error(result.code);
 const form=getQuestionnaire(x.category,x.locale);
 if(!form.ok)throw Error(form.code);
 console.log(JSON.stringify({
  category:x.category,locale:x.locale,question_ids:form.questions.map(q=>q.id),
  workflow_status:result.workflow_status,
  answered:result.answered_count,total:result.total_questions,
  missing:result.unanswered_question_ids,uncertain:result.unsure_question_ids,
  next_step_ids:result.next_steps.map(v=>v.question_id),
  cibil_score:result.credit_score,eligibility_assessed:result.eligibility_assessed,
  financial_offer_available:result.approval_or_offer_available,
  personal_data_stored:result.personal_data_stored,
  disclaimer:result.disclaimer
 }));
}
