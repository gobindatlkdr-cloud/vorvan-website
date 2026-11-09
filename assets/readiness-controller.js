/**
 * VOR-008 private-in-memory controller shared by customer UI and CI.
 * Uses the GENERATED ESM copy of VOR-007 getQuestionnaire/evaluateReadiness;
 * the build checker + Deno parity suite prevents any rules divergence.
 * No localStorage, cookies, network, analytics, forms or backend writes.
 */
import {evaluateReadiness,getQuestionnaire} from "./readiness-engine.js";
import {ANSWERS,CATEGORIES,LOCALES} from "./readiness-questions.js";
const valid=(values,value)=>typeof value==="string"&&values.includes(value);
export function createPassportSession(options={}){
  let category=valid(CATEGORIES,options.category)?options.category:"personal";
  let locale=valid(LOCALES,options.locale)?options.locale:"en";
  let answers=Object.create(null),step=0,screen="questions";
  const questions=()=>getQuestionnaire(category,locale);
  const required=()=>questions().questions.map(q=>q.id);
  function snapshot(){
    const questionnaire=questions();
    if(!questionnaire.ok)throw Error("questionnaire_schema_error");
    const result=evaluateReadiness({mode:"synthetic_only",category,locale,answers:{...answers}});
    if(!result.ok)throw Error("readiness_result_error");
    const answered=result.answered_count,total=result.total_questions;
    return Object.freeze({
      category,locale,screen,step,
      answered,total,percent:Math.round(answered*100/total),
      current:questionnaire.questions[step],
      questionnaire,result,answers:Object.freeze({...answers}),
      allAnswered:answered===total,
      consent_status:"unavailable_not_approved",
      personal_information_received:false,
      customer_login_required_for_production:true
    });
  }
  function choose(choice){
    if(!valid(ANSWERS,choice))return false;
    const id=required()[step];
    if(!id)return false;
    answers[id]=choice;
    return true;
  }
  function next(){step=Math.min(step+1,required().length-1);screen="questions";return snapshot();}
  function previous(){step=Math.max(step-1,0);screen="questions";return snapshot();}
  function goTo(index){
    if(!Number.isInteger(index)||index<0||index>=required().length)return false;
    step=index;screen="questions";return true;
  }
  function setLanguage(value){
    if(!valid(LOCALES,value))return false;
    locale=value;return true;
  }
  function setCategory(value){
    if(!valid(CATEGORIES,value))return false;
    if(category!==value){category=value;answers=Object.create(null);step=0;screen="questions";}
    return true;
  }
  function passport(){screen="passport";return snapshot();}
  function edit(){screen="questions";return snapshot();}
  function reset(){answers=Object.create(null);step=0;screen="questions";return snapshot();}
  return Object.freeze({snapshot,choose,next,previous,goTo,setLanguage,setCategory,passport,edit,reset});
}
