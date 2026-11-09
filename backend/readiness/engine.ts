/**
 * M1 VOR-007 — deterministic and EXPLAINABLE questionnaire rules (SOURCE ONLY).
 * There is no numerical readiness/credit score, no lender eligibility model,
 * no financial data collection, storage, external calls or production endpoint.
 * A "reviewed" status describes answering educational questions, NOT approval.
 */
import {
  ANSWERS, CATEGORIES, CHOICES, DISCLAIMERS, ENGINE_VERSION, HEADINGS, LOCALES,
  questionsFor,
} from "./questions.ts";
import type {Answer, Category, Locale} from "./questions.ts";

type Input = {
  mode: "synthetic_only";
  category: Category;
  locale: Locale;
  answers: Record<string, Answer>;
};
export type Explanation = Readonly<{
  question_id: string;
  rule_id: string;
  input_choice: Answer;
  observation: "self_reported_consideration" | "review_suggested" | "clarification_suggested";
  reason: string;
  next_step: string | null;
  evidence: "synthetic_self_report_only";
}>;
export type ChecklistResult = Readonly<{
  ok: true;
  version: string;
  category: Category;
  locale: Locale;
  kind: "education_only";
  workflow_status: "needs_more_information" | "educational_checklist_reviewed";
  answered_count: number;
  total_questions: number;
  unanswered_question_ids: readonly string[];
  unsure_question_ids: readonly string[];
  explanations: readonly Explanation[];
  next_steps: readonly {question_id: string; suggestion: string}[];
  credit_score: null;
  eligibility_assessed: false;
  approval_or_offer_available: false;
  personal_data_stored: false;
  disclaimer: string;
}>;
export type EngineError = Readonly<{ok: false; code:
  "invalid_input"|"invalid_category"|"invalid_locale"|"invalid_mode"|
  "invalid_answers"|"unknown_answer_key"|"invalid_answer_value"}>;
const error = (code: EngineError["code"]): EngineError => ({ok:false,code});
function object(v:unknown):v is Record<string, unknown> {
  return v!==null&&typeof v==="object"&&!Array.isArray(v)&&
    (Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
}
/**
 * Get a localized, read-only declaration that a future VOR-008 form can render.
 * Never links to a live application or asks for numerical financial data.
 */
export function getQuestionnaire(category:unknown, locale:unknown="en"){
  if(typeof category!=="string"||!CATEGORIES.includes(category as Category))
    return error("invalid_category");
  if(typeof locale!=="string"||!LOCALES.includes(locale as Locale))
    return error("invalid_locale");
  const c=category as Category, l=locale as Locale;
  return {
    ok:true as const, version:ENGINE_VERSION, category:c, locale:l,
    heading:HEADINGS[c][l], mode:"synthetic_only" as const,
    choices:ANSWERS.map(value=>({value,label:CHOICES[value][l]})),
    questions:questionsFor(c).map(q=>({
      id:q.id, required:true as const, prompt:q.prompt[l],
      explanation:q.rationale[l], answer_type:"fixed_choice_only" as const,
      choices:ANSWERS.map(value=>({value,label:CHOICES[value][l]})),
    })),
    personal_data_allowed:false as const,
    financial_services_enabled:false as const,
    disclaimer:DISCLAIMERS[l],
  };
}
/**
 * Accepts only a small finite-choice synthetic object. Unknown keys, numeric values,
 * a user_id, PAN, amounts, free-text or any other unexpected field fail closed.
 * All status/action texts are server-defined; input is never reflected verbatim.
 */
export function evaluateReadiness(raw:unknown):ChecklistResult|EngineError{
  if(!object(raw))return error("invalid_input");
  const fields=Object.keys(raw);
  if(fields.length!==4||!["mode","category","locale","answers"].every(x=>Object.hasOwn(raw,x)))
    return error("invalid_input");
  if(raw.mode!=="synthetic_only")return error("invalid_mode");
  if(typeof raw.category!=="string"||!CATEGORIES.includes(raw.category as Category))
    return error("invalid_category");
  if(typeof raw.locale!=="string"||!LOCALES.includes(raw.locale as Locale))
    return error("invalid_locale");
  if(!object(raw.answers))return error("invalid_answers");
  const category=raw.category as Category,locale=raw.locale as Locale,answerMap=raw.answers;
  const questions=questionsFor(category), ids=new Set(questions.map(q=>q.id));
  if(Object.keys(answerMap).some(k=>!ids.has(k)))return error("unknown_answer_key");
  if(Object.values(answerMap).some(a=>typeof a!=="string"||!ANSWERS.includes(a as Answer)))
    return error("invalid_answer_value");
  const unanswered:string[]=[],unsure:string[]=[],explanations:Explanation[]=[],next_steps:{question_id:string;suggestion:string}[]=[];
  for(const q of questions){
    if(!Object.hasOwn(answerMap,q.id)){
      unanswered.push(q.id);
      next_steps.push({question_id:q.id,suggestion:q.action[locale]});
      continue;
    }
    const answer=answerMap[q.id] as Answer;
    const observation=answer==="considered"?"self_reported_consideration":
      answer==="not_yet"?"review_suggested":"clarification_suggested";
    if(answer==="unsure")unsure.push(q.id);
    const suggested=answer!=="considered"?q.action[locale]:null;
    explanations.push({
      question_id:q.id,rule_id:"v1_"+q.id+"_"+answer,input_choice:answer,
      observation,reason:q.rationale[locale],next_step:suggested,
      evidence:"synthetic_self_report_only"
    });
    if(suggested)next_steps.push({question_id:q.id,suggestion:suggested});
  }
  const needs=unanswered.length>0||unsure.length>0;
  return {
    ok:true,version:ENGINE_VERSION,category,locale,kind:"education_only",
    workflow_status:needs?"needs_more_information":"educational_checklist_reviewed",
    answered_count:questions.length-unanswered.length,total_questions:questions.length,
    unanswered_question_ids:unanswered,unsure_question_ids:unsure,
    explanations,next_steps,credit_score:null,eligibility_assessed:false,
    approval_or_offer_available:false,personal_data_stored:false,
    disclaimer:DISCLAIMERS[locale],
  };
}
/** No API, no database calls and no module-level state or external integrations. */
