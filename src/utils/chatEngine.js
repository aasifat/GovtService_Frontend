// DEMO chat engine: answers by matching keywords/aliases against this site's
// own guide content (SERVICES). There is no real language model or retrieval
// here -- it is a stand-in so the frontend has something to demo before the
// Go + RAG backend exists.
//
// When the backend is ready, you generally won't touch this file: instead,
// replace src/api/chat.js's `askAssistant()` with a call to your API, and
// have it return the same shape that `answer()` returns below (text, list,
// table, sources, suggestions, lang, memo). ChatBot.jsx only depends on that
// shape, not on how it was produced.
import { SERVICES, POPULAR, findService, findGuide } from "../data/services.js";
import { UI } from "../i18n/strings.js";
import { pick } from "./lang.js";

export const norm = (s) => " " + String(s).toLowerCase().replace(/[^\u0980-\u09ffa-z0-9]+/g, " ").replace(/\s+/g, " ") + " ";

const BANGLISH = [
  "ki", "koto", "kivabe", "kibhabe", "korbo", "korte", "lagbe", "lage", "ache", "hobe",
  "kobe", "amar", "ami", "kothay", "kno", "keno", "dibo", "debo", "taka", "kagoj",
  "somoy", "din", "er", "vai", "bhai", "apni", "hoy", "jonno",
];
const STOP = new Set([
  "ki", "কি", "কী", "the", "a", "an", "is", "i", "to", "of", "for", "my", "me", "do",
  "how", "what", "can", "in", "on", "and", "আমি", "আমার", "করতে", "হয়", "হবে", "কত",
  "er", "koto", "কীভাবে", "কিভাবে", "লাগে", "লাগবে",
]);
const ASPECTS = {
  fees: ["ফি", " fee", "fees", " fi ", "koto taka", "কত টাকা", "খরচ", "khoroch", "cost", "charge", "price", " taka", " টাকা", " rate"],
  docs: ["কাগজ", "document", "kagoj", "নথি", "ডকুমেন্ট", "papers", "required", "need to bring", "প্রমাণ", "proof"],
  time: ["সময়", "কত দিন", "কতদিন", "koto din", "kotodin", "how long", " time", " days", "somoy", "deadline", "শেষ তারিখ", "last date", "kobe", "কবে", "when"],
  steps: ["কীভাবে", "কিভাবে", "kivabe", "kibhabe", "how to", "how do", "process", "ধাপ", "step", "প্রক্রিয়া", "নিয়ম", "niyom", "procedure"],
};
const GREET = ["hi", "hello", "hey", "salam", "assalamu", "আসসালামু", "সালাম", "হ্যালো", "হাই", "thanks", "thank", "ধন্যবাদ", "dhonnobad"];
const LOST = ["lost", "harano", "haray", "hariye", "harie", "হারানো", "হারিয়ে", "হারিয়েছে", "হারাইছে", "churi", "চুরি", "stolen"];

const FOLLOWUPS = {
  docs: ["কী কী কাগজ লাগবে?", "What documents do I need?"],
  fees: ["ফি কত?", "How much is the fee?"],
  time: ["কত দিন লাগে?", "How long does it take?"],
  steps: ["ধাপগুলো বলুন", "What are the steps?"],
};
const TAB_OF = { docs: "docs", fees: "fees", time: "steps", steps: "steps", faq: "faq", overview: "steps" };
const TAB_LABEL = { steps: UI.tabSteps, docs: UI.tabDocs, fees: UI.tabFees, faq: UI.tabFaq };

function detectLang(text) {
  if (/[\u0980-\u09ff]/.test(text)) return "bn";
  const toks = norm(text).trim().split(" ");
  return toks.some((t) => BANGLISH.includes(t)) ? "bn" : "en";
}

export function aliasHit(n, toks, a) {
  const na = norm(a).trim();
  if (/^[a-z0-9]+$/.test(na) && na.length <= 3) return toks.includes(na);
  return n.includes(" " + na) || n.includes(na + " ") || (na.length > 3 && n.includes(na));
}

function detectService(n, toks) {
  if (LOST.some((w) => aliasHit(n, toks, w))) return findService("gd");
  let best = null;
  let score = 0;
  for (const s of SERVICES) {
    let sc = 0;
    for (const a of s.aliases) if (aliasHit(n, toks, a)) sc += norm(a).trim().length;
    for (const g of s.guides) if (aliasHit(n, toks, g.title[0]) || aliasHit(n, toks, g.title[1])) sc += 20;
    if (sc > score) {
      score = sc;
      best = s;
    }
  }
  return best;
}

function detectGuide(s, n, toks, fallbackGid) {
  if (s.guides.length === 1) return s.guides[0];
  let best = null;
  let score = 0;
  for (const g of s.guides) {
    let sc = 0;
    for (const k of g.keys) if (aliasHit(n, toks, k)) sc += 1;
    if (sc > score) {
      score = sc;
      best = g;
    }
  }
  return best || findGuide(s, fallbackGid) || s.guides[0];
}

function tokensOf(s) {
  return norm(s).trim().split(" ").filter((t) => t.length > 1 && !STOP.has(t));
}

function bestFaq(guides, toks) {
  let best = null;
  let score = 0;
  for (const g of guides) {
    for (const f of g.faqs) {
      const ft = new Set([...tokensOf(f[0][0]), ...tokensOf(f[0][1])]);
      const sc = toks.filter((t) => ft.has(t)).length;
      if (sc > score) {
        score = sc;
        best = { g, f };
      }
    }
  }
  return score >= 2 ? best : null;
}

// context: { sid, gid } -- the service/guide the person is currently viewing
// (or null). memo: whatever this function returned last time, so multi-turn
// follow-ups ("what about fees?") stay on the same guide.
export function answer(question, context, memo) {
  const L = detectLang(question);
  const n = norm(question);
  const toks = n.trim().split(" ");
  const t = (p) => pick(p, L);

  let s = detectService(n, toks);
  const explicit = !!s;
  const ctxKey = (context.sid || "") + "/" + (context.gid || "");
  const pageChanged = context.sid && ctxKey !== memo.ctxKey;
  let hintGid = null;
  if (!s) {
    if (pageChanged || !memo.sid) {
      s = context.sid ? findService(context.sid) : null;
      hintGid = context.gid;
    } else {
      s = findService(memo.sid);
      hintGid = memo.gid;
    }
  }

  const isGreeting = toks.length <= 4 && toks.some((x) => GREET.includes(x));
  if (!explicit && isGreeting) {
    const thanks = /thank|ধন্যবাদ|dhonnobad/.test(n);
    return {
      lang: L,
      memo,
      text: thanks
        ? t(["আপনাকেও ধন্যবাদ! আর কোনো প্রশ্ন থাকলে লিখুন।", "You're welcome! Ask me anything else."])
        : t(["নমস্কার ও সালাম! আমি সাতটি সরকারি সেবা নিয়ে সাহায্য করতে পারি। কোন সেবা নিয়ে জানতে চান?", "Hello! I can help with seven government services. Which one do you need?"]),
      services: !thanks,
    };
  }

  if (!s) {
    return {
      lang: L,
      memo,
      text: t([
        "দুঃখিত, প্রশ্নটি এই সাইটের সাতটি সেবার সাথে মেলাতে পারিনি। নিচের কোনো একটি সেবা বেছে নিন, অথবা সেবার নাম লিখে আবার জিজ্ঞেস করুন।",
        "I couldn't match that to one of the seven services on this site. Pick a service below, or ask again with the service name.",
      ]),
      services: true,
      fallback: true,
    };
  }

  const g = detectGuide(s, n, toks, explicit ? null : hintGid);
  const newMemo = { sid: s.id, gid: g.id, ctxKey };
  const src = (aspect) => [{ label: `${t(g.title)} · ${t(TAB_LABEL[TAB_OF[aspect]])}`, route: `/s/${s.id}/${g.id}/${TAB_OF[aspect]}` }];
  const follow = (except) => Object.keys(FOLLOWUPS).filter((k) => k !== except).slice(0, 3).map((k) => t(FOLLOWUPS[k]));

  const faq = bestFaq(s.guides, tokensOf(question));
  let aspect = null;
  for (const k of ["fees", "docs", "time", "steps"]) {
    if (ASPECTS[k].some((w) => n.includes(w))) {
      aspect = k;
      break;
    }
  }

  if (!explicit && !aspect && !faq) {
    return {
      lang: L,
      memo: { ...memo, ctxKey },
      text: t([
        "দুঃখিত, এই প্রশ্নের উত্তর এই সাইটের গাইডে নেই। আমি সাতটি সরকারি সেবার ধাপ, কাগজপত্র, ফি ও সময় নিয়ে সাহায্য করতে পারি। নিচ থেকে একটি সেবা বেছে নিন।",
        "Sorry, that isn't covered in this site's guides. I can help with steps, documents, fees and time for seven government services. Pick one below.",
      ]),
      services: true,
      fallback: true,
    };
  }
  if (faq && (!aspect || aspect === "time")) {
    return {
      lang: L,
      memo: { sid: s.id, gid: faq.g.id, ctxKey },
      text: t(faq.f[1]),
      sources: [{ label: `${t(faq.g.title)} · ${t(UI.tabFaq)}`, route: `/s/${s.id}/${faq.g.id}/faq` }],
      suggestions: follow(null),
    };
  }
  if (aspect === "fees") {
    return {
      lang: L,
      memo: newMemo,
      text: t([`${g.title[0]}: ফি (নমুনা তথ্য)`, `${g.title[1]}: fees (sample data)`]),
      table: g.fees,
      after: t([`আবেদনের আগে ${g.portal.replace("https://", "")} এ হার মিলিয়ে নিন।`, `Check current rates on ${g.portal.replace("https://", "")} before you apply.`]),
      sources: src("fees"),
      suggestions: follow("fees"),
    };
  }
  if (aspect === "docs") {
    return {
      lang: L,
      memo: newMemo,
      text: t([`${g.title[0]}: সাধারণত যে কাগজপত্র লাগে`, `${g.title[1]}: documents you usually need`]),
      list: g.docs.map(t),
      sources: src("docs"),
      suggestions: follow("docs"),
    };
  }
  if (aspect === "time") {
    return {
      lang: L,
      memo: newMemo,
      text: t([`${g.title[0]}: ${g.time[0]}।`, `${g.title[1]}: ${g.time[1]}.`]),
      after: t(["সময় অফিসের চাপ ও যাচাইয়ের ওপর নির্ভর করে কমবেশি হতে পারে।", "Actual time depends on office workload and verification."]),
      sources: src("time"),
      suggestions: follow("time"),
    };
  }
  if (aspect === "steps") {
    return {
      lang: L,
      memo: newMemo,
      text: t([`${g.title[0]}: ধাপগুলো`, `${g.title[1]}: the steps`]),
      list: g.steps.map((st) => t(st[0])),
      ordered: true,
      after: t(["প্রতিটি ধাপের বিস্তারিত গাইডে দেখুন।", "See each step in detail in the guide."]),
      sources: src("steps"),
      suggestions: follow("steps"),
    };
  }
  return {
    lang: L,
    memo: newMemo,
    text: t(g.intro),
    after: t([`সময়: ${g.time[0]}। ফি: ${g.feeShort[0]}।`, `Time: ${g.time[1]}. Fee: ${g.feeShort[1]}.`]),
    sources: src("overview"),
    suggestions: follow(null),
  };
}

// The chat's opening message, tailored to whichever guide the person had
// open when they started the conversation (or the popular questions, if none).
export function welcome(lang, service) {
  const suggestions = service
    ? [pick(FOLLOWUPS.docs, lang), pick(FOLLOWUPS.fees, lang), pick(FOLLOWUPS.time, lang)]
    : POPULAR.slice(0, 3).map((p) => pick(p, lang));
  return {
    id: "w" + Date.now(),
    from: "bot",
    lang,
    text: pick(
      [
        "আসসালামু আলাইকুম! আমি আমার সেবা সহকারী। এনআইডি, পাসপোর্ট, ড্রাইভিং লাইসেন্স, খাজনা, অনলাইন জিডি, ই-রিটার্ন ও শিক্ষা সনদ নিয়ে বাংলা, ইংরেজি বা বাংলিশে প্রশ্ন করুন।",
        "Hello! I'm the Amar Sheba assistant. Ask me about NID, passports, driving licenses, land tax, online GD, e-Return or education certificates, in Bangla, English or Banglish.",
      ],
      lang
    ),
    suggestions,
  };
}
