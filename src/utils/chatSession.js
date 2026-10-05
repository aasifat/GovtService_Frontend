// Pure helpers behind the chat history, kept free of React so they can be
// tested with plain node.

export const TITLE_MAX = 40;

const graphemes = (s) => [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].map((x) => x.segment);

// Title = the first user message, whitespace collapsed, cut to ~40 characters.
// Cut by grapheme, not by code unit, so Bangla conjuncts are never split.
export function deriveTitle(messages, max = TITLE_MAX) {
  const first = (messages || []).find((m) => m.from === "user" && m.text && m.text.trim());
  if (!first) return "";
  const text = first.text.replace(/\s+/g, " ").trim();
  const g = graphemes(text);
  return g.length <= max ? text : g.slice(0, max - 1).join("").trimEnd() + "…";
}

export const newConversationId = () => "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function blankChat(messages = []) {
  return { id: newConversationId(), createdAt: new Date().toISOString(), title: null, messages, memo: {}, pending: null };
}

// A chat is worth saving only once the person has said something; a lone
// welcome message is not a conversation.
export const hasUserMessage = (messages) => (messages || []).some((m) => m.from === "user");

// The Conversation shape stored by the API (see PHASE2.md data models).
export function toConversation(chat) {
  return {
    id: chat.id,
    title: chat.title || deriveTitle(chat.messages),
    createdAt: chat.createdAt,
    memo: chat.memo || {},
    messages: chat.messages,
  };
}

// Insert or replace by id, newest `updatedAt` first.
export function upsertSorted(list, conv) {
  const next = list.filter((c) => c.id !== conv.id);
  next.push(conv);
  return next.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

// The one place a chat can reach storage. Guests (user == null) never do: the
// save function is not even called.
export function persistIfAuthed({ user, chat, save }) {
  if (!user || !hasUserMessage(chat.messages)) return null;
  return save(toConversation(chat));
}
