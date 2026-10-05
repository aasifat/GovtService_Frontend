import test from "node:test";
import assert from "node:assert/strict";
import { safeHttpUrl, safeAssetUrl } from "../src/utils/safeUrl.js";
import { checkPdf, checkPdfFile, sanitizeFileName, formatBytes, mbToBytes } from "../src/utils/pdfValidate.js";
import { validateAnnouncementInput } from "../src/utils/announcementInput.js";
import { filterAnnouncements, paginate, isNew, todayString, byDateDesc } from "../src/utils/announcementFilters.js";
import { makeSeedAnnouncements } from "../src/data/announcements.js";
import { isAdmin } from "../src/utils/roles.js";

// ---- URLs ----

test("source links: only http(s) pass", () => {
  assert.equal(safeHttpUrl("https://example.com"), "https://example.com/");
  assert.equal(safeHttpUrl("  http://example.com/a?b=1  "), "http://example.com/a?b=1");
  const bad = ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<b>x</b>", "ftp://example.com/x", "file:///etc/passwd", "vbscript:x", "//example.com", "/relative", "example.com", "", null, undefined, "https://a b.com", "java\nscript:alert(1)"];
  for (const b of bad) assert.equal(safeHttpUrl(b), null, String(b));
});

test("asset urls: blob, same-site path, http(s); nothing else", () => {
  assert.equal(safeAssetUrl("blob:http://x/1"), "blob:http://x/1");
  assert.equal(safeAssetUrl("/announcements/a.pdf"), "/announcements/a.pdf");
  assert.equal(safeAssetUrl("https://cdn.example.com/a.pdf"), "https://cdn.example.com/a.pdf");
  for (const b of ["//evil.test/a.pdf", "/\\evil", "javascript:alert(1)", "data:application/pdf;base64,AAAA", "", null]) assert.equal(safeAssetUrl(b), null, String(b));
});

// ---- PDFs ----

const head = (s) => [...new TextEncoder().encode(s)];

test("PDF check: real %PDF- bytes pass", () => {
  assert.equal(checkPdf({ size: 100, head: head("%PDF-1.7") }), null);
});

test("PDF check: a text file renamed .pdf fails, and the extension is irrelevant", async () => {
  assert.deepEqual(checkPdf({ size: 9, head: head("hello pdf") }), { code: "NOT_PDF" });
  const fake = new File(["<html>not a pdf</html>"], "report.pdf", { type: "application/pdf" }); // even with a PDF mime type
  assert.deepEqual(await checkPdfFile(fake), { code: "NOT_PDF" });
  const real = new File(["%PDF-1.4 ok"], "x.txt", { type: "text/plain" });
  assert.equal(await checkPdfFile(real), null);
});

test("PDF check: empty, oversize, and the exact limit", () => {
  assert.deepEqual(checkPdf({ size: 0, head: [] }), { code: "EMPTY" });
  const max = mbToBytes(5);
  assert.deepEqual(checkPdf({ size: max + 1, head: head("%PDF-") }), { code: "TOO_LARGE" });
  assert.equal(checkPdf({ size: max, head: head("%PDF-") }), null);
  assert.deepEqual(checkPdf({ size: mbToBytes(2) + 1, head: head("%PDF-") }, mbToBytes(2)), { code: "TOO_LARGE" });
  assert.deepEqual(checkPdf({ size: 10, head: head("%PD") }), { code: "NOT_PDF" });
});

test("file names are sanitized", () => {
  assert.equal(sanitizeFileName("notice.pdf"), "notice.pdf");
  assert.equal(sanitizeFileName("C:\\Users\\me\\..\\notice.pdf"), "notice.pdf");
  assert.equal(sanitizeFileName("../../etc/passwd"), "passwd");
  assert.equal(sanitizeFileName("no\u0000tice\u0007.pdf"), "notice.pdf");
  assert.equal(sanitizeFileName("a\u202Eb.pdf"), "ab.pdf");
  assert.equal(sanitizeFileName("  my   notice.pdf "), "my notice.pdf");
  assert.equal(sanitizeFileName("<script>.pdf"), "script.pdf");
  assert.equal(sanitizeFileName("...hidden.pdf"), "hidden.pdf");
  assert.equal(sanitizeFileName(""), "document.pdf");
  assert.equal(sanitizeFileName("../"), "document.pdf");
  assert.equal(sanitizeFileName(undefined), "document.pdf");
  const long = sanitizeFileName("x".repeat(300) + ".pdf");
  assert.equal(long.length, 80);
  assert.equal(long.endsWith(".pdf"), true);
  assert.equal(sanitizeFileName("বিজ্ঞপ্তি.pdf"), "বিজ্ঞপ্তি.pdf");
});

test("formatBytes", () => {
  assert.equal(formatBytes(500, "en"), "500 B");
  assert.equal(formatBytes(1536, "en"), "1.5 KB");
  assert.equal(formatBytes(2 * 1024 * 1024, "en"), "2 MB");
  assert.equal(formatBytes(1536, "bn"), "১.৫ কেবি");
});

// ---- input ----

const good = { title: ["ক", "A"], summary: ["খ", "B"], issuer: ["গ", "C"], services: ["nid", "gd"], type: "gazette", date: "2026-02-28", sourceUrl: "" };

test("input validation accepts good input and trims", () => {
  const r = validateAnnouncementInput({ ...good, title: [" ক ", " A "], sourceUrl: " https://example.com " });
  assert.equal(r.ok, true);
  assert.deepEqual(r.value.title, ["ক", "A"]);
  assert.equal(r.value.sourceUrl, "https://example.com/");
  assert.equal(r.value.status, "draft");
  assert.equal(validateAnnouncementInput({ ...good, status: "published" }).value.status, "published");
  assert.equal(validateAnnouncementInput({ ...good, status: "weird" }).value.status, "draft");
});

test("input validation: every required field, per language", () => {
  const r = validateAnnouncementInput({ title: ["", " "], summary: ["x", ""], issuer: [], services: [], type: "", date: "" });
  assert.deepEqual(Object.keys(r.errors).sort(), ["date", "issuerBn", "issuerEn", "services", "summaryEn", "titleBn", "titleEn", "type"]);
  assert.equal(r.ok, false);
});

test("input validation: dates, services, types, url", () => {
  assert.equal(validateAnnouncementInput({ ...good, date: "2026-02-30" }).errors.date, "errDateInvalid");
  assert.equal(validateAnnouncementInput({ ...good, date: "2024-02-29" }).ok, true);
  assert.equal(validateAnnouncementInput({ ...good, date: "02/03/2026" }).errors.date, "errDateInvalid");
  assert.equal(validateAnnouncementInput({ ...good, services: ["nid", "bogus"] }).errors.services, "errServicesMin");
  assert.equal(validateAnnouncementInput({ ...good, type: "memo" }).errors.type, "errRequired");
  for (const bad of ["javascript:alert(1)", "data:text/plain,hi", "ftp://x.test/f"]) assert.equal(validateAnnouncementInput({ ...good, sourceUrl: bad }).errors.sourceUrl, "errUrlScheme");
  assert.equal(validateAnnouncementInput({ ...good, title: ["x".repeat(201), "A"] }).errors.titleBn, "errTooLong");
});

// ---- list logic ----

const seeds = makeSeedAnnouncements(new Date(2026, 9, 2, 15, 0));

test("filters: service, type, search in Bangla and English", () => {
  const ids = (f) => filterAnnouncements(seeds, f).map((a) => a.id).sort();
  assert.deepEqual(ids({ service: "passport" }), ["ann-sample-2", "ann-sample-8"]);
  assert.deepEqual(ids({ type: "deadline" }), ["ann-sample-4", "ann-sample-6"]);
  assert.deepEqual(ids({ service: "nid", type: "circular" }), ["ann-sample-8"]);
  assert.deepEqual(ids({ q: "e-return" }), ["ann-sample-6"]);
  assert.deepEqual(ids({ q: "ই-রিটার্ন" }), ["ann-sample-6"]);
  assert.deepEqual(ids({ q: "ই-রিটার্ন" }), ids({ q: "E-RETURN" }));
  assert.deepEqual(ids({ q: "sample gazette" }), ["ann-sample-5"]);
  assert.deepEqual(ids({ q: "zzz" }), []);
  assert.equal(ids({ q: "  " }).length, 9);
  assert.equal(filterAnnouncements(seeds, { status: "draft" }).length, 0);
});

test("newest first, and pagination with a remainder", () => {
  const sorted = [...seeds].sort(byDateDesc);
  assert.equal(sorted[0].id, "ann-sample-1");
  assert.equal(sorted.at(-1).id, "ann-sample-9");
  const p1 = paginate(sorted, 1, 4);
  const p3 = paginate(sorted, 3, 4);
  assert.deepEqual([p1.items.length, p1.hasMore, p1.total], [4, true, 9]);
  assert.deepEqual([p3.items.length, p3.hasMore], [1, false]);
  assert.equal(paginate(sorted, 99, 4).items.length, 0);
  assert.equal(paginate(sorted, 0, 0).pageSize, 10);
});

test("NEW badge: today up to 14 days back, local calendar days", () => {
  const now = new Date(2026, 2, 1, 23, 59); // 1 March 2026, late evening
  assert.equal(isNew("2026-03-01", now), true);
  assert.equal(isNew("2026-02-15", now), true); // 14 days (28-day February)
  assert.equal(isNew("2026-02-14", now), false); // 15 days
  assert.equal(isNew("2026-03-02", now), false); // future
  assert.equal(isNew("", now), false);
  assert.equal(isNew("garbage", now), false);
  assert.equal(isNew("2025-12-25", new Date(2026, 0, 3)), true); // across a year boundary
  assert.equal(todayString(new Date(2026, 0, 5)), "2026-01-05");
});

test("isAdmin", () => {
  assert.equal(isAdmin({ role: "admin" }), true);
  assert.equal(isAdmin({ role: "user" }), false);
  assert.equal(isAdmin({}), false);
  assert.equal(isAdmin(null), false);
});

// ---- attachments ----
import { inspectAttachment } from "../src/utils/attachmentValidate.js";

test("attachment types are detected by content and must match the extension", () => {
  const max = 5 * 1024 * 1024;
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const riff = [...new TextEncoder().encode("RIFF"), 1, 2, 3, 4, ...new TextEncoder().encode("WEBP")];
  const gif = [...new TextEncoder().encode("GIF89a")];
  const zip = [0x50, 0x4b, 0x03, 0x04];
  const ole = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
  const ok = (name, head) => inspectAttachment({ name, size: 100, head }, max);
  assert.equal(ok("a.png", png).kind, "image");
  assert.equal(ok("a.JPG", [0xff, 0xd8, 0xff, 0xe0]).mime, "image/jpeg");
  assert.equal(ok("a.webp", riff).kind, "image");
  assert.equal(ok("a.gif", gif).kind, "image");
  assert.equal(ok("a.xlsx", zip).kind, "excel");
  assert.equal(ok("a.xls", ole).mime, "application/vnd.ms-excel");
  for (const [name, head] of [["a.png", zip], ["a.xlsx", png], ["a.xls", zip], ["a.svg", png], ["a.exe", zip], ["a.pdf", [0x25, 0x50, 0x44, 0x46, 0x2d]], ["noext", png]]) {
    assert.equal(ok(name, head).error.code, "NOT_ALLOWED", name);
  }
  assert.equal(inspectAttachment({ name: "a.png", size: 0, head: [] }, max).error.code, "EMPTY");
  assert.equal(inspectAttachment({ name: "a.png", size: max + 1, head: png }, max).error.code, "TOO_LARGE");
});
