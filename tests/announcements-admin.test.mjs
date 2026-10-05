import test from "node:test";
import assert from "node:assert/strict";
import { createMockDb, mapStorage } from "../src/api/mock/mockDb.js";
import { createMockAuth, ADMIN_ACCOUNT, DEMO_ACCOUNT } from "../src/api/mock/mockAuth.js";
import { createMockAnnouncements } from "../src/api/mock/mockAnnouncements.js";
import { createMemoryFileStore } from "../src/api/mock/fileStore.js";

const PDF_BYTES = new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n");
const pdfFile = (name = "notice.pdf", bytes = PDF_BYTES) => new File([bytes], name, { type: "application/pdf" });
const input = (over = {}) => ({
  title: ["শিরোনাম", "Title"],
  summary: ["সারসংক্ষেপ", "Summary"],
  issuer: ["প্রকাশক", "Issuer"],
  services: ["nid"],
  type: "notice",
  date: "2026-09-01",
  sourceUrl: "",
  ...over,
});

// A fresh app over the given storage; `files` is shared so a "reload" keeps blobs.
function boot({ storage = mapStorage(), files = createMemoryFileStore() } = {}) {
  const db = createMockDb({ storage, latencyMs: 0 });
  const urls = {
    created: [],
    revoked: [],
    create(b) {
      const u = `blob:test/${this.created.length}`;
      this.created.push(u);
      return u;
    },
    revoke(u) {
      this.revoked.push(u);
    },
  };
  const auth = createMockAuth(db);
  const ann = createMockAnnouncements(db, { files, urls, now: () => new Date("2026-10-02T10:00:00Z") });
  return { storage, files, db, auth, ann, urls };
}
const loginAdmin = (ctx) => ctx.auth.login({ email: ADMIN_ACCOUNT.email, password: ADMIN_ACCOUNT.password });
const loginUser = (ctx) => ctx.auth.login({ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password });
async function asAdmin(ctx) {
  await ctx.auth.seedDemo();
  await ctx.ann.seed();
  await loginAdmin(ctx);
}

// ---- roles and the admin guard ----

test("the seeded admin has role admin; everyone else is a user", async () => {
  const ctx = boot();
  await ctx.auth.seedDemo();
  assert.equal((await loginAdmin(ctx)).role, "admin");
  assert.equal((await loginUser(ctx)).role, "user");
});

test("register() and updateProfile() ignore a role sent by the caller", async () => {
  const ctx = boot();
  const u = await ctx.auth.register({ name: "Eve", email: "eve@example.com", password: "Secret123", lang: "en", role: "admin" });
  assert.equal(u.role, "user");
  const again = await ctx.auth.updateProfile({ name: "Eve 2", role: "admin" });
  assert.equal(again.role, "user");
  assert.equal((await ctx.auth.getSession()).role, "user");
  await assert.rejects(ctx.ann.createAnnouncement(input()), { code: "FORBIDDEN" });
});

test("a user stored before roles existed is a plain user", async () => {
  const ctx = boot();
  ctx.db.global("users").put({ id: "u_old", name: "Old", email: "old@example.com", lang: "bn", createdAt: "x", salt: null, passwordHash: null });
  ctx.db.setValue("session", "u_old");
  assert.equal((await ctx.auth.getSession()).role, "user");
});

test("the admin is seeded once, even in a browser that already had the demo user", async () => {
  const ctx = boot();
  ctx.db.setValue("seeded", true); // as left behind by an older build
  await ctx.auth.seedDemo();
  await ctx.auth.seedDemo();
  assert.equal(ctx.db.global("users").all().filter((u) => u.role === "admin").length, 1);
});

test("every admin function rejects guests and normal users with FORBIDDEN", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const made = await ctx.ann.createAnnouncement(input());
  await ctx.auth.logout();

  const calls = {
    listAll: () => ctx.ann.listAllAnnouncements({}),
    create: () => ctx.ann.createAnnouncement(input()),
    update: () => ctx.ann.updateAnnouncement(made.id, { type: "gazette" }),
    status: () => ctx.ann.setAnnouncementStatus(made.id, "published"),
    delete: () => ctx.ann.deleteAnnouncement(made.id),
    reset: () => ctx.ann.resetDemoAnnouncements(),
  };
  for (const who of ["guest", "user"]) {
    if (who === "user") await loginUser(ctx);
    for (const [name, call] of Object.entries(calls)) {
      await assert.rejects(call(), { code: "FORBIDDEN", status: 403 }, `${who} / ${name}`);
    }
  }
  // Nothing changed.
  await loginAdmin(ctx);
  const after = await ctx.ann.getAnnouncement(made.id);
  assert.equal(after.status, "draft");
  assert.equal(after.type, "notice");
});

// ---- visibility ----

test("drafts never appear in public functions; publish/unpublish toggle visibility", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const draft = await ctx.ann.createAnnouncement(input({ title: ["খসড়া", "Hidden draft"] }), pdfFile());
  assert.equal(draft.status, "draft");
  await ctx.auth.logout();

  const ids = async () => (await ctx.ann.listAnnouncements({ pageSize: 100 })).items.map((a) => a.id);
  assert.equal((await ids()).includes(draft.id), false);
  assert.equal((await ctx.ann.listAnnouncements({ q: "Hidden", pageSize: 100 })).total, 0);
  assert.equal((await ctx.ann.listAnnouncements({ service: "nid", pageSize: 100 })).items.some((a) => a.id === draft.id), false);
  await assert.rejects(ctx.ann.getAnnouncement(draft.id), { code: "NOT_FOUND" });
  await loginUser(ctx);
  await assert.rejects(ctx.ann.getAnnouncement(draft.id), { code: "NOT_FOUND" });

  await loginAdmin(ctx);
  assert.equal((await ctx.ann.getAnnouncement(draft.id)).status, "draft"); // admins may open drafts
  await ctx.ann.setAnnouncementStatus(draft.id, "published");
  await ctx.auth.logout();
  assert.equal((await ids()).includes(draft.id), true);
  const open = await ctx.ann.getAnnouncement(draft.id);
  assert.equal(open.hasPdf, true);
  assert.match(open.pdfUrl, /^blob:/);

  await loginAdmin(ctx);
  await ctx.ann.setAnnouncementStatus(draft.id, "draft");
  await ctx.auth.logout();
  assert.equal((await ids()).includes(draft.id), false);
  await assert.rejects(ctx.ann.getAnnouncement(draft.id), { code: "NOT_FOUND" });
});

test("public results never expose the internal file key", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const a = await ctx.ann.createAnnouncement(input({ status: "published" }), pdfFile());
  await ctx.auth.logout();
  const got = await ctx.ann.getAnnouncement(a.id);
  assert.equal("pdf" in got, false);
  assert.equal(JSON.stringify(got).includes("pdf_"), false);
});

// ---- saved items ----

test("resolveAnnouncements reports unpublished and deleted items as unavailable", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const a = await ctx.ann.createAnnouncement(input({ status: "published" }));
  const b = await ctx.ann.createAnnouncement(input({ status: "published" }));
  await ctx.auth.logout();
  let r = await ctx.ann.resolveAnnouncements([a.id, b.id, "ann-missing"]);
  assert.deepEqual(r.map((x) => x.available), [true, true, false]);
  assert.equal(r[0].announcement.id, a.id);

  await loginAdmin(ctx);
  await ctx.ann.setAnnouncementStatus(a.id, "draft");
  await ctx.ann.deleteAnnouncement(b.id);
  await ctx.auth.logout();
  r = await ctx.ann.resolveAnnouncements([a.id, b.id]);
  assert.deepEqual(r, [
    { id: a.id, available: false, announcement: null },
    { id: b.id, available: false, announcement: null },
  ]);
});

// ---- CRUD, persistence, blobs ----

test("CRUD persists across a simulated reload", async () => {
  const first = boot();
  await asAdmin(first);
  const a = await first.ann.createAnnouncement(input({ status: "published" }), pdfFile("a.pdf"));
  await first.ann.updateAnnouncement(a.id, { title: ["নতুন", "Renamed"], type: "circular" });

  const second = boot({ storage: first.storage, files: first.files }); // new objects, same storage
  await loginAdmin(second);
  const got = await second.ann.getAnnouncement(a.id);
  assert.deepEqual(got.title, ["নতুন", "Renamed"]);
  assert.equal(got.type, "circular");
  assert.equal(got.pdfName, "a.pdf");
  assert.equal(got.updatedBy, (await second.auth.getSession()).id);
  assert.equal(got.createdAt <= got.updatedAt, true);

  await second.ann.deleteAnnouncement(a.id);
  const third = boot({ storage: first.storage, files: first.files });
  await loginAdmin(third);
  await assert.rejects(third.ann.getAnnouncement(a.id), { code: "NOT_FOUND" });
});

test("update validates the merged result and keeps untouched fields", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const a = await ctx.ann.createAnnouncement(input());
  await assert.rejects(ctx.ann.updateAnnouncement(a.id, { sourceUrl: "javascript:alert(1)" }), (e) => e.code === "VALIDATION" && e.details.fields.sourceUrl === "errUrlScheme");
  await assert.rejects(ctx.ann.updateAnnouncement("ann-nope", {}), { code: "NOT_FOUND" });
  const b = await ctx.ann.updateAnnouncement(a.id, { sourceUrl: " https://example.com " });
  assert.equal(b.sourceUrl, "https://example.com/");
  assert.deepEqual(b.summary, a.summary);
});

test("create reports every invalid field and stores nothing", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const before = (await ctx.ann.listAllAnnouncements({ pageSize: 100 })).total;
  await assert.rejects(
    ctx.ann.createAnnouncement({ title: ["", "T"], summary: [], issuer: ["a", "b"], services: [], type: "memo", date: "2026-02-30" }),
    (e) => e.code === "VALIDATION" && ["titleBn", "summaryBn", "summaryEn", "services", "type", "date"].every((k) => k in e.details.fields)
  );
  assert.equal((await ctx.ann.listAllAnnouncements({ pageSize: 100 })).total, before);
});

test("deleting an announcement deletes its blob", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const a = await ctx.ann.createAnnouncement(input(), pdfFile());
  assert.equal(ctx.files.map.size, 1);
  await ctx.ann.deleteAnnouncement(a.id);
  assert.equal(ctx.files.map.size, 0);
});

test("replacing a PDF removes the old blob; removing it removes the last one", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const a = await ctx.ann.createAnnouncement(input(), pdfFile("one.pdf"));
  const [firstKey] = [...ctx.files.map.keys()];
  const b = await ctx.ann.updateAnnouncement(a.id, {}, pdfFile("two.pdf"));
  assert.equal(b.pdfName, "two.pdf");
  assert.equal(ctx.files.map.size, 1);
  assert.equal(ctx.files.map.has(firstKey), false);
  const c = await ctx.ann.updateAnnouncement(a.id, {}, null, { removePdf: true });
  assert.equal(c.hasPdf, false);
  assert.equal(ctx.files.map.size, 0);
});

test("a rejected PDF changes nothing: the old file and the document stay", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const a = await ctx.ann.createAnnouncement(input(), pdfFile("keep.pdf"));
  const bad = new File([new TextEncoder().encode("just text")], "fake.pdf", { type: "application/pdf" });
  await assert.rejects(ctx.ann.updateAnnouncement(a.id, { type: "gazette" }, bad), { code: "UNSUPPORTED_MEDIA", status: 415 });
  const got = await ctx.ann.getAnnouncement(a.id);
  assert.equal(got.pdfName, "keep.pdf");
  assert.equal(got.type, "notice");
  assert.equal(ctx.files.map.size, 1);
});

test("stored PDFs are served as application/pdf and names are sanitized", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const f = new File([PDF_BYTES], "..\\..\\evil/‮notice.pdf", { type: "text/html" });
  const a = await ctx.ann.createAnnouncement(input(), f);
  assert.equal(a.pdfName, "notice.pdf");
  assert.equal([...ctx.files.map.values()][0].type, "application/pdf");
});

test("oversize and non-PDF uploads are rejected with 413 / 415", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const big = new Uint8Array(5 * 1024 * 1024 + 1);
  big.set(PDF_BYTES);
  await assert.rejects(ctx.ann.createAnnouncement(input(), pdfFile("big.pdf", big)), (e) => e.code === "PAYLOAD_TOO_LARGE" && e.status === 413 && e.details.fields.pdf === "errPdfTooLarge");
  await assert.rejects(ctx.ann.createAnnouncement(input(), pdfFile("empty.pdf", new Uint8Array(0))), { code: "UNSUPPORTED_MEDIA" });
  assert.equal(ctx.files.map.size, 0);
});

test("admin list: filters, newest-updated first, and paging", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  // A clock that moves forward on every write, so updatedAt order is known.
  let tick = 0;
  const ann = createMockAnnouncements(ctx.db, { files: ctx.files, now: () => new Date(Date.UTC(2026, 9, 3, 0, 0, tick++)) });
  const d1 = await ann.createAnnouncement(input({ title: ["ক", "Alpha draft"], services: ["gd"] }));
  const d2 = await ann.createAnnouncement(input({ title: ["খ", "Beta draft"] }));
  const all = await ann.listAllAnnouncements({ pageSize: 4 });
  assert.deepEqual(all.items.slice(0, 2).map((a) => a.id), [d2.id, d1.id]); // newest-updated first
  assert.equal(all.hasMore, true);
  assert.equal(all.total, 11);
  assert.equal((await ann.listAllAnnouncements({ status: "draft" })).total, 2);
  const gd = await ann.listAllAnnouncements({ status: "published", service: "gd" });
  assert.equal(gd.items.length > 0 && gd.items.every((a) => a.status === "published" && a.services.includes("gd")), true);
  assert.equal((await ann.listAllAnnouncements({ q: "alpha" })).total, 1);
  const p3 = await ann.listAllAnnouncements({ pageSize: 4, page: 3 });
  assert.equal(p3.items.length, 3);
  assert.equal(p3.hasMore, false);
});

test("object URLs are created on read and revoked on release", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const a = await ctx.ann.createAnnouncement(input(), pdfFile());
  assert.equal(ctx.urls.created.length, 1);
  ctx.ann.release(a);
  assert.deepEqual(ctx.urls.revoked, [a.pdfUrl]);
  ctx.ann.release({ pdfUrl: "/announcements/sample-notice.pdf" }); // static files are left alone
  ctx.ann.release(null);
  assert.equal(ctx.urls.revoked.length, 1);
});

// ---- seeding ----

test("seeding runs once; deleting everything does not bring the seeds back; reset does", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  let list = await ctx.ann.listAllAnnouncements({ pageSize: 100 });
  assert.equal(list.total, 9);
  assert.equal(list.items.every((a) => a.status === "published" && a.sample), true);
  for (const a of list.items) await ctx.ann.deleteAnnouncement(a.id);

  await ctx.ann.seed(); // same session...
  const reloaded = boot({ storage: ctx.storage, files: ctx.files }); // ...and after a reload
  await reloaded.auth.seedDemo();
  await reloaded.ann.seed();
  await loginAdmin(reloaded);
  assert.equal((await reloaded.ann.listAllAnnouncements({})).total, 0);

  await reloaded.ann.createAnnouncement(input(), pdfFile());
  await reloaded.ann.resetDemoAnnouncements();
  list = await reloaded.ann.listAllAnnouncements({ pageSize: 100 });
  assert.equal(list.total, 9);
  assert.equal(reloaded.files.map.size, 0); // uploaded blobs went with the reset
});

test("seed items cover all 7 services and all 5 types", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const { items } = await ctx.ann.listAllAnnouncements({ pageSize: 100 });
  assert.equal(new Set(items.flatMap((a) => a.services)).size, 7);
  assert.equal(new Set(items.map((a) => a.type)).size, 5);
  assert.equal(items.filter((a) => a.pdfUrl).length, 1);
});

// ---- attachments: Excel and images ----

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const XLSX = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4]);
const att = (name, bytes) => new File([bytes], name, { type: "application/octet-stream" });

test("attachments: images and Excel files are stored with their detected type and exposed by id", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const a = await ctx.ann.createAnnouncement(input({ status: "published" }), null, { attachments: [att("chart.PNG", PNG), att("..\data.xlsx", XLSX)] });
  assert.deepEqual(a.attachments.map((x) => [x.name, x.kind, x.mime]), [
    ["chart.PNG", "image", "image/png"],
    ["data.xlsx", "excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ]);
  assert.equal(ctx.files.map.size, 2);
  assert.equal([...ctx.files.map.values()].map((b) => b.type).sort()[0], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(JSON.stringify(a).includes("att_"), false); // no storage keys leaked
  await ctx.auth.logout();
  const pub = await ctx.ann.getAnnouncement(a.id);
  assert.equal(pub.attachments.length, 2);
  assert.match(pub.attachments[0].url, /^blob:/);
  const list = await ctx.ann.listAnnouncements({ pageSize: 100 });
  assert.equal(list.items.find((x) => x.id === a.id).attachments.every((x) => x.url === null), true);
});

test("attachments of a draft are not reachable by the public", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const a = await ctx.ann.createAnnouncement(input(), null, { attachments: [att("a.png", PNG)] });
  await ctx.auth.logout();
  await assert.rejects(ctx.ann.getAnnouncement(a.id), { code: "NOT_FOUND" });
  assert.deepEqual((await ctx.ann.resolveAnnouncements([a.id]))[0], { id: a.id, available: false, announcement: null });
});

test("attachments are checked by content, not name; nothing is stored on failure", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const text = new TextEncoder().encode("not an image");
  await assert.rejects(ctx.ann.createAnnouncement(input(), null, { attachments: [att("fake.png", text)] }), { code: "UNSUPPORTED_MEDIA", status: 415 });
  await assert.rejects(ctx.ann.createAnnouncement(input(), null, { attachments: [att("sheet.xlsx", PNG)] }), { code: "UNSUPPORTED_MEDIA" });
  await assert.rejects(ctx.ann.createAnnouncement(input(), null, { attachments: [att("evil.svg", text)] }), { code: "UNSUPPORTED_MEDIA" });
  await assert.rejects(ctx.ann.createAnnouncement(input(), null, { attachments: [att("macro.xlsm", XLSX)] }), { code: "UNSUPPORTED_MEDIA" });
  const big = new Uint8Array(5 * 1024 * 1024 + 1);
  big.set(PNG);
  await assert.rejects(ctx.ann.createAnnouncement(input(), null, { attachments: [att("big.png", big)] }), { code: "PAYLOAD_TOO_LARGE", status: 413 });
  // one good, one bad: neither is stored
  await assert.rejects(ctx.ann.createAnnouncement(input(), null, { attachments: [att("ok.png", PNG), att("bad.xlsx", text)] }), { code: "UNSUPPORTED_MEDIA" });
  assert.equal(ctx.files.map.size, 0);
});

test("at most 5 attachments; add and remove on update; delete removes every blob", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const six = Array.from({ length: 6 }, (_, i) => att(`i${i}.png`, PNG));
  await assert.rejects(ctx.ann.createAnnouncement(input(), null, { attachments: six }), (e) => e.code === "VALIDATION" && e.details.fields.attachments === "errAttachMax");
  const a = await ctx.ann.createAnnouncement(input(), pdfFile(), { attachments: six.slice(0, 5) });
  assert.equal(ctx.files.map.size, 6);
  await assert.rejects(ctx.ann.updateAnnouncement(a.id, {}, null, { addAttachments: [att("x.png", PNG)] }), { code: "VALIDATION" });
  const b = await ctx.ann.updateAnnouncement(a.id, {}, null, { removeAttachmentIds: [a.attachments[0].id, a.attachments[1].id], addAttachments: [att("new.xlsx", XLSX)] });
  assert.deepEqual(b.attachments.map((x) => x.name), ["i2.png", "i3.png", "i4.png", "new.xlsx"]);
  assert.equal(ctx.files.map.size, 5); // 4 attachments + the PDF
  await ctx.ann.deleteAnnouncement(a.id);
  assert.equal(ctx.files.map.size, 0);
});

test("reset removes attachment blobs; release revokes attachment urls", async () => {
  const ctx = boot();
  await asAdmin(ctx);
  const a = await ctx.ann.createAnnouncement(input(), pdfFile(), { attachments: [att("a.png", PNG)] });
  ctx.ann.release(a);
  assert.equal(ctx.urls.revoked.length, 2);
  await ctx.ann.resetDemoAnnouncements();
  assert.equal(ctx.files.map.size, 0);
});
