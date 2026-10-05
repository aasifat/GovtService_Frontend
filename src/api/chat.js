// This is the one function ChatBot.jsx calls to get an answer. Right now it
// runs the local demo engine (utils/chatEngine.js), which just matches
// keywords against this site's own guide content -- no real backend, no RAG.
//
// When your Go + RAG backend is ready, replace the body of this function
// with a real request, e.g.:
//
//   const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
//
//   export async function askAssistant(question, context, memo) {
//     const res = await fetch(`${BASE_URL}/api/chat`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         question,
//         service: context.sid,   // service the person is currently viewing, or null
//         guide: context.gid,     // guide within that service, or null
//         memo,                   // whatever your backend returned last turn
//       }),
//     });
//     if (!res.ok) throw new Error(`chat request failed: ${res.status}`);
//     return res.json();
//   }
//
// Whatever you return must match the shape utils/chatEngine.js's `answer()`
// produces, since that's what BotMessage.jsx renders:
//   {
//     lang,                 // "bn" | "en" -- which language the reply is in
//     text,                 // main reply text
//     list?,                // optional bullet/numbered list of strings
//     ordered?,             // true -> numbered list, false/omitted -> bullets
//     table?,               // optional { head: [[bn,en],...], rows: [[[bn,en],...],...] }
//     after?,               // optional short follow-up line under the main text
//     sources?,             // optional [{ label, route }] shown as link chips
//     suggestions?,         // optional string[] shown as follow-up chips
//     services?,            // true -> also show the 7-service chip picker
//     memo,                 // your own state, handed back on the next call
//   }
// Keeping that contract means ChatBot.jsx and BotMessage.jsx need no changes
// when you swap this out -- only this file does.
import { answer } from "../utils/chatEngine.js";

export async function askAssistant(question, context, memo) {
  const delay = 650 + Math.min(question.length * 12, 700);
  return new Promise((resolve) => {
    setTimeout(() => resolve(answer(question, context, memo)), delay);
  });
}
