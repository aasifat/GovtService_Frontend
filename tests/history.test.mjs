import test from "node:test";
import assert from "node:assert/strict";
import { createMockDb, mapStorage } from "../src/api/mock/mockDb.js";
import { createMockAuth } from "../src/api/mock/mockAuth.js";
import { createMockHistory } from "../src/api/mock/mockHistory.js";
import { deriveTitle, toConversation, upsertSorted, persistIfAuthed, blankChat, hasUserMessage } from "../src/utils/chatSession.js";
import { relativeTime } from "../src/utils/lang.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const conv = (id, text = "hello") => ({ id, title: text, createdAt: "2026-10-01T00:00:00.000Z", memo: { n: 1 }, messages: [{ id: "u1", from: "user", text }] });

async function setup() {
  const storage = mapStorage();
  const db = createMockDb({ storage });
  const auth = createMockAuth(db);
  const history = createMockHistory(db);
  const reg = (email) => auth.register({ name: "A", email, password: "Secret123", lang: "en" });
  return { storage, db, auth, history, reg };
}

test("history needs a session", async () => {
  const { history } = await setup();
  await assert.rejects(history.listConversations(), { code: "UNAUTHENTICATED" });
  await assert.rejects(history.saveConversation(conv("c1")), { code: "UNAUTHENTICATED" });
});

test("save is an upsert: createdAt is kept, updatedAt moves, messages and memo are stored", async () => {
  const { history, reg } = await setup();
  await reg("a@example.com");
  const a = await history.saveConversation(conv("c1", "first"));
  assert.equal(a.createdAt, "2026-10-01T00:00:00.000Z");
  await sleep(5);
  const b = await history.saveConversation({ ...conv("c1", "first"), createdAt: "2030-01-01T00:00:00.000Z", messages: [{ id: "u1", from: "user", text: "first" }, { id: "b1", from: "bot", text: "hi" }] });
  assert.equal(b.createdAt, a.createdAt);
  assert.ok(b.updatedAt > a.updatedAt);
  assert.equal((await history.listConversations()).length, 1);
  const got = await history.getConversation("c1");
  assert.equal(got.messages.length, 2);
  assert.deepEqual(got.memo, { n: 1 });
});

test("list is newest-updated first", async () => {
  const { history, reg } = await setup();
  await reg("a@example.com");
  await history.saveConversation(conv("old"));
  await sleep(5);
  await history.saveConversation(conv("mid"));
  await sleep(5);
  await history.saveConversation(conv("new"));
  assert.deepEqual((await history.listConversations()).map((c) => c.id), ["new", "mid", "old"]);
  await sleep(5);
  await history.saveConversation(conv("old"));
  assert.equal((await history.listConversations())[0].id, "old");
});

test("rename changes the title but not the order; blank titles are rejected", async () => {
  const { history, reg } = await setup();
  await reg("a@example.com");
  await history.saveConversation(conv("a"));
  await sleep(5);
  await history.saveConversation(conv("b"));
  const before = (await history.getConversation("a")).updatedAt;
  const r = await history.renameConversation("a", "  My NID chat ");
  assert.equal(r.title, "My NID chat");
  assert.equal(r.updatedAt, before);
  assert.equal((await history.listConversations())[0].id, "b");
  await assert.rejects(history.renameConversation("a", "  "), { code: "VALIDATION" });
  await assert.rejects(history.renameConversation("zzz", "x"), { code: "NOT_FOUND" });
});

test("delete removes one conversation; unknown ids are NOT_FOUND", async () => {
  const { history, reg } = await setup();
  await reg("a@example.com");
  await history.saveConversation(conv("a"));
  await history.saveConversation(conv("b"));
  await history.deleteConversation("a");
  assert.deepEqual((await history.listConversations()).map((c) => c.id), ["b"]);
  await assert.rejects(history.deleteConversation("a"), { code: "NOT_FOUND" });
  await assert.rejects(history.getConversation("a"), { code: "NOT_FOUND" });
});

test("users only see their own conversations, and deleting an account removes them", async () => {
  const { history, reg, auth, storage } = await setup();
  const a = await reg("a@example.com");
  await history.saveConversation(conv("mine"));
  await auth.logout();
  await reg("b@example.com");
  assert.deepEqual(await history.listConversations(), []);
  await assert.rejects(history.getConversation("mine"), { code: "NOT_FOUND" });
  await auth.logout();
  await auth.login({ email: "a@example.com", password: "Secret123" });
  assert.equal((await history.listConversations()).length, 1);
  await auth.deleteAccount();
  assert.deepEqual(storage.keys().filter((k) => k.startsWith(`amar-sheba:u:${a.id}:`)), []);
});

test("deriveTitle: first user message, whitespace collapsed, ~40 chars", () => {
  const bot = { from: "bot", text: "Welcome!" };
  assert.equal(deriveTitle([bot]), "");
  assert.equal(deriveTitle([bot, { from: "user", text: "  How much   is\na passport? " }]), "How much is a passport?");
  const long = deriveTitle([{ from: "user", text: "x".repeat(100) }]);
  assert.equal([...long].length, 40);
  assert.ok(long.endsWith("…"));
  assert.equal(deriveTitle([{ from: "user", text: "a".repeat(40) }]), "a".repeat(40));
  // Bangla: never cut inside a grapheme (a conjunct like "ক্ষ" stays whole).
  const bn = deriveTitle([{ from: "user", text: "ক্ষ".repeat(50) }]);
  assert.ok(bn.endsWith("…"));
  assert.match(bn.slice(0, -1), /^(ক্ষ)+$/);
});

test("toConversation prefers an explicit title and keeps the stored shape", () => {
  const chat = { ...blankChat([{ id: "u", from: "user", text: "NID fee?" }]), memo: { a: 1 } };
  const c = toConversation(chat);
  assert.deepEqual(Object.keys(c).sort(), ["createdAt", "id", "memo", "messages", "title"]);
  assert.equal(c.title, "NID fee?");
  assert.equal(toConversation({ ...chat, title: "Renamed" }).title, "Renamed");
});

test("upsertSorted replaces by id and sorts newest first", () => {
  const l = upsertSorted([{ id: "a", updatedAt: "2026-01-02" }, { id: "b", updatedAt: "2026-01-01" }], { id: "b", updatedAt: "2026-01-03" });
  assert.deepEqual(l.map((c) => c.id), ["b", "a"]);
  assert.equal(l.length, 2);
});

test("guests never write: persistIfAuthed does not call save and storage stays untouched", async () => {
  const storage = mapStorage();
  const db = createMockDb({ storage });
  const history = createMockHistory(db);
  let calls = 0;
  const save = (c) => (calls++, history.saveConversation(c));
  const chat = blankChat([{ id: "u", from: "user", text: "hello" }]);
  assert.equal(persistIfAuthed({ user: null, chat, save }), null);
  assert.equal(calls, 0);
  assert.deepEqual(storage.keys(), []);
});

test("signed-in users only save once they have said something", async () => {
  const { history, reg } = await setup();
  const user = await reg("a@example.com");
  let calls = 0;
  const save = (c) => (calls++, history.saveConversation(c));
  assert.equal(persistIfAuthed({ user, chat: blankChat([{ id: "w", from: "bot", text: "hi" }]), save }), null);
  assert.equal(hasUserMessage([{ from: "bot" }]), false);
  await persistIfAuthed({ user, chat: blankChat([{ id: "u", from: "user", text: "q" }]), save });
  assert.equal(calls, 1);
  assert.equal((await history.listConversations()).length, 1);
});

test("relativeTime", () => {
  const now = new Date("2026-10-02T12:00:00Z").getTime();
  const ago = (s) => new Date(now - s * 1000).toISOString();
  assert.equal(relativeTime(ago(10), "en", now), "now");
  assert.equal(relativeTime(ago(5 * 60), "en", now), "5 minutes ago");
  assert.equal(relativeTime(ago(2 * 3600), "en", now), "2 hours ago");
  assert.equal(relativeTime(ago(86400), "en", now), "yesterday");
  assert.equal(relativeTime(ago(3 * 86400), "en", now), "3 days ago");
  assert.match(relativeTime(ago(2 * 3600), "bn", now), /২/);
  assert.equal(relativeTime("nope", "en", now), "");
});
