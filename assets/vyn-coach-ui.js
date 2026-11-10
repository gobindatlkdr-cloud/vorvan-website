/**
 * VOR-012 browser UI. All local and in-memory. This form DOES NOT submit anywhere.
 * Dynamic text only through textContent; never echo original practice text.
 */
import {createCoachSession,DEMO_NOTICE_VERSION} from "./vyn-coach-engine.js";
import {NOTICES as DEMO_NOTICES} from "./vyn-coach-notices.js";
const root=document.getElementById("vc-app");
if(root){
 const el=id=>root.querySelector("#"+id);
 const session=createCoachSession();
 const language=el("vc-language"),category=el("vc-category"),topic=el("vc-topic");
 const gate=el("vc-consent-gate"),coach=el("vc-coach"),status=el("vc-status");
 const qList=el("vc-questions"),message=el("vc-answer"),progress=el("vc-progress");
 const note=el("vc-prompt"),escalation=el("vc-human");
 const terms=el("vc-terms"),privacy=el("vc-privacy"),optIn=el("vc-opt-in");
 const dict={
 en:{title:"Vyn · educational coach",intro:"Fictional planning assistant — no credit or loan decisions",lang:"Language",
  gateTitle:"Start a temporary demo session",gate:"This public preview is not customer login or legally verified consent. It uses only fictional checkbox choices in memory. Do not type personal or financial details.",
  terms:"I acknowledge the unapproved demo Terms notice.",privacy:"I acknowledge the unapproved demo Privacy notice.",
  opt:"I voluntarily opt in to this temporary synthetic Coach demonstration.",begin:"Start demo",revoke:"Withdraw demo permission & clear answers",
  empty:"All three checkboxes are required to begin.",category:"Choose an educational category",
  questions:"Fictional planning checklist",answers:"Select a demonstration answer",placeholder:"Not answered",
  progress:"fictional topics reviewed",promptLabel:"Optional practice question (do not include PII)",prompt:"Example: What should I review next? Never enter OTP, PAN, Aadhaar, phone, email or account data.",
  topic:"What should Vyn explain?",plan:"Next learning steps",questionsTopic:"Questions for a lender",privacyTopic:"Privacy & redaction",humanTopic:"Talk to a human",
  ask:"Ask Vyn (offline)",response:"Vyn's safe guidance",noResponse:"Select a topic and ask Vyn. The response stays in this browser tab.",
  human:"Open human-support email (no message sent automatically)",reset:"To erase the demo, withdraw permission or reload the page.",
  notice:"Demo Notice v.",noScore:"No CIBIL score • No loan approval • No financial data storage",denied:"Consent not granted — no coaching started.",
  start:"Demo permission accepted locally. This is not production customer consent."},
 bn:{title:"Vyn · শিক্ষামূলক কোচ",intro:"কাল্পনিক পরিকল্পনার সহায়তা — ক্রেডিট বা ঋণের সিদ্ধান্ত নয়",lang:"ভাষা",
  gateTitle:"অস্থায়ী ডেমো শুরু করুন",gate:"এটি গ্রাহক লগইন বা আইনগতভাবে যাচাইকৃত সম্মতি নয়। শুধু কাল্পনিক নির্বাচন এই ট্যাবে থাকে। ব্যক্তিগত বা আর্থিক তথ্য লিখবেন না।",
  terms:"আমি অনুমোদন-বাকি ডেমো Terms নোটিশ স্বীকার করছি।",privacy:"আমি অনুমোদন-বাকি ডেমো Privacy নোটিশ স্বীকার করছি।",
  opt:"আমি অস্থায়ী কৃত্রিম Coach ডেমোতে অংশ নিতে সম্মত।",begin:"ডেমো শুরু",revoke:"সম্মতি প্রত্যাহার ও উত্তর মুছুন",
  empty:"ডেমো শুরুর আগে তিনটি চেকবক্স বেছে নিন।",category:"শিক্ষামূলক বিষয় বাছুন",
  questions:"কাল্পনিক পরিকল্পনার চেকলিস্ট",answers:"ডেমো উত্তর বাছুন",placeholder:"উত্তর দেওয়া হয়নি",
  progress:"কাল্পনিক বিষয় পর্যালোচিত",promptLabel:"ঐচ্ছিক ডেমো প্রশ্ন (ব্যক্তিগত তথ্য নয়)",prompt:"যেমন: পরের কাজ কী? OTP, PAN, Aadhaar, ফোন, ইমেইল বা অ্যাকাউন্ট তথ্য লিখবেন না।",
  topic:"Vyn কী ব্যাখ্যা করবে?",plan:"পরবর্তী শিক্ষামূলক কাজ",questionsTopic:"ঋণদাতাকে কী জিজ্ঞেস করবেন",privacyTopic:"গোপনীয়তা ও রেড্যাকশন",humanTopic:"মানুষের সহায়তা",
  ask:"Vyn-কে জিজ্ঞেস করুন (অফলাইন)",response:"Vyn-এর নিরাপদ নির্দেশনা",noResponse:"বিষয় বেছে Vyn-কে জিজ্ঞেস করুন। উত্তর শুধু এই ট্যাবে থাকে।",
  human:"Support ইমেইল খুলুন (স্বয়ংক্রিয়ভাবে বার্তা পাঠাবে না)",reset:"ডেমো মুছতে সম্মতি প্রত্যাহার করুন অথবা পেজ রিলোড করুন।",
  notice:"ডেমো নোটিশ v.",noScore:"CIBIL স্কোর নয় • ঋণ অনুমোদন নয় • আর্থিক তথ্য জমা হয় না",denied:"সম্মতি দেওয়া হয়নি — Coach চালু হয়নি।",
  start:"এই ট্যাবে ডেমো অনুমতি দেওয়া হয়েছে; এটি বাস্তব গ্রাহক সম্মতি নয়।"},
 hi:{title:"Vyn · शैक्षिक कोच",intro:"काल्पनिक योजना सहायता — क्रेडिट या ऋण निर्णय नहीं",lang:"भाषा",
  gateTitle:"अस्थायी डेमो शुरू करें",gate:"यह ग्राहक लॉगिन या कानूनी रूप से सत्यापित सहमति नहीं है। केवल काल्पनिक विकल्प इस टैब में रहते हैं। निजी या वित्तीय विवरण न लिखें।",
  terms:"मैं अप्रमाणित डेमो Terms सूचना स्वीकार करता/करती हूँ।",privacy:"मैं अप्रमाणित डेमो Privacy सूचना स्वीकार करता/करती हूँ।",
  opt:"मैं अस्थायी काल्पनिक Coach डेमो के लिए अलग से अनुमति देता/देती हूँ।",begin:"डेमो शुरू",revoke:"अनुमति वापस लें और जवाब हटाएँ",
  empty:"डेमो शुरू करने के लिए तीनों चेकबॉक्स ज़रूरी हैं।",category:"शैक्षिक श्रेणी चुनें",
  questions:"काल्पनिक योजना सूची",answers:"डेमो जवाब चुनें",placeholder:"जवाब नहीं दिया",
  progress:"काल्पनिक विषय देखे",promptLabel:"वैकल्पिक अभ्यास प्रश्न (निजी जानकारी नहीं)",prompt:"जैसे: आगे क्या देखूँ? OTP, PAN, आधार, फोन, ईमेल या खाता डेटा न लिखें।",
  topic:"Vyn क्या समझाए?",plan:"अगले शैक्षिक कदम",questionsTopic:"ऋणदाता से पूछने के सवाल",privacyTopic:"गोपनीयता व छिपाना",humanTopic:"मानव सहायता",
  ask:"Vyn से पूछें (ऑफ़लाइन)",response:"Vyn का सुरक्षित मार्गदर्शन",noResponse:"विषय चुनकर Vyn से पूछें। उत्तर केवल इस टैब में रहता है।",
  human:"सहायता ईमेल खोलें (अपने-आप संदेश नहीं जाएगा)",reset:"डेमो मिटाने के लिए अनुमति वापस लें या पेज फिर से खोलें।",
  notice:"डेमो सूचना v.",noScore:"CIBIL स्कोर नहीं • ऋण मंजूरी नहीं • वित्तीय डेटा संग्रह नहीं",denied:"अनुमति नहीं मिली — Coach शुरू नहीं हुआ।",
  start:"इस टैब में डेमो अनुमति मिली है; यह वास्तविक ग्राहक सहमति नहीं है।"}
 };
 const set=(id,value)=>{const node=el(id);if(node)node.textContent=value;};
 const locale=()=>session.snapshot().locale;
 function announce(value){status.textContent=value;}
 function renderQuestions(){
  const state=session.snapshot(),d=dict[locale()],questions=state.questionnaire.questions;
  qList.replaceChildren();
  for(const q of questions){
   const row=document.createElement("div");row.className="vc-question";
   const label=document.createElement("label");label.textContent=q.prompt;label.htmlFor="vc-question-"+q.id;
   const select=document.createElement("select");select.id=label.htmlFor;
   select.setAttribute("aria-label",q.prompt);
   const empty=document.createElement("option");empty.value="";empty.textContent=d.placeholder;select.append(empty);
   for(const choice of q.choices){const opt=document.createElement("option");opt.value=choice.value;opt.textContent=choice.label;select.append(opt);}
   select.value=state.answers[q.id]||"";
   select.addEventListener("change",()=>{
    if(select.value)session.chooseAnswer(q.id,select.value);
    else session.clearAnswer(q.id);
    // No free text or network requests; selection is synthetic memory only.
    renderProgress();clearReply();
   });
   row.append(label,select);qList.append(row);
  }
  renderProgress();
 }
 function renderProgress(){
  const state=session.snapshot();const d=dict[locale()];
  const answered=state.result?.answered_count||0;
  progress.textContent=answered+" / "+state.questionnaire.questions.length+" "+d.progress;
  progress.setAttribute("aria-label",progress.textContent);
  el("vc-progress-bar").value=answered;el("vc-progress-bar").max=state.questionnaire.questions.length;
 }
 function clearReply(){
  escalation.hidden=true;escalation.removeAttribute("href");
  message.textContent=dict[locale()].noResponse;
 }
 function render(){
  const state=session.snapshot(),d=dict[locale()];
  document.documentElement.lang=locale();
  set("vc-title",d.title);set("vc-subtitle",d.intro);
  set("vc-language-label",d.lang);set("vc-consent-title",d.gateTitle);set("vc-consent-description",d.gate);
  set("vc-terms-label",d.terms);set("vc-privacy-label",d.privacy);set("vc-opt-label",d.opt);
  set("vc-start",d.begin);set("vc-revoke",d.revoke);
  set("vc-category-label",d.category);set("vc-questions-heading",d.questions);
  set("vc-topic-label",d.topic);set("vc-note-label",d.promptLabel);
  note.placeholder=d.prompt;
  set("vc-send",d.ask);set("vc-answer-heading",d.response);
  set("vc-foot-safety",d.noScore);set("vc-memory-note",d.reset);
  set("vc-notice-version",d.notice+DEMO_NOTICE_VERSION);
  set("vc-terms-notice-text",DEMO_NOTICES.terms_acknowledgement[locale()]);
  set("vc-privacy-notice-text",DEMO_NOTICES.privacy_acknowledgement[locale()]);
  category.setAttribute("aria-label",d.category);
  const topicsText={plan:d.plan,questions:d.questionsTopic,privacy:d.privacyTopic,human:d.humanTopic};
  for(const option of [...topic.options])option.textContent=topicsText[option.value]||option.value;
  gate.hidden=state.demo_consented;coach.hidden=!state.demo_consented;
  if(state.demo_consented)renderQuestions();
  else{qList.replaceChildren();progress.textContent="";clearReply();}
 }
 language.addEventListener("change",()=>{
  if(session.chooseLanguage(language.value)){note.value="";clearReply();render();}
 });
 category.addEventListener("change",()=>{
  if(session.chooseCategory(category.value)){note.value="";clearReply();render();}
 });
 el("vc-start").addEventListener("click",()=>{
  const ok=session.grantConsent({mode:"synthetic_only",notice_version:DEMO_NOTICE_VERSION,
   terms_acknowledged:terms.checked,privacy_acknowledged:privacy.checked,coach_opt_in:optIn.checked});
  announce(ok?dict[locale()].start:dict[locale()].empty);
  if(ok){render();category.focus();}
 });
 el("vc-revoke").addEventListener("click",()=>{
  session.revoke();terms.checked=false;privacy.checked=false;optIn.checked=false;
  note.value="";render();announce(dict[locale()].denied);el("vc-start").focus();
 });
 el("vc-send").addEventListener("click",()=>{
  // Delete the raw input before evaluating; never print it to the chat or network.
  const practice=note.value;note.value="";
  const reply=session.reply({topic:topic.value,prompt:practice});
  if(!reply.ok){message.textContent=dict[locale()].gate;return;}
  message.textContent=reply.message;
  escalation.hidden=true;escalation.removeAttribute("href");
  if(reply.escalation){
   escalation.href=reply.escalation.url;escalation.textContent=dict[locale()].human+
     " · "+reply.escalation.email;
   escalation.hidden=false;
  }
  message.focus();
 });
 root.dataset.coachMode="synthetic_only";
 root.dataset.noNetwork="true";
 render();
}
