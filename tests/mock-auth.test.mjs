import test from "node:test";
import assert from "node:assert/strict";
import { createMockDb, mapStorage } from "../src/api/mock/mockDb.js";
import { createMockAuth, DEMO_ACCOUNT } from "../src/api/mock/mockAuth.js";

function setup() {
  const storage = mapStorage();
  const db = createMockDb({ storage, latencyMs: 0 });
  return { storage, db, auth: createMockAuth(db) };
}
const reg = { name: "Rina Akter", email: "Rina@Example.com", password: "Secret123", lang: "en" };

test("register creates a session and returns a public user", async () => {
  const { auth } = setup();
  const u = await auth.register(reg);
  assert.equal(u.email, "rina@example.com");
  assert.equal(u.lang, "en");
  assert.equal("passwordHash" in u, false);
  assert.deepEqual(await auth.getSession(), u);
});

test("passwords are never stored in plain text", async () => {
  const { auth, storage } = setup();
  await auth.register(reg);
  assert.equal(JSON.stringify([...storage.map.values()]).includes("Secret123"), false);
});

test("duplicate email (any case) is rejected", async () => {
  const { auth } = setup();
  await auth.register(reg);
  await assert.rejects(auth.register({ ...reg, email: "rina@example.COM" }), { code: "EMAIL_TAKEN" });
});

test("register validates input", async () => {
  const { auth } = setup();
  await assert.rejects(auth.register({ ...reg, password: "short" }), { code: "VALIDATION" });
  await assert.rejects(auth.register({ ...reg, name: " " }), { code: "VALIDATION" });
});

test("login: right password works, wrong password and unknown email fail alike", async () => {
  const { auth } = setup();
  await auth.register(reg);
  await auth.logout();
  assert.equal(await auth.getSession(), null);
  await assert.rejects(auth.login({ email: reg.email, password: "nope" }), { code: "INVALID_CREDENTIALS" });
  await assert.rejects(auth.login({ email: "ghost@example.com", password: "Secret123" }), { code: "INVALID_CREDENTIALS" });
  assert.equal(await auth.getSession(), null);
  const u = await auth.login({ email: " RINA@example.com", password: reg.password });
  assert.equal(u.name, "Rina Akter");
});

test("session is restored by a fresh auth instance over the same storage", async () => {
  const { auth, storage } = setup();
  const u = await auth.register(reg);
  const again = createMockAuth(createMockDb({ storage }));
  assert.deepEqual(await again.getSession(), u);
});

test("a session pointing at a missing user is cleared", async () => {
  const { auth, db } = setup();
  db.setValue("session", "u_gone");
  assert.equal(await auth.getSession(), null);
  assert.equal(db.getValue("session", null), null);
});

test("updateProfile changes name and lang, and requires a session", async () => {
  const { auth } = setup();
  await assert.rejects(auth.updateProfile({ name: "X" }), { code: "UNAUTHENTICATED" });
  await auth.register(reg);
  const u = await auth.updateProfile({ name: "  Rina A. ", lang: "bn" });
  assert.equal(u.name, "Rina A.");
  assert.equal(u.lang, "bn");
  await assert.rejects(auth.updateProfile({ name: "  " }), { code: "VALIDATION" });
});

test("deleteAccount wipes the user, the session and only that user's namespaced data", async () => {
  const { auth, db, storage } = setup();
  const a = await auth.register(reg);
  db.user(a.id, "history").put({ id: "c1" });
  db.user(a.id, "reminders").put({ id: "r1" });
  await auth.logout();
  const b = await auth.register({ ...reg, email: "other@example.com" });
  db.user(b.id, "history").put({ id: "c2" });
  await auth.logout();
  await auth.login({ email: reg.email, password: reg.password });

  await auth.deleteAccount();
  assert.equal(await auth.getSession(), null);
  assert.deepEqual(storage.keys().filter((k) => k.startsWith(`amar-sheba:u:${a.id}:`)), []);
  assert.equal(db.user(b.id, "history").all().length, 1);
  await assert.rejects(auth.login({ email: reg.email, password: reg.password }), { code: "INVALID_CREDENTIALS" });
  await assert.rejects(auth.deleteAccount(), { code: "UNAUTHENTICATED" });
});

test("demo account is seeded once and can log in; deleting it does not bring it back", async () => {
  const { auth } = setup();
  await auth.seedDemo();
  await auth.seedDemo();
  const u = await auth.login({ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password });
  assert.equal(u.email, DEMO_ACCOUNT.email);
  await auth.deleteAccount();
  await auth.seedDemo();
  await assert.rejects(auth.login({ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password }), { code: "INVALID_CREDENTIALS" });
});

test("a registered account can be deleted and its data wiped", async () => {
  const { auth, db, storage } = setup();
  const g = await auth.register(reg);
  db.user(g.id, "conversations").put({ id: "c1" });
  await auth.deleteAccount();
  assert.deepEqual(storage.keys().filter((k) => k.includes(g.id)), []);
});
