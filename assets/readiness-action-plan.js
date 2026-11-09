/**
 * M1 VOR-009: versioned, deterministic 90-DAY EDUCATIONAL PLAN.
 * Reuses canonical VOR-007 question registry + VOR-008 result shape.
 * Source-only self-reflection; NOT creditworthiness/approval/financial advice.
 * No external I/O, dates, timers, PII, accounts, persisted data, or notifications.
 */
import {CATEGORIES,LOCALES,ENGINE_VERSION,questionsFor} from "./readiness-questions.js";
export const PLAN_VERSION="sandbox-2026-11-09-90d-v1";
export const MILESTONES=Object.freeze([
  Object.freeze({id:"d30",from:1,to:30,question_indices:Object.freeze([0,1])}),
  Object.freeze({id:"d60",from:31,to:60,question_indices:Object.freeze([2,3])}),
  Object.freeze({id:"d90",from:61,to:90,question_indices:Object.freeze([4,5])})
]);
export const PLAN_COPY=Object.freeze({
 en:{
  heading:"Your 90-day learning action plan",intro:"Six fictional learning tasks across three milestones. This is not an improvement promise, credit score or loan decision.",
  phase:(a,b)=>"Day "+a+"–"+b,completed:"Completed",remaining:"To review",
  taskDone:"Mark as needing review",taskTodo:"Mark educational topic reviewed",
  advice:"Why this topic?",status_missing:"No questionnaire answer yet — review this topic privately.",
  status_unsure:"Answer was unsure — explore this topic for clarity.",
  status_not_yet:"Topic not reviewed — consider the general guidance.",
  status_considered:"Topic self-reported as reviewed — revisit and reflect.",
  progress:(a,b)=>a+" of "+b+" educational tasks marked reviewed",
  reminderTitle:"Reminder preview — simulated only",
  daySelect:"Simulated day",previewOn:"Turn preview off",previewOff:"Preview a fictional reminder",
  disabled:"Reminder preview is off. No messages or schedules are created.",
  none:"No pending tasks due within seven simulated days of this milestone.",
  due:(count,day)=>count+" fictional topic(s) due by simulated Day "+day+". Nothing will be sent.",
  disclaimer:"Plan tasks and progress are fictional self-reflection only; no messages, subscriptions, CIBIL scores, eligibility, lender decisions or customer data are created. Closing or reloading clears everything."
 },
 bn:{
  heading:"আপনার ৯০ দিনের শিক্ষামূলক পরিকল্পনা",intro:"তিনটি ধাপে ছয়টি কাল্পনিক শেখার কাজ। এটি CIBIL বাড়ার প্রতিশ্রুতি, ক্রেডিট স্কোর বা ঋণ অনুমোদন নয়।",
  phase:(a,b)=>"দিন "+a+"–"+b,completed:"সম্পন্ন",remaining:"পর্যালোচনা বাকি",
  taskDone:"আবার পর্যালোচনার জন্য চিহ্নিত করুন",taskTodo:"শিক্ষামূলক বিষয়টি দেখা হয়েছে বলে চিহ্নিত করুন",
  advice:"এই বিষয়টি কেন?",status_missing:"প্রশ্নের উত্তর নেই — বিষয়টি ব্যক্তিগতভাবে দেখুন।",
  status_unsure:"উত্তর অনিশ্চিত — বিষয়টি আরও পরিষ্কার করে জানুন।",
  status_not_yet:"এখনও দেখা হয়নি — সাধারণ পরামর্শটি বিবেচনা করুন।",
  status_considered:"আগে দেখেছেন বলেছেন — আবার ভেবে দেখুন।",
  progress:(a,b)=>b+"টির মধ্যে "+a+"টি শিক্ষামূলক কাজ চিহ্নিত",
  reminderTitle:"রিমাইন্ডার প্রিভিউ — শুধু কাল্পনিক",
  daySelect:"কাল্পনিক দিন",previewOn:"প্রিভিউ বন্ধ করুন",previewOff:"কাল্পনিক রিমাইন্ডার দেখুন",
  disabled:"প্রিভিউ বন্ধ আছে। কোনো বার্তা বা সময়সূচি তৈরি হয় না।",
  none:"এই milestone-এর সাত দিনের মধ্যে বাকি থাকা কাজ নেই।",
  due:(count,day)=>"কাল্পনিক দিন "+day+"-এর মধ্যে "+count+"টি শিক্ষামূলক কাজ বাকি। কোনো বার্তা পাঠানো হবে না।",
  disclaimer:"কাজ ও অগ্রগতি শুধু কাল্পনিক শেখার অনুশীলন। কোনো বার্তা, সাবস্ক্রিপশন, CIBIL স্কোর, ঋণযোগ্যতা, ঋণদাতার সিদ্ধান্ত বা গ্রাহক তথ্য তৈরি হয় না। Reload করলে সব মুছে যাবে।"
 },
 hi:{
  heading:"आपकी ९०-दिन की शैक्षिक योजना",intro:"तीन चरणों में छह काल्पनिक सीखने के काम। यह CIBIL सुधार का वादा, स्कोर या ऋण मंजूरी नहीं है।",
  phase:(a,b)=>"दिन "+a+"–"+b,completed:"पूरा",remaining:"समीक्षा बाकी",
  taskDone:"फिर समीक्षा के लिए चिह्नित करें",taskTodo:"शैक्षिक विषय की समीक्षा पूरी चिह्नित करें",
  advice:"यह विषय क्यों?",status_missing:"अभी उत्तर नहीं है — इस विषय को निजी तौर पर समझें।",
  status_unsure:"उत्तर अनिश्चित था — विषय को और समझें।",
  status_not_yet:"अभी समीक्षा नहीं हुई — सामान्य मार्गदर्शन देखें।",
  status_considered:"पहले समीक्षा का उत्तर दिया था — फिर विचार करें।",
  progress:(a,b)=>b+" में से "+a+" शैक्षिक कामों की समीक्षा पूरी",
  reminderTitle:"रिमाइंडर पूर्वावलोकन — केवल काल्पनिक",
  daySelect:"काल्पनिक दिन",previewOn:"पूर्वावलोकन बंद करें",previewOff:"काल्पनिक रिमाइंडर देखें",
  disabled:"पूर्वावलोकन बंद है। कोई संदेश या शेड्यूल नहीं बनता।",
  none:"इस चरण में सात काल्पनिक दिनों के भीतर कोई बाकी काम नहीं है।",
  due:(count,day)=>count+" काल्पनिक विषयों को दिन "+day+" तक देखना है। कोई संदेश नहीं भेजा जाएगा।",
  disclaimer:"काम और प्रगति केवल काल्पनिक सीखने के लिए हैं। कोई संदेश, सदस्यता, CIBIL स्कोर, पात्रता, ऋणदाता निर्णय या ग्राहक डेटा नहीं बनता। रीलोड पर सब मिटेगा।"
 }
});
const allowed=(arr,value)=>typeof value==="string"&&arr.includes(value);
function validSnapshot(s){
 if(!s||typeof s!=="object"||!allowed(CATEGORIES,s.category)||!allowed(LOCALES,s.locale))return false;
 const r=s.result;
 return r&&r.ok===true&&r.category===s.category&&r.locale===s.locale&&r.version===ENGINE_VERSION&&
   r.kind==="education_only"&&r.credit_score===null&&r.eligibility_assessed===false&&
   r.approval_or_offer_available===false&&r.personal_data_stored===false&&
   Array.isArray(r.explanations)&&Array.isArray(r.unanswered_question_ids);
}
const taskId=(category,qid)=>PLAN_VERSION+":"+category+":"+qid;
/**
 * A public pure function: only validated VOR-007 educational result is allowed.
 * Done flags belong to a local memory Set, not to the quiz's considered answers.
 */
export function buildEducationalPlan(snapshot,completedIds=new Set(),simulatedDay=1,previewEnabled=false){
 if(!validSnapshot(snapshot))return Object.freeze({ok:false,code:"invalid_readiness_snapshot"});
 if(!(completedIds instanceof Set)||[...completedIds].some(id=>typeof id!=="string"))return Object.freeze({ok:false,code:"invalid_progress"});
 if(!Number.isInteger(simulatedDay)||simulatedDay<1||simulatedDay>90)return Object.freeze({ok:false,code:"invalid_simulated_day"});
 if(typeof previewEnabled!=="boolean")return Object.freeze({ok:false,code:"invalid_preview_mode"});
 const {category,locale,result}=snapshot;
 const questions=questionsFor(category);
 const ids=new Set(questions.map(q=>q.id));
 if(questions.length!==6||result.explanations.some(e=>!e||!ids.has(e.question_id)||
     !["considered","not_yet","unsure"].includes(e.input_choice))||
    result.unanswered_question_ids.some(x=>!ids.has(x)))return Object.freeze({ok:false,code:"invalid_result_shape"});
 const explanationById=new Map(result.explanations.map(e=>[e.question_id,e]));
 if(explanationById.size!==result.explanations.length||
    result.explanations.length+result.unanswered_question_ids.length!==questions.length)
    return Object.freeze({ok:false,code:"invalid_result_shape"});
 const c=PLAN_COPY[locale];
 const tasks=questions.map((q,i)=>{
  const explanation=explanationById.get(q.id);
  const state=explanation?explanation.input_choice:"missing";
  const dueDay=MILESTONES[Math.floor(i/2)].to;
  const id=taskId(category,q.id);
  const status=state==="missing"?c.status_missing:state==="unsure"?c.status_unsure:
    state==="not_yet"?c.status_not_yet:c.status_considered;
  return Object.freeze({
   id,question_id:q.id,milestone_id:MILESTONES[Math.floor(i/2)].id,due_day:dueDay,
   title:q.prompt[locale],action:q.action[locale],reason:q.rationale[locale],
   original_answer:state,explanation_status:status,
   completed:completedIds.has(id),source_rule_id:explanation?.rule_id??null,
   evidence:"synthetic_self_report_only"
  });
 });
 if([...completedIds].some(id=>!tasks.some(t=>t.id===id)))return Object.freeze({ok:false,code:"invalid_progress"});
 const milestones=MILESTONES.map(m=>{
   const members=tasks.filter(t=>t.milestone_id===m.id);
   return Object.freeze({id:m.id,from_day:m.from,to_day:m.to,
    title:c.phase(m.from,m.to),tasks:members,
    completed_count:members.filter(t=>t.completed).length,total_tasks:members.length});
 });
 const completedCount=tasks.filter(t=>t.completed).length;
 const dueMilestone=milestones.find(m=>simulatedDay<=m.to_day);
 const pending=dueMilestone?dueMilestone.tasks.filter(t=>!t.completed):[];
 const remindDue=previewEnabled&&dueMilestone&&dueMilestone.to_day-simulatedDay<=7&&pending.length>0;
 const reminder=Object.freeze({
  preview_enabled:previewEnabled,simulated_day:simulatedDay,
  notification_sent:false,delivery_enabled:false,scheduled_job_created:false,
  pending_count:remindDue?pending.length:0,
  text:!previewEnabled?c.disabled:remindDue?c.due(pending.length,dueMilestone.to_day):c.none
 });
 return Object.freeze({
  ok:true,version:PLAN_VERSION,questionnaire_version:ENGINE_VERSION,
  category,locale,kind:"synthetic_education_only",total_tasks:6,
  completed_count:completedCount,percent:Math.round(completedCount/6*100),
  milestones,tasks,reminder,credit_score:null,eligibility_assessed:false,
  loan_approval_available:false,persisted:false,consent_collected:false,
  privacy_notice:c.disclaimer
 });
}
/** In-memory progress only; no global state, clock, localStorage, messaging or timers. */
export function createEducationalPlanSession(){
 let category=null,done=new Set(),simulatedDay=1,previewEnabled=false;
 const sync=s=>{
  if(!validSnapshot(s))return false;
  if(category!==s.category){category=s.category;done=new Set();simulatedDay=1;previewEnabled=false;}
  return true;
 };
 return Object.freeze({
  view(snapshot){if(!sync(snapshot))return {ok:false,code:"invalid_readiness_snapshot"};
    return buildEducationalPlan(snapshot,done,simulatedDay,previewEnabled);},
  toggle(id,snapshot){if(!sync(snapshot)||typeof id!=="string")return false;
    const q=questionsFor(category);if(!q.some(x=>taskId(category,x.id)===id))return false;
    if(done.has(id))done.delete(id);else done.add(id);return true;},
  setDay(n){if(!Number.isInteger(n)||n<1||n>90)return false;simulatedDay=n;return true;},
  setReminderPreview(enabled){if(typeof enabled!=="boolean")return false;previewEnabled=enabled;return true;},
  reset(){category=null;done=new Set();simulatedDay=1;previewEnabled=false;},
  getReminderPreviewEnabled(){return previewEnabled;}
 });
}
