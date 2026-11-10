/**
 * VORVAN M2 / VOR-012 — Vyn educational coach, browser-only, fixed rules.
 * This is NOT an AI language model, credit scoring, customer consent, KYC,
 * lender decision, financial advice or production onboarding.
 * NO fetch, persistence, cookies, analytics, history or network.
 */
import {evaluateReadiness,getQuestionnaire} from "./readiness-engine.js";
import {NOTICE_VERSION} from "./vyn-coach-notices.js";
export const COACH_VERSION="m2-vor012-sandbox-2026-11-10-v1";
export const DEMO_NOTICE_VERSION=NOTICE_VERSION; // Generated from VOR-006 unapproved notice registry
export const LANGUAGES=Object.freeze(["en","bn","hi"]);
export const CATEGORIES=Object.freeze(["personal","business","education"]);
export const TOPICS=Object.freeze(["plan","questions","privacy","human"]);
const CHANNELS=Object.freeze({support:"support@vorvan.co.in",legal:"legal@vorvan.co.in"});
const TEXT=Object.freeze({
 en:{
  consent:"To try this fictional demo, acknowledge the unapproved demo notices and opt in to a temporary coaching session. This is not legally verified customer consent.",
  missing:"Please review the unanswered or uncertain planning topics first. This is an educational checklist, not an eligibility evaluation.",
  reviewed:"You have reviewed these fictional learning prompts. This is not evidence of financial readiness, creditworthiness or lender approval.",
  plan:"Suggested learning topics, based only on your synthetic checklist:",
  questions:"Use official lender or institution information to check documentary requirements. No institution has assessed your details here.",
  privacy:"No customer registration, bureau lookup, storage or message delivery is active. Never type passwords, OTP, PAN, Aadhaar, account details or personal credit information.",
  human:"For website support, use the official support team. Do not send OTP, financial records or identity documents.",
  sensitive:"Sensitive-looking text was redacted locally and NOT processed as a coaching question. Please remove it. Do not share passwords, OTP or financial identifiers.",
  unsafe:"I cannot approve a loan, calculate a personal credit score, guarantee acceptance, accept fees or collect KYC. Please consult a regulated lender through its official channels.",
  malformed:"This is a synthetic demo only. Please select a permitted educational topic and use fictional inputs.",
  next:"Suggested next step:",empty:"No further synthetic action was selected; check official informational resources instead.",
  disclaimer:"Synthetic educational guidance only. No CIBIL score, lender eligibility, loan offer, KYC, payments or professional financial advice. VORVAN incorporation remains pending.",
  escalation:"Open the team mailbox yourself; no message or chat content is sent automatically."
 },
 bn:{
  consent:"এই কাল্পনিক ডেমো চালাতে অননুমোদিত ডেমো নোটিশগুলি স্বীকার করে অস্থায়ী Coach opt-in দিন। এটি আইনগতভাবে যাচাইকৃত গ্রাহক সম্মতি নয়।",
  missing:"আগে উত্তর না দেওয়া বা অনিশ্চিত পরিকল্পনার বিষয়গুলি দেখুন। এটি শিক্ষামূলক চেকলিস্ট, ঋণযোগ্যতা যাচাই নয়।",
  reviewed:"আপনি কাল্পনিক শিক্ষামূলক বিষয়গুলি পর্যালোচনা করেছেন। এতে আর্থিক প্রস্তুতি, ক্রেডিট যোগ্যতা বা ঋণ অনুমোদন প্রমাণিত হয় না।",
  plan:"আপনার কৃত্রিম চেকলিস্ট অনুযায়ী শিক্ষামূলক পরবর্তী বিষয়:",
  questions:"নথির প্রয়োজন জানতে অনুমোদিত ঋণদাতা বা প্রতিষ্ঠানের অফিসিয়াল তথ্য পড়ুন। এখানে কোনো প্রতিষ্ঠান আপনার তথ্য যাচাই করেনি।",
  privacy:"এখানে গ্রাহক নিবন্ধন, ক্রেডিট রিপোর্ট, তথ্য সংরক্ষণ বা মেসেজ পাঠানো হয় না। পাসওয়ার্ড, OTP, PAN, Aadhaar, অ্যাকাউন্ট বা ব্যক্তিগত ক্রেডিট তথ্য লিখবেন না।",
  human:"ওয়েবসাইট সাপোর্টের জন্য অফিসিয়াল Support Team ব্যবহার করুন। OTP, পরিচয়পত্র বা আর্থিক নথি পাঠাবেন না।",
  sensitive:"সংবেদনশীল লেখা এই ব্রাউজারেই গোপন করা হয়েছে এবং Coach প্রশ্ন হিসাবে প্রক্রিয়াকরণ হয়নি। অনুগ্রহ করে মুছে দিন; OTP বা আর্থিক পরিচয় দেবেন না।",
  unsafe:"আমি ঋণ অনুমোদন, ব্যক্তিগত ক্রেডিট স্কোর গণনা, নিশ্চয়তা, ফি গ্রহণ বা KYC সংগ্রহ করতে পারি না। অফিসিয়াল অনুমোদিত ঋণদাতার সঙ্গে যোগাযোগ করুন।",
  malformed:"এটি শুধু কৃত্রিম ডেমো। অনুমোদিত শিক্ষামূলক বিষয় বাছুন এবং কাল্পনিক তথ্য ব্যবহার করুন।",
  next:"পরবর্তী শিক্ষামূলক কাজ:",empty:"আর কোনো কাল্পনিক কাজ নির্বাচিত নেই; অফিসিয়াল তথ্যমূলক উৎস দেখুন।",
  disclaimer:"শুধু কৃত্রিম শিক্ষামূলক নির্দেশনা। CIBIL স্কোর, ঋণযোগ্যতা, অফার, KYC, পেমেন্ট বা পেশাগত আর্থিক পরামর্শ নয়। VORVAN-এর নিবন্ধন এখনও বাকি।",
  escalation:"আপনি নিজে টিমের ইমেইল খুলতে পারবেন; কোনো মেসেজ বা চ্যাট স্বয়ংক্রিয়ভাবে পাঠানো হয় না।"
 },
 hi:{
  consent:"इस काल्पनिक डेमो के लिए अप्रमाणित डेमो सूचनाएँ स्वीकार करें और अस्थायी Coach अनुमति दें। यह कानूनी रूप से सत्यापित ग्राहक सहमति नहीं है।",
  missing:"पहले अधूरे या अनिश्चित योजना-विषयों की समीक्षा करें। यह शैक्षिक सूची है, ऋण पात्रता जाँच नहीं।",
  reviewed:"आपने काल्पनिक सीखने के विषय देखे हैं। इससे वित्तीय तैयारी, क्रेडिट योग्यता या ऋण मंजूरी सिद्ध नहीं होती।",
  plan:"आपकी काल्पनिक सूची पर आधारित शैक्षिक अगले विषय:",
  questions:"दस्तावेज़ संबंधी शर्तें अधिकृत ऋणदाता या संस्थान के आधिकारिक स्रोत से देखें। यहाँ किसी संस्था ने आपके विवरण जाँचे नहीं हैं।",
  privacy:"यहाँ ग्राहक पंजीकरण, क्रेडिट रिपोर्ट, डेटा संग्रह या संदेश भेजना सक्रिय नहीं है। पासवर्ड, OTP, PAN, आधार, खाता या निजी क्रेडिट विवरण न लिखें।",
  human:"वेबसाइट सहायता के लिए आधिकारिक सहायता टीम से संपर्क करें। OTP, पहचान दस्तावेज़ या वित्तीय रिकॉर्ड न भेजें।",
  sensitive:"संवेदनशील दिखने वाला पाठ स्थानीय रूप से छिपाया गया और प्रश्न के रूप में इस्तेमाल नहीं हुआ। उसे हटाएँ; OTP या वित्तीय जानकारी न दें।",
  unsafe:"मैं ऋण मंजूर, व्यक्तिगत क्रेडिट स्कोर का अनुमान, गारंटी, शुल्क स्वीकार या KYC एकत्र नहीं कर सकता। आधिकारिक ऋणदाता से बात करें।",
  malformed:"यह सिर्फ़ काल्पनिक डेमो है। अनुमत शैक्षिक विषय चुनें और काल्पनिक उदाहरण प्रयोग करें।",
  next:"अगला शैक्षिक कदम:",empty:"कोई और काल्पनिक कदम नहीं चुना गया; आधिकारिक जानकारी देखें।",
  disclaimer:"केवल काल्पनिक शैक्षिक मार्गदर्शन। CIBIL स्कोर, ऋण पात्रता, प्रस्ताव, KYC, भुगतान या पेशेवर वित्तीय सलाह नहीं। VORVAN पंजीकरण लंबित है।",
  escalation:"आप स्वयं टीम का ईमेल खोल सकते हैं; कोई संदेश या चैट अपने-आप नहीं भेजी जाएगी।"
 }
});
const isObject=v=>v!==null&&typeof v==="object"&&!Array.isArray(v)&&
 (Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const valid=(arr,v)=>typeof v==="string"&&arr.includes(v);
const ensureLocale=l=>valid(LANGUAGES,l)?l:"en";
const MASK="[REDACTED]";
const PATTERNS=Object.freeze([
 ["email",/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi],
 ["pan",/\b[A-Z]{5}\d{4}[A-Z]\b/gi],
 ["aadhaar",/(?<!\d)[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}(?!\d)/g],
 ["phone",/(?<!\d)(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/g],
 ["ifsc",/\b[A-Z]{4}0[A-Z0-9]{6}\b/gi],
 ["card",/(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g],
 ["bank",/\b(?:bank\s+a\/?c|account\s*(?:no\.?|number)?|a\/c)\s*[:=#-]?\s*[a-z0-9 -]{6,32}/gi],
 ["credential",/\b(?:otp|one.time.password|pin|password|passcode|cvv|api[_ -]?key|secret|token)\s*(?::|=|is|number)?\s*[a-z0-9!@#$%^&*_.-]{3,40}/gi],
 ["upi",/\b[a-z0-9._-]{2,}@[a-z][a-z0-9.-]{2,}\b/gi]
]);
/** Local, best-effort pattern redaction. Not a comprehensive PII detector. */
export function redactSensitive(value){
 if(typeof value!=="string"||value.length>320)return {safe:false,code:"invalid_prompt",redacted:"",labels:[]};
 let output=value;const labels=[];
 for(const [kind,pattern] of PATTERNS){
  pattern.lastIndex=0;
  if(pattern.test(output)){labels.push(kind);pattern.lastIndex=0;output=output.replace(pattern,MASK);}
 }
 // Never return raw source from main coach reply or any output persisted to page.
 return {safe:labels.length===0,code:labels.length?"personal_information_detected":"ok",
  redacted:output,labels};
}
const DANGER=/(?:guarantee.{0,25}(?:loan|credit|approval)|(?:loan|credit|cibil).{0,20}(?:approve|guarantee|score\s*[789]\d{2}|exact score)|(?:approve|guarantee).{0,15}loan|(?:loan|kyc|cibil).{0,20}(?:otp|upload|payment|fee)|(?:pay|send).{0,12}(?:fee|money)|(?:100%|certain).{0,12}approv|(?:ঋণ|লোন).{0,18}(?:অনুমোদন|গ্যারান্টি|স্কোর)|(?:लोन|ऋण).{0,18}(?:मंजूर|गारंटी|स्कोर))/i;
const NO_SAFE_ECHO="response_contains_only_first_party_static_text";
export function createCoachSession(opts={}){
 let locale=valid(LANGUAGES,opts.locale)?opts.locale:"en";
 let category=valid(CATEGORIES,opts.category)?opts.category:"personal";
 let permission=false,answers=Object.create(null),lastStatus="idle";
 const form=()=>getQuestionnaire(category,locale);
 function snapshot(){
  const questionnaire=form();
  if(!questionnaire.ok)throw Error("readiness_questionnaire_unavailable");
  const result=permission?evaluateReadiness({mode:"synthetic_only",category,locale,answers:{...answers}}):null;
  if(result&&!result.ok)throw Error("readiness_evaluation_unavailable");
  return Object.freeze({
   locale,category,version:COACH_VERSION,notice_version:DEMO_NOTICE_VERSION,
   demo_consented:permission,consent_proof:"ephemeral_demo_acknowledgement_only",
   real_consent_verified:false,customer_authenticated:false,
   external_ai_enabled:false,financial_services_enabled:false,network_used:false,
   questionnaire,result,lastStatus,
   answers:permission?Object.freeze({...answers}):Object.freeze({}),
  });
 }
 function grantConsent(payload){
  if(!isObject(payload)||Object.keys(payload).length!==5||
    payload.mode!=="synthetic_only"||payload.notice_version!==DEMO_NOTICE_VERSION||
    payload.terms_acknowledged!==true||payload.privacy_acknowledged!==true||
    payload.coach_opt_in!==true)return false;
  permission=true;answers=Object.create(null);lastStatus="consented";return true;
 }
 function clearAnswer(id){
  if(!permission||typeof id!=="string"||!form().questions.some(q=>q.id===id))return false;
  delete answers[id];lastStatus="answer_cleared";return true;
 }
 function revoke(){
  permission=false;answers=Object.create(null);lastStatus="revoked";
  return snapshot();
 }
 function chooseLanguage(l){if(!valid(LANGUAGES,l))return false;locale=l;return true;}
 function chooseCategory(c){
  if(!valid(CATEGORIES,c))return false;
  if(c!==category){category=c;answers=Object.create(null);lastStatus="category_changed";}
  return true;
 }
 function chooseAnswer(id,choice){
  if(!permission||typeof id!=="string"||!valid(["considered","not_yet","unsure"],choice))return false;
  if(!form().questions.some(q=>q.id===id))return false;
  answers[id]=choice;lastStatus="answered";return true;
 }
 const link=(channel)=>"mailto:"+CHANNELS[channel];
 function reply(raw){
  if(!permission)return {ok:false,code:"consent_required"};
  if(!isObject(raw)||Object.keys(raw).some(k=>!["topic","prompt"].includes(k))||
    !valid(TOPICS,raw.topic)||raw.prompt!==undefined&&typeof raw.prompt!=="string")
    return {ok:false,code:"invalid_request"};
  const prompt=raw.prompt??"";
  const cleaned=redactSensitive(prompt);
  if(cleaned.code==="invalid_prompt")return {ok:false,code:"invalid_prompt"};
  const words=TEXT[locale],result=evaluateReadiness({mode:"synthetic_only",category,locale,answers:{...answers}});
  if(!result.ok)return {ok:false,code:"invalid_answers"};
  let message="",kind="educational",escalation=null;
  // First inspect/redact. Nothing user-typed is ever echoed, stored or sent.
  if(!cleaned.safe){kind="blocked_sensitive";message=words.sensitive;escalation="support";}
  else if(DANGER.test(prompt)){kind="safety_redirect";message=words.unsafe;escalation="support";}
  else if(raw.topic==="privacy"){kind="human_escalation";message=words.privacy;escalation="legal";}
  else if(raw.topic==="human"){kind="human_escalation";message=words.human;escalation="support";}
  else if(raw.topic==="questions"){message=words.questions;}
  else{
    message=(result.workflow_status==="needs_more_information"?words.missing:words.reviewed)+
      "\n"+words.plan;
    const suggestions=result.next_steps.slice(0,2).map((x,i)=>String(i+1)+". "+x.suggestion);
    message+="\n"+(suggestions.length?suggestions.join("\n"):words.empty);
  }
  lastStatus=kind;
  return Object.freeze({
    ok:true,version:COACH_VERSION,mode:"synthetic_only",kind,
    message:message+"\n\n"+words.disclaimer,
    disclaimer:words.disclaimer,escalation:escalation?Object.freeze({
      team:escalation,email:CHANNELS[escalation],url:link(escalation),
      note:words.escalation,auto_sent:false
    }):null,
    based_on:"vor007_synthetic_readiness_only",status:result.workflow_status,
    answered:result.answered_count,total:result.total_questions,
    credit_score:null,lender_eligibility_assessed:false,loan_approved:false,
    pii_redacted:!cleaned.safe,request_persisted:false,
    raw_message_reflected:false,output_policy:NO_SAFE_ECHO
  });
 }
 return Object.freeze({snapshot,grantConsent,revoke,chooseLanguage,chooseCategory,chooseAnswer,clearAnswer,reply});
}
