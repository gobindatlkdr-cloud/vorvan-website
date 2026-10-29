/**
 * VORVAN website guide — live server-backed, zero external model cost.
 * Intent-based FAQ engine only; NOT a generative LLM and NOT personal credit advice.
 * No input persistence, no database or secret access, no customer records.
 */
const ALLOWED = new Set(["https://gobindatlkdr-cloud.github.io","https://vorvan.co.in","https://www.vorvan.co.in"]);
const categories = ["partnership","api","contact","credit","support","legal","security","location","domain","customer","unknown"] as const;
type Topic=typeof categories[number];
type Lang="en"|"bn"|"hi";
const EMAIL={
  partnership:"partnerships@vorvan.co.in",support:"support@vorvan.co.in",
  legal:"legal@vorvan.co.in",info:"info@vorvan.co.in",admin:"admin@vorvan.co.in"
};
const answer:Record<Lang,Record<Topic,string>>={
 en:{
  partnership:"VORVAN welcomes direct, formal LSP partnerships with regulated banks and NBFCs. Contact partnerships@vorvan.co.in to start an institutional discussion. No DSA or lead-sale program is offered.",
  api:"For lender API, sandbox and technical integration discussions, email partnerships@vorvan.co.in using an official business email. Production access is disabled until legal, security and lender approval.",
  contact:"General enquiries: info@vorvan.co.in. Partnerships: partnerships@vorvan.co.in. Support: support@vorvan.co.in. Legal: legal@vorvan.co.in. Administration: admin@vorvan.co.in.",
  credit:"The credit-app experience is currently a fictional product preview only. No live CIBIL/bureau report, customer account, credit score check, payments or application is offered on this website.",
  support:"Please email support@vorvan.co.in about this website. Do not include PAN, Aadhaar, OTP, bank statements or other private financial information.",
  legal:"Read the Privacy and Terms pages. For legal enquiries: legal@vorvan.co.in. Website disclosures are drafts until professional approval.",
  security:"VORVAN's public site does not collect customer financial records. For security concerns write to legal@vorvan.co.in with a non-sensitive description; never share credentials or OTP.",
  location:"VORVAN is based in Cooch Behar, West Bengal, India. No unverified registered office address is advertised here.",
  domain:"The company uses the vorvan.co.in email domain. Website custom-domain connectivity is separate from email hosting.",
  customer:"Customer sign-in, loan applications, report downloads and KYC uploads are disabled. This website is for corporate information and institutional collaboration only.",
  unknown:"I can help with direct LSP/API partnerships, contact emails, credit-app roadmap, privacy and support. Select a topic below or email info@vorvan.co.in."
 },
 bn:{
  partnership:"VORVAN নিয়ন্ত্রিত Bank/NBFC-এর সঙ্গে সরাসরি LSP অংশীদারত্বের আলোচনা করে। অফিসিয়াল ইমেইল থেকে partnerships@vorvan.co.in-এ যোগাযোগ করুন। DSA বা শুধু lead referral নয়।",
  api:"Lender API, sandbox ও integration আলোচনার জন্য partnerships@vorvan.co.in-এ মেইল করুন। চুক্তি, সিকিউরিটি ও অনুমোদন না হওয়া পর্যন্ত production access বন্ধ।",
  contact:"সাধারণ তথ্য: info@vorvan.co.in। পার্টনারশিপ: partnerships@vorvan.co.in। সাপোর্ট: support@vorvan.co.in। লিগ্যাল: legal@vorvan.co.in। অ্যাডমিন: admin@vorvan.co.in।",
  credit:"Credit App আপাতত শুধু কাল্পনিক ডেমো। এখানে বাস্তব CIBIL রিপোর্ট, স্কোর চেক, গ্রাহক অ্যাকাউন্ট, পেমেন্ট বা ঋণের আবেদন চালু নেই।",
  support:"ওয়েবসাইট সাপোর্টের জন্য support@vorvan.co.in-এ মেইল করুন। PAN, Aadhaar, OTP বা ব্যক্তিগত আর্থিক নথি পাঠাবেন না।",
  legal:"Privacy ও Terms পেজ পড়ুন। আইনি বিষয়ে legal@vorvan.co.in-এ মেইল করুন। নীতিগুলো এখনও চূড়ান্ত আইনি অনুমোদনসাপেক্ষ।",
  security:"পাবলিক ওয়েবসাইটে গ্রাহকের আর্থিক নথি নেওয়া হয় না। সিকিউরিটি সমস্যা হলে সংবেদনশীল তথ্য বাদ দিয়ে legal@vorvan.co.in-এ জানান।",
  location:"VORVAN-এর ভিত্তি পশ্চিমবঙ্গের কোচবিহার, ভারত। যাচাই না করা রেজিস্টার্ড অফিসের ঠিকানা প্রকাশ করা হচ্ছে না।",
  domain:"VORVAN-এর কর্পোরেট ইমেইল ডোমেন vorvan.co.in। ইমেইল হোস্টিং এবং ওয়েবসাইট ডোমেন সংযোগ আলাদা।",
  customer:"Customer Login, Loan Apply, KYC upload ও Credit Report download বন্ধ। সাইটটি বর্তমানে কর্পোরেট পরিচিতি এবং Bank/NBFC আলোচনা-ভিত্তিক।",
  unknown:"Direct LSP/API, ইমেইল যোগাযোগ, Credit App, Privacy ও Support নিয়ে জানতে পারেন। নিচের বিষয় নির্বাচন করুন অথবা info@vorvan.co.in-এ মেইল করুন।"
 },
 hi:{
  partnership:"VORVAN विनियमित बैंक/NBFC के साथ सीधे औपचारिक LSP साझेदारी पर चर्चा करता है। partnerships@vorvan.co.in पर आधिकारिक व्यावसायिक ईमेल से संपर्क करें। DSA/lead-referral नहीं।",
  api:"Lender API, sandbox और तकनीकी integration के लिए partnerships@vorvan.co.in पर लिखें। अनुबंध, सुरक्षा समीक्षा और स्वीकृति से पहले production access बंद है।",
  contact:"जानकारी: info@vorvan.co.in। पार्टनरशिप: partnerships@vorvan.co.in। सहायता: support@vorvan.co.in। कानूनी: legal@vorvan.co.in। एडमिन: admin@vorvan.co.in।",
  credit:"Credit App फिलहाल केवल काल्पनिक डेमो है। लाइव CIBIL रिपोर्ट, ग्राहक खाता, भुगतान या लोन आवेदन इस वेबसाइट पर उपलब्ध नहीं हैं।",
  support:"वेबसाइट संबंधी सहायता के लिए support@vorvan.co.in पर लिखें। PAN, Aadhaar, OTP या निजी वित्तीय दस्तावेज़ न भेजें।",
  legal:"Privacy और Terms पेज पढ़ें। कानूनी विषयों के लिए legal@vorvan.co.in लिखें। नीतियां अंतिम पेशेवर समीक्षा के अधीन हैं।",
  security:"सार्वजनिक वेबसाइट ग्राहक वित्तीय दस्तावेज़ नहीं मांगती। सुरक्षा चिंता को संवेदनशील डेटा के बिना legal@vorvan.co.in पर भेजें।",
  location:"VORVAN पश्चिम बंगाल के कूचबिहार, भारत से संचालित होने की योजना रखता है। अप्रमाणित पंजीकृत पता प्रकाशित नहीं है।",
  domain:"कॉर्पोरेट ईमेल डोमेन vorvan.co.in है। वेबसाइट होस्टिंग और ईमेल होस्टिंग अलग हैं।",
  customer:"Customer Login, Loan Apply, KYC upload और credit-report download बंद हैं। यह साइट केवल कॉर्पोरेट व संस्थागत जानकारी देती है।",
  unknown:"Direct LSP/API, संपर्क ईमेल, Credit App, Privacy और Support पर जानकारी के लिए नीचे विषय चुनें या info@vorvan.co.in लिखें।"
 }};
const hints:Record<Topic,string[]> ={
 partnership:["partnership","lsp","nbfc","bank","collaborat","lender","পার্টনার","ব্যাংক","অংশীদার","बैंक","भागीदारी"],
 api:["api","sandbox","integrat","technical","endpoint","স্যান্ডবক্স","ইন্টিগ্র","एपीआई","सैंडबॉक्स"],
 contact:["email","contact","mail","reach","যোগাযোগ","মেইল","ईमेल","संपर्क"],
 credit:["credit","cibil","score","report","ai","স্কোর","ক্রেডিট","সিবিল","स्कोर","रिपोर्ट"],
 support:["support","help","complain","complaint","সাপোর্ট","সাহায্য","অভিযোগ","शिकायत","सहायता"],
 legal:["legal","terms","privacy","policy","আইনি","প্রাইভেসি","টার্মস","कानूनी","गोपनीयता"],
 security:["secure","security","hack","fraud","নিরাপত্তা","সিকিউরিটি","सुरक्षा"],
 location:["location","where","address","cooch","bihar","west bengal","অবস্থান","কোচবিহার","ঠিকানা","पता"],
 domain:["domain","website","vorvan.co.in","ডোমেন","डोमेन"],
 customer:["login","register","sign in","apply","kyc","customer","লগইন","আবেদন","গ্রাহক","लॉगिन","आवेदन"],
 unknown:[]
};
const topics:Topic[]=["partnership","api","credit","support","legal","contact"];
function topicOf(message:string):Topic{const normalized=message.toLowerCase();for(const candidate of [...topics,"customer","security","location","domain"] as Topic[])if(hints[candidate].some(h=>normalized.includes(h)))return candidate;return "unknown"}
function respond(req:Request,status:number,value:Record<string,unknown>):Response {
  const headers=new Headers({"content-type":"application/json; charset=utf-8","cache-control":"no-store,max-age=0","x-content-type-options":"nosniff","vary":"origin"});
  const origin=req.headers.get("origin");if(origin&&ALLOWED.has(origin))headers.set("access-control-allow-origin",origin);
  return new Response(JSON.stringify(value),{status,headers});
}
async function bounded(req:Request):Promise<null|Record<string,unknown>>{
  if(req.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json"||!req.body)return null;
  const reader=req.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  try{for(;;){const x=await reader.read();if(x.done)break;size+=x.value.byteLength;if(size>800){await reader.cancel().catch(()=>{});return null}chunks.push(x.value)}}catch{return null}finally{reader.releaseLock()}
  const buf=new Uint8Array(size);let i=0;for(const b of chunks){buf.set(b,i);i+=b.length}
  try{const v:unknown=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(buf));return v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:null}catch{return null}
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");if(origin&&!ALLOWED.has(origin))return respond(req,403,{error:"origin_denied"});
 if(req.method==="OPTIONS"){const h=new Headers({"cache-control":"no-store","vary":"origin"});if(origin&&ALLOWED.has(origin)){h.set("access-control-allow-origin",origin);h.set("access-control-allow-headers","content-type");h.set("access-control-allow-methods","POST,OPTIONS")}return new Response(null,{status:204,headers:h})}
 if(req.method!=="POST")return respond(req,405,{error:"method_not_allowed"});
 const value=await bounded(req);
 if(!value||Object.keys(value).some(k=>!["topic","message","language"].includes(k)))return respond(req,400,{error:"invalid_input"});
 const lang=value.language;
 if(lang!=="en"&&lang!=="bn"&&lang!=="hi")return respond(req,400,{error:"invalid_language"});
 if(value.message!==undefined&&(typeof value.message!=="string"||value.message.length>240))return respond(req,400,{error:"invalid_message"});
 if(value.topic!==undefined&&(typeof value.topic!=="string"||!topics.includes(value.topic as Topic)))return respond(req,400,{error:"invalid_topic"});
 if(!value.topic&&!value.message)return respond(req,400,{error:"input_required"});
 // Avoid collecting or processing sensitive identifiers even transiently.
 const message=value.message||"";
 if(/(?:\d[ -]?){8,}|[^\s@]+@[^\s@]+\.[^\s@]+/.test(message))return respond(req,400,{error:"please_remove_personal_information"});
 const topic=(value.topic||topicOf(message)) as Topic;
 return respond(req,200,{
  reply:answer[lang][topic],topic,engine:"guided_knowledge_base_v1",
  ai_model:false,personal_data_saved:false,links:topics,official_emails:EMAIL,
  note:"Informational guidance only; no live bureau, KYC, lending decision or LLM."
 });
});