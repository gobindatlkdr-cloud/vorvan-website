/**
 * VORVAN AI Guidance — zero-cost, deterministic V1 demo.
 * No credit-bureau requests, no live customer scoring, no financial PII, no persistence.
 * Supabase Edge Function: verify_jwt=true; also validates user JWT with Supabase Auth.
 * This is a transparent rules-based guidance prototype, NOT an LLM integration.
 */
type Language = "en" | "bn" | "hi";
type Scenario = "building" | "steady" | "strong";
const siteOrigin = "https://gobindatlkdr-cloud.github.io";
const maxBodyBytes = 1024;
const scenarios = {
  building: { score: 620, utilization: 68, missedPayments: 2, enquiries: 5 },
  steady: { score: 742, utilization: 29, missedPayments: 0, enquiries: 2 },
  strong: { score: 812, utilization: 12, missedPayments: 0, enquiries: 0 },
} as const;

const copy = {
  en: {
    title: "Credit health learning plan", score: "Illustrative score",
    utilization: "Review credit utilization and consider reducing revolving balances before the next billing cycle.",
    payments: "Review payment due dates and arrange reminders; resolve any reporting errors through official lender or bureau channels.",
    enquiries: "Avoid unnecessary new credit enquiries while reviewing eligibility.",
    consistency: "Maintain consistent on-time repayments and monitor your reports for errors.",
    strong: "Continue healthy habits; compare actual lending terms and affordability before applying.",
    disclaimer: "Educational demonstration using fictional data. No credit report has been fetched. Not financial advice, a credit-score guarantee, or a lender offer.",
  },
  bn: {
    title: "ক্রেডিট স্বাস্থ্য শেখার পরিকল্পনা", score: "নমুনা স্কোর",
    utilization: "ক্রেডিট ব্যবহারের হার দেখুন এবং পরবর্তী বিলিং সাইকেলের আগে বকেয়া কমানোর পরিকল্পনা করুন।",
    payments: "পেমেন্টের তারিখ যাচাই করে রিমাইন্ডার রাখুন; রিপোর্টের ভুল হলে অফিসিয়াল ঋণদাতা বা ব্যুরোতে জানান।",
    enquiries: "যোগ্যতা যাচাইয়ের সময় অপ্রয়োজনীয় নতুন ক্রেডিট আবেদন এড়িয়ে চলুন।",
    consistency: "সময়ে পেমেন্টের অভ্যাস বজায় রাখুন এবং রিপোর্টে ভুল আছে কি না দেখুন।",
    strong: "ভালো অভ্যাস চালিয়ে যান; আবেদন করার আগে বাস্তব ঋণের শর্ত ও সামর্থ্য যাচাই করুন।",
    disclaimer: "এটি কাল্পনিক তথ্যের শিক্ষামূলক ডেমো। কোনো ক্রেডিট রিপোর্ট আনা হয়নি। এটি আর্থিক পরামর্শ, স্কোরের নিশ্চয়তা বা ঋণের অফার নয়।",
  },
  hi: {
    title: "क्रेडिट स्वास्थ्य सीखने की योजना", score: "उदाहरण स्कोर",
    utilization: "क्रेडिट उपयोग देखें और अगले बिलिंग चक्र से पहले बकाया घटाने पर विचार करें।",
    payments: "भुगतान की तारीख जाँचें और रिमाइंडर रखें; रिपोर्ट में त्रुटि होने पर आधिकारिक ऋणदाता या ब्यूरो से संपर्क करें।",
    enquiries: "पात्रता की समीक्षा करते समय अनावश्यक नई क्रेडिट पूछताछ से बचें।",
    consistency: "समय पर भुगतान की आदत रखें और रिपोर्ट में त्रुटियाँ जाँचें।",
    strong: "अच्छी आदतें जारी रखें; आवेदन से पहले वास्तविक ऋण शर्तें और सामर्थ्य जाँचें।",
    disclaimer: "यह काल्पनिक डेटा वाला शैक्षिक डेमो है। कोई क्रेडिट रिपोर्ट प्राप्त नहीं की गई। यह वित्तीय सलाह, स्कोर गारंटी या ऋण प्रस्ताव नहीं है।",
  }
};
function respond(status: number, data: Record<string, unknown>, origin: string | null = null): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, max-age=0",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "vary": "Origin"
  });
  if (origin === siteOrigin) headers.set("access-control-allow-origin", siteOrigin);
  return new Response(JSON.stringify(data), { status, headers });
}
async function isRealAuthenticatedUser(req: Request): Promise<boolean> {
  const authorization = req.headers.get("authorization") ?? "";
  if (!/^Bearer [a-zA-Z0-9._~\-]+$/.test(authorization) || authorization.length > 4300) return false;
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl) || !anonKey) return false;
  try {
    const result = await fetch(supabaseUrl + "/auth/v1/user", {
      method: "GET", headers: { authorization, apikey: anonKey },
      signal: AbortSignal.timeout(6500)
    });
    if (!result.ok) return false;
    const data: unknown = await result.json();
    return !!(data && typeof data === "object" && "id" in data && typeof (data as {id: unknown}).id === "string");
  } catch { return false; }
}
async function input(req: Request): Promise<null | { scenario: Scenario; locale: Language; mode: "demo" }> {
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return null;
  if (Number(req.headers.get("content-length") || 0) > maxBodyBytes || !req.body) return null;
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > maxBodyBytes) { await reader.cancel().catch(() => {}); return null; }
      chunks.push(next.value);
    }
  } catch { return null; }
  finally { reader.releaseLock(); }
  const buffer = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
  let body = "";
  try { body = new TextDecoder("utf-8",{fatal:true}).decode(buffer); } catch { return null; }
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return null; }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const data = payload as Record<string, unknown>;
  if (Object.keys(data).sort().join(",") !== "locale,mode,scenario") return null;
  if (data.mode !== "demo" || !["building","steady","strong"].includes(String(data.scenario)) || !["en","bn","hi"].includes(String(data.locale))) return null;
  return data as {scenario: Scenario; locale: Language; mode: "demo"};
}
Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  if (origin && origin !== siteOrigin) return respond(403, { code: "origin_denied" });
  if (!["POST","GET"].includes(req.method)) return respond(405,{code:"method_not_allowed"},origin);
  if (!await isRealAuthenticatedUser(req)) return respond(401,{code:"authentication_required"},origin);
  if (req.method === "GET") return respond(200,{
    service:"vorvan-ai-guidance", version:"1.0.0", engine:"deterministic_rules",
    status:"demo_only", available_locales:["en","hi","bn"],
    live_bureau:false, real_customer_data:false, llm_provider_connected:false,
    partner_lending_enabled:false
  },origin);
  const value = await input(req);
  if (!value) return respond(400,{code:"demo_input_only",message:"Only exact {mode:'demo',scenario:'building|steady|strong',locale:'en|bn|hi'} is accepted; no personal data."},origin);
  const metrics = scenarios[value.scenario]; const t = copy[value.locale]; const tasks: {id:string; text:string; priority:string}[] = [];
  if (metrics.utilization > 30) tasks.push({id:"credit_utilization",text:t.utilization,priority:"high"});
  if (metrics.missedPayments > 0) tasks.push({id:"payment_habits",text:t.payments,priority:"high"});
  if (metrics.enquiries >= 3) tasks.push({id:"enquiry_review",text:t.enquiries,priority:"medium"});
  if (!tasks.length) tasks.push({id:"maintain_habits",text:t.strong,priority:"normal"});
  tasks.push({id:"monthly_review",text:t.consistency,priority:"normal"});
  return respond(200,{
    request_id: crypto.randomUUID(), model:"vorvan_rules_v1", title:t.title,
    mode:"demo", data_source:"server_generated_fictional",
    scenario:value.scenario, score:metrics.score, score_label:t.score,
    recommendations:tasks, disclaimer:t.disclaimer,
    eligibility_prediction:null, live_lender_offers:[], customer_data_stored:false
  },origin);
});
