/**
 * VOR-006 sandbox-only notices, NOT approved legal texts.
 * Published VORVAN Terms/Privacy must be legally reviewed before real consent.
 */
export type Language="en"|"bn"|"hi";
export type Purpose="terms_acknowledgement"|"privacy_acknowledgement"|"optional_updates";
export type Decision="acknowledged"|"granted"|"withdrawn";
export const NOTICE_VERSION="sandbox-2026-11-09-v1";
export const NOTICES:Record<Purpose,Record<Language,string>>={
 terms_acknowledgement:{
  en:"SANDBOX NOTICE: VORVAN is pre-incorporation. This software demonstration does not open a live account, request a credit score, verify KYC, charge fees, offer credit, or create a lending agreement. This acknowledgement is only a synthetic test.",
  bn:"স্যান্ডবক্স নোটিশ: VORVAN-এর কোম্পানি নিবন্ধন এখনও সম্পন্ন হয়নি। এটি বাস্তব অ্যাকাউন্ট, CIBIL, KYC, পেমেন্ট বা ঋণের আবেদন নয়। এই স্বীকৃতি কেবল পরীক্ষার জন্য।",
  hi:"सैंडबॉक्स सूचना: VORVAN का कंपनी पंजीकरण अभी लंबित है। यह वास्तविक खाता, CIBIL, KYC, भुगतान या ऋण आवेदन नहीं है। यह स्वीकार केवल परीक्षण के लिए है।"
 },
 privacy_acknowledgement:{
  en:"SANDBOX PRIVACY NOTICE: Use synthetic identities only. Do not share passwords, OTPs, identity documents, account numbers or personal credit information. Real customer-data processing is disabled pending legal review.",
  bn:"স্যান্ডবক্স গোপনীয়তা নোটিশ: শুধুমাত্র কৃত্রিম পরিচয় ব্যবহার করুন। পাসওয়ার্ড, OTP, পরিচয়পত্র, অ্যাকাউন্ট নম্বর বা ক্রেডিট তথ্য দেবেন না। বাস্তব তথ্য প্রক্রিয়াকরণ বন্ধ রয়েছে।",
  hi:"सैंडबॉक्स गोपनीयता सूचना: केवल काल्पनिक पहचान का उपयोग करें। पासवर्ड, OTP, पहचान दस्तावेज, खाता नंबर या क्रेडिट जानकारी न दें। वास्तविक ग्राहक डेटा प्रोसेसिंग बंद है।"
 },
 optional_updates:{
  en:"SANDBOX OPTIONAL UPDATES: This is a demonstration of a separate, optional contact-permission preference. Opting in does not send any messages. You can withdraw later; no marketing delivery is active.",
  bn:"স্যান্ডবক্স ঐচ্ছিক আপডেট: এটি আলাদা ও ঐচ্ছিক যোগাযোগ অনুমতির নমুনা। সম্মতি দিলেও বাস্তবে কোনো বার্তা পাঠানো হবে না। পরে প্রত্যাহার করা যাবে।",
  hi:"सैंडबॉक्स वैकल्पिक अपडेट: यह अलग और वैकल्पिक संपर्क-अनुमति का नमूना है। सहमति देने पर भी कोई वास्तविक संदेश नहीं भेजा जाएगा। बाद में अनुमति वापस ले सकते हैं।"
 }
};
export const PURPOSES=Object.keys(NOTICES) as Purpose[];
export const LANGUAGES:Language[]=["en","bn","hi"];
export function isDecisionAllowed(p:Purpose,d:Decision):boolean{
 return p==="optional_updates"?(d==="granted"||d==="withdrawn"):d==="acknowledged";
}
export async function noticeFor(p:Purpose,lang:Language){
 const text=NOTICES[p][lang];
 const data=new TextEncoder().encode(text);
 const hash=await crypto.subtle.digest("SHA-256",data);
 const digest=Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,"0")).join("");
 return {purpose:p,locale:lang,version:NOTICE_VERSION,text,digest,legal_status:"unapproved_sandbox"};
}
