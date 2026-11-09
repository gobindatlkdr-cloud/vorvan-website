/**
 * M1 VOR-008 interactive, no-PII, in-memory educational Passport.
 * Actual evaluation is imported from generated VOR-007 rules.
 * No fetch/XHR, localStorage, cookies, send, analytics or financial data fields.
 */
import {createPassportSession} from "./readiness-controller.js";
const $=id=>document.getElementById(id);
const session=createPassportSession();
const labels={
 en:{
  titleLead:"Your readiness",titleAccent:"passport.",lang:"Language",
  eyebrow:"VORVAN PRODUCT EXPERIENCE LAB · SANDBOX",
  subtitle:"A private, guided learning checklist. Reflect on six planning topics for a fictional Personal, Business, or Education loan journey.",
  safety:"Demo only — no credit assessment or customer data collected",
  privacy:"Your choices stay in this browser tab's memory only. There are no text, identity, financial, account or file fields. Closing or reloading resets the demonstration.",
  categoryKicker:"STEP 01 · PICK A TOPIC",categoryTitle:"Choose a learning pathway",
  categorySub:"Switching category clears the current synthetic answers. No lender information is used.",
  categories:{personal:"Personal",business:"Business",education:"Education"},
  categoryDescs:{personal:"Everyday planning",business:"Business funding basics",education:"Planning studies"},
  shortTerm:"Short-term loans remain an informational category only; a readiness questionnaire is not yet available for them.",
  stepKicker:"STEP 02 · LEARN",sideTitle:"Your learning journey",sideHint:"Six reflection topics. No financial score.",
  progress:(a,t)=>a+" of "+t+" questions answered",topic:(i)=>"Topic "+i,
  sideFoot:"Progress counts answered topics — never a credit-readiness or CIBIL score.",
  questionCounter:(a,t)=>"QUESTION "+a+" / "+t,draft:"SANDBOX · NO REAL DATA",
  choicesHeading:"Choose one answer",questionNote:"Choose a fictional reflection state. Skip any question; the passport will show what's missing.",
  back:"← Back",next:"Next →",review:"View my educational passport →",
  passportLabel:"EDUCATIONAL PASSPORT · SYNTHETIC ONLY",
  passportHeading:"Your learning overview",
  passportSubtitle:"Feedback is based on fixed fictional choices, not a credit report or financial assessment.",
  statusIncomplete:"More learning topics to review",
  statusReviewed:"Educational checklist reviewed",
  statusDescriptionIncomplete:"Some topics are missing or uncertain. This is a learning note, not an eligibility decision.",
  statusDescriptionReviewed:"You have considered every topic. This does not mean loan eligibility or approval.",
  statAnswered:"Answered",statMissing:"Missing",statUnsure:"Not sure",
  actions:"Learning next steps",actionsSub:"Topics to consider, not credit or lender recommendations.",
  explanations:"Why these suggestions?",none:"No additional review topics are listed. This does not indicate loan approval.",
  noExplanations:"No answers yet. Choose any topic above to begin this fictional exercise.",
  edit:"← Edit answers",restart:"Restart fictional demo",
  releaseKicker:"RELEASE BOUNDARY",releaseTitle:"Built for learning, not lending.",
  releaseText:"VORVAN is in pre-incorporation development. This educational UI is not customer registration, financial advice, a loan offer, a CIBIL score or a lender application. Secure customer login and legally approved consent are not active.",
  explore:"Explore loan categories ↗",
  footer:"Proposed VORVAN PRIVATE LIMITED · Incorporation pending · No live lending, credit-bureau, KYC or payment services.",
  error:"This fictional demonstration cannot show a result. Restart the page. No answers have been uploaded."
 },
 bn:{
  titleLead:"আপনার প্রস্তুতির",titleAccent:"পাসপোর্ট।",lang:"ভাষা",
  eyebrow:"VORVAN প্রোডাক্ট এক্সপেরিয়েন্স · স্যান্ডবক্স",
  subtitle:"এটি ব্যক্তিগতভাবে ব্যবহারের শিক্ষামূলক চেকলিস্ট। পার্সোনাল, বিজনেস বা এডুকেশন ঋণ সম্পর্কে ছয়টি পরিকল্পনার বিষয় ভাবুন।",
  safety:"শুধু ডেমো — ক্রেডিট মূল্যায়ন বা গ্রাহকের তথ্য সংগ্রহ নয়",
  privacy:"আপনার নির্বাচন শুধু এই browser tab-এর অস্থায়ী memory-তে থাকবে। নাম, আয়, পরিচয়পত্র, অ্যাকাউন্ট বা ফাইলের কোনো ঘর নেই। Reload বা tab বন্ধ করলে সব মুছে যাবে।",
  categoryKicker:"ধাপ ০১ · বিষয় নির্বাচন",categoryTitle:"শেখার বিষয় বেছে নিন",
  categorySub:"বিষয় পরিবর্তন করলে এই ডেমোর আগের উত্তর মুছে যাবে। ঋণদাতার কোনো তথ্য ব্যবহার হয় না।",
  categories:{personal:"পার্সোনাল",business:"বিজনেস",education:"এডুকেশন"},
  categoryDescs:{personal:"ব্যক্তিগত পরিকল্পনা",business:"ব্যবসার ফান্ডিং সম্পর্কে",education:"পড়াশোনার পরিকল্পনা"},
  shortTerm:"শর্ট-টার্ম লোন শুধু তথ্যমূলক বিভাগ; এই ধাপে তার প্রশ্নমালা নেই।",
  stepKicker:"ধাপ ০২ · শেখা",sideTitle:"আপনার শেখার অগ্রগতি",sideHint:"ছয়টি বিষয়। কোনো ক্রেডিট স্কোর নয়।",
  progress:(a,t)=>t+"টির মধ্যে "+a+"টি প্রশ্নের উত্তর দেওয়া হয়েছে",topic:(i)=>"বিষয় "+i,
  sideFoot:"Progress শুধু উত্তর দেওয়া বিষয়ের সংখ্যা — এটি CIBIL বা ক্রেডিট প্রস্তুতির স্কোর নয়।",
  questionCounter:(a,t)=>"প্রশ্ন "+a+" / "+t,draft:"স্যান্ডবক্স · বাস্তব তথ্য নয়",
  choicesHeading:"একটি উত্তর নির্বাচন করুন",questionNote:"কাল্পনিক অবস্থার উত্তর বেছে নিন। চাইলে প্রশ্ন বাদ দিতে পারেন; Passport-এ তা অসম্পূর্ণ দেখাবে।",
  back:"← আগের প্রশ্ন",next:"পরের প্রশ্ন →",review:"আমার শিক্ষামূলক পাসপোর্ট দেখুন →",
  passportLabel:"শিক্ষামূলক পাসপোর্ট · কৃত্রিম তথ্য",
  passportHeading:"আপনার শেখার সারাংশ",
  passportSubtitle:"শুধু নির্দিষ্ট কাল্পনিক উত্তরের ভিত্তিতে ব্যাখ্যা; ক্রেডিট রিপোর্ট বা আর্থিক মূল্যায়ন নয়।",
  statusIncomplete:"আরও কিছু বিষয় পর্যালোচনা করা দরকার",
  statusReviewed:"শিক্ষামূলক চেকলিস্ট দেখা সম্পন্ন",
  statusDescriptionIncomplete:"কিছু উত্তর বাকি বা অনিশ্চিত আছে। এটি ঋণযোগ্যতার সিদ্ধান্ত নয়।",
  statusDescriptionReviewed:"আপনি সব বিষয় বিবেচনা করেছেন। এর অর্থ ঋণ পাওয়ার যোগ্যতা বা অনুমোদন নয়।",
  statAnswered:"উত্তর",statMissing:"বাকি",statUnsure:"অনিশ্চিত",
  actions:"পরবর্তী শিক্ষামূলক করণীয়",actionsSub:"এগুলো ভাবনার বিষয়, ঋণ বা ঋণদাতার সুপারিশ নয়।",
  explanations:"এই ব্যাখ্যাগুলোর কারণ কী?",none:"আর কোনো বিষয় বাকি নেই। তবু এটি ঋণ অনুমোদন বোঝায় না।",
  noExplanations:"এখনও উত্তর নেই। উপরের যেকোনো বিষয় দিয়ে কাল্পনিক অনুশীলন শুরু করুন।",
  edit:"← উত্তর বদলান",restart:"নতুন করে শুরু করুন",
  releaseKicker:"পরিসেবার সীমা",releaseTitle:"শুধু শেখার জন্য, ঋণ দেওয়ার জন্য নয়।",
  releaseText:"VORVAN-এর কোম্পানি নিবন্ধন সম্পন্ন হয়নি। এটি গ্রাহক নিবন্ধন, আর্থিক পরামর্শ, ঋণের অফার, CIBIL স্কোর বা আবেদন নয়। নিরাপদ গ্রাহক লগইন ও আইনগত অনুমোদিত সম্মতি এখনও চালু নেই।",
  explore:"ঋণের বিভাগ দেখুন ↗",
  footer:"প্রস্তাবিত VORVAN PRIVATE LIMITED · নিবন্ধন অপেক্ষমাণ · কোনো বাস্তব ঋণ/CIBIL/KYC/পেমেন্ট সেবা নেই।",
  error:"এই ডেমোর ফল দেখানো যাচ্ছে না। পেজ আবার খুলুন। কোনো উত্তর আপলোড হয়নি।"
 },
 hi:{
  titleLead:"आपका तैयारी",titleAccent:"पासपोर्ट।",lang:"भाषा",
  eyebrow:"VORVAN प्रोडक्ट अनुभव · सैंडबॉक्स",
  subtitle:"यह केवल निजी शिक्षण सूची है। पर्सनल, बिज़नेस या एजुकेशन लोन की काल्पनिक योजना के छह विषयों पर विचार करें।",
  safety:"सिर्फ डेमो — कोई क्रेडिट मूल्यांकन या ग्राहक डेटा संग्रह नहीं",
  privacy:"आपके चुनाव इसी ब्राउज़र टैब की अस्थायी मेमोरी में रहते हैं। नाम, आय, पहचान, बैंक खाता या फ़ाइल के फ़ील्ड नहीं हैं। रीलोड करने पर उत्तर मिट जाएंगे।",
  categoryKicker:"चरण ०१ · विषय चुनें",categoryTitle:"सीखने का विषय चुनें",
  categorySub:"विषय बदलने पर पुराने काल्पनिक उत्तर मिट जाएंगे। किसी ऋणदाता की जानकारी नहीं ली जाती।",
  categories:{personal:"पर्सनल",business:"बिज़नेस",education:"एजुकेशन"},
  categoryDescs:{personal:"निजी योजना",business:"व्यापार फंडिंग की मूल बातें",education:"पढ़ाई की योजना"},
  shortTerm:"शॉर्ट-टर्म ऋण अभी सूचना की श्रेणी है; इस चरण में उसका प्रश्नपत्र नहीं है।",
  stepKicker:"चरण ०२ · सीखें",sideTitle:"आपकी सीखने की प्रगति",sideHint:"छह विचार-विषय। कोई क्रेडिट स्कोर नहीं।",
  progress:(a,t)=>t+" में से "+a+" प्रश्नों का उत्तर",topic:(i)=>"विषय "+i,
  sideFoot:"प्रगति केवल उत्तरों की संख्या है — यह CIBIL या क्रेडिट तैयारी स्कोर नहीं है।",
  questionCounter:(a,t)=>"प्रश्न "+a+" / "+t,draft:"सैंडबॉक्स · कोई वास्तविक डेटा नहीं",
  choicesHeading:"एक उत्तर चुनें",questionNote:"काल्पनिक विकल्प चुनें। प्रश्न छोड़ भी सकते हैं; पासपोर्ट में वह अधूरा दिखेगा।",
  back:"← पिछला",next:"अगला →",review:"मेरा शैक्षिक पासपोर्ट देखें →",
  passportLabel:"शैक्षिक पासपोर्ट · काल्पनिक डेटा",
  passportHeading:"आपकी सीखने की जानकारी",
  passportSubtitle:"केवल तय काल्पनिक विकल्पों पर आधारित जानकारी; क्रेडिट रिपोर्ट या वित्तीय जाँच नहीं।",
  statusIncomplete:"कुछ विषयों पर और विचार करना है",
  statusReviewed:"शैक्षिक सूची की समीक्षा हुई",
  statusDescriptionIncomplete:"कुछ उत्तर बाकी हैं या अनिश्चित हैं। यह ऋण पात्रता निर्णय नहीं है।",
  statusDescriptionReviewed:"आपने सभी विषयों पर विचार किया है। इसका अर्थ ऋण मंजूरी या पात्रता नहीं है।",
  statAnswered:"उत्तर",statMissing:"बाकी",statUnsure:"अनिश्चित",
  actions:"अगले सीखने के कदम",actionsSub:"ये विचार करने के विषय हैं, ऋण या ऋणदाता की सिफारिश नहीं।",
  explanations:"इन सुझावों के पीछे क्या कारण है?",none:"कोई अतिरिक्त समीक्षा विषय नहीं है। इसका मतलब ऋण मंजूरी नहीं है।",
  noExplanations:"अभी कोई उत्तर नहीं दिया। काल्पनिक अभ्यास शुरू करने के लिए ऊपर विषय चुनें।",
  edit:"← उत्तर बदलें",restart:"नया डेमो शुरू करें",
  releaseKicker:"सेवा की सीमा",releaseTitle:"सिर्फ सीखने के लिए, ऋण के लिए नहीं।",
  releaseText:"VORVAN का कंपनी पंजीकरण अभी लंबित है। यह ग्राहक पंजीकरण, वित्तीय सलाह, ऋण प्रस्ताव, CIBIL स्कोर या आवेदन नहीं है। सुरक्षित ग्राहक लॉगिन और कानूनी सहमति अभी सक्रिय नहीं हैं।",
  explore:"ऋण श्रेणियाँ देखें ↗",
  footer:"प्रस्तावित VORVAN PRIVATE LIMITED · पंजीकरण लंबित · कोई लाइव ऋण/CIBIL/KYC/भुगतान सेवा नहीं।",
  error:"यह काल्पनिक परिणाम नहीं दिखाया जा सकता। पेज फिर खोलें। कोई उत्तर अपलोड नहीं हुआ।"
 }
};
function text(id,value){
  const node=$(id);if(node)node.textContent=String(value);
}
function make(tag,className,value){
  const n=document.createElement(tag);
  if(className)n.className=className;
  if(value!==undefined)n.textContent=String(value);
  return n;
}
function safeRender(fn){
  try{fn();$("rp-error").hidden=true;}
  catch{
    $("rp-error").hidden=false;
    $("rp-error").textContent=(labels[session.snapshot().locale]||labels.en).error;
    $("rp-question-view").hidden=true;$("rp-passport-view").hidden=true;
  }
}
function render(){
 const s=session.snapshot(),c=labels[s.locale],q=s.questionnaire,result=s.result;
 document.documentElement.lang=s.locale;
 $("rp-language").value=s.locale;
 const h=$("rp-title");
 h.replaceChildren(document.createTextNode(c.titleLead+" "),make("em","",c.titleAccent));
 for(const [id,value] of Object.entries({
  "rp-lang-label":c.lang,"rp-eyebrow":c.eyebrow,"rp-hero-subtitle":c.subtitle,
  "rp-safety-label":c.safety,"rp-privacy-text":c.privacy,
  "rp-category-kicker":c.categoryKicker,"rp-category-title":c.categoryTitle,
  "rp-category-subtitle":c.categorySub,"rp-short-term":c.shortTerm,
  "rp-step-kicker":c.stepKicker,"rp-side-title":c.sideTitle,
  "rp-side-hint":c.sideHint,"rp-progress-label":c.progress(s.answered,s.total),
  "rp-side-footer":c.sideFoot,"rp-question-counter":c.questionCounter(s.step+1,s.total),
  "rp-draft-badge":c.draft,"rp-choices-heading":c.choicesHeading,
  "rp-question-note":c.questionNote,"rp-back":c.back,"rp-next":c.next,
  "rp-review":c.review,"rp-passport-label":c.passportLabel,
  "rp-passport-heading":c.passportHeading,"rp-passport-subtitle":c.passportSubtitle,
  "rp-result-status":result.workflow_status==="needs_more_information"?c.statusIncomplete:c.statusReviewed,
  "rp-result-description":result.workflow_status==="needs_more_information"?c.statusDescriptionIncomplete:c.statusDescriptionReviewed,
  "rp-stat-answered":c.statAnswered,"rp-stat-missing":c.statMissing,
  "rp-stat-unsure":c.statUnsure,"rp-stat-count":s.answered+" / "+s.total,
  "rp-stat-missing-count":result.unanswered_question_ids.length,
  "rp-stat-unsure-count":result.unsure_question_ids.length,
  "rp-actions-heading":c.actions,"rp-actions-subheading":c.actionsSub,
  "rp-explanations-heading":c.explanations,"rp-edit":c.edit,
  "rp-reset":c.restart,"rp-release-kicker":c.releaseKicker,
  "rp-release-title":c.releaseTitle,"rp-release-text":c.releaseText,
  "rp-explore-more":c.explore,"rp-footer-note":c.footer,"rp-disclaimer":result.disclaimer,
  "rp-question-heading":s.current.prompt,"rp-question-explanation":s.current.explanation
 }))text(id,value);
 for(const category of ["personal","business","education"]){
   text("rp-cat-"+category,c.categories[category]);text("rp-cat-"+category+"-desc",c.categoryDescs[category]);
   const btn=document.querySelector('[data-category="'+category+'"]');
   btn?.setAttribute("aria-pressed",String(s.category===category));
   btn?.classList.toggle("is-active",s.category===category);
 }
 const meter=$("rp-meter");
 meter.setAttribute("aria-valuenow",String(s.answered));
 meter.setAttribute("aria-valuetext",c.progress(s.answered,s.total));
 $("rp-meter-fill").style.width=s.percent+"%";
 const list=$("rp-step-list");list.replaceChildren();
 q.questions.forEach((item,index)=>{
   const li=make("li");
   const btn=make("button","rp-step-btn",undefined);
   btn.type="button";
   btn.classList.toggle("is-current",s.step===index&&s.screen==="questions");
   btn.classList.toggle("is-answered",Object.hasOwn(s.answers,item.id));
   if(s.step===index&&s.screen==="questions")btn.setAttribute("aria-current","step");
   btn.setAttribute("aria-label",c.topic(index+1)+": "+item.prompt);
   btn.append(make("span","rp-step-number",Object.hasOwn(s.answers,item.id)?"✓":index+1),
     make("span","rp-step-label",c.topic(index+1)));
   btn.addEventListener("click",()=>{session.goTo(index);safeRender(render);$("rp-question-heading").focus({preventScroll:true});});
   li.append(btn);list.append(li);
 });
 const choices=$("rp-choices");choices.replaceChildren();
 s.current.choices.forEach(choice=>{
   const label=make("label","rp-choice");
   const radio=make("input");
   radio.type="radio";radio.name="readiness-choice";radio.value=choice.value;
   radio.checked=s.answers[s.current.id]===choice.value;
   radio.addEventListener("change",()=>{
     if(radio.checked&&session.choose(choice.value))safeRender(render);
   });
   label.append(radio,make("span","",choice.label));
   choices.append(label);
 });
 $("rp-back").disabled=s.step===0;
 $("rp-next").disabled=s.step>=s.total-1;
 $("rp-question-view").hidden=s.screen!=="questions";
 $("rp-passport-view").hidden=s.screen!=="passport";
 const actions=$("rp-actions-list");actions.replaceChildren();
 if(result.next_steps.length===0){
   const item=make("li","rp-empty",c.none);actions.append(item);
 }else for(const item of result.next_steps){
   const heading=q.questions.find(x=>x.id===item.question_id);
   const li=make("li");
   li.append(make("strong","",heading?.prompt||c.topic(1)),make("span","",": "+item.suggestion));
   actions.append(li);
 }
 const explanations=$("rp-explanations");explanations.replaceChildren();
 if(result.explanations.length===0)explanations.append(make("p","rp-empty",c.noExplanations));
 for(const exp of result.explanations){
   const question=q.questions.find(x=>x.id===exp.question_id);
   const card=make("div","rp-explanation");
   const label=q.choices.find(x=>x.value===exp.input_choice)?.label||"";
   card.append(make("strong","",(question?.prompt||"")+" — "+label),
    make("p","",exp.reason));
   explanations.append(card);
 }
}
function focusCurrent(id){$(id)?.focus({preventScroll:true});}
$("rp-language").addEventListener("change",e=>{
 if(session.setLanguage(e.currentTarget.value))safeRender(render);
});
for(const categoryButton of document.querySelectorAll("[data-category]")){
 categoryButton.addEventListener("click",()=>{
  if(session.setCategory(categoryButton.dataset.category)){safeRender(render);focusCurrent("rp-question-heading");}
 });
}
$("rp-back").addEventListener("click",()=>{session.previous();safeRender(render);focusCurrent("rp-question-heading");});
$("rp-next").addEventListener("click",()=>{session.next();safeRender(render);focusCurrent("rp-question-heading");});
$("rp-review").addEventListener("click",()=>{session.passport();safeRender(render);focusCurrent("rp-passport-heading");});
$("rp-edit").addEventListener("click",()=>{session.edit();safeRender(render);focusCurrent("rp-question-heading");});
$("rp-reset").addEventListener("click",()=>{session.reset();safeRender(render);focusCurrent("rp-question-heading");});
safeRender(render);
