// Extra files an admin can attach to an announcement besides the PDF: Excel
// workbooks and images. Pure, so it is tested without a browser. Like the PDF
// check, the file's first bytes must match its extension; the browser-reported
// MIME type is ignored. A real server must repeat this (docs/API_CONTRACT.md).
//
// Not accepted on purpose: .svg (can carry scripts), .xlsm/.xlsb (macros), .csv.
import { sanitizeFileName } from "./pdfValidate.js";

export const MAX_ATTACHMENTS = 5;

const starts = (h, bytes, at = 0) => h.length >= at + bytes.length && bytes.every((b, i) => h[at + i] === b);
const ascii = (s) => [...s].map((c) => c.charCodeAt(0));

// extension -> { kind, mime, test(head) }. `head` needs the first 12 bytes.
export const ATTACHMENT_TYPES = {
  png: { kind: "image", mime: "image/png", test: (h) => starts(h, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  jpg: { kind: "image", mime: "image/jpeg", test: (h) => starts(h, [0xff, 0xd8, 0xff]) },
  jpeg: { kind: "image", mime: "image/jpeg", test: (h) => starts(h, [0xff, 0xd8, 0xff]) },
  gif: { kind: "image", mime: "image/gif", test: (h) => starts(h, ascii("GIF87a")) || starts(h, ascii("GIF89a")) },
  webp: { kind: "image", mime: "image/webp", test: (h) => starts(h, ascii("RIFF")) && starts(h, ascii("WEBP"), 8) },
  xlsx: { kind: "excel", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", test: (h) => starts(h, [0x50, 0x4b, 0x03, 0x04]) },
  xls: { kind: "excel", mime: "application/vnd.ms-excel", test: (h) => starts(h, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) },
};

export const ATTACHMENT_ACCEPT = Object.keys(ATTACHMENT_TYPES).map((e) => "." + e).join(",");
export const HEAD_BYTES = 12;

const extOf = (name) => {
  const base = sanitizeFileName(name);
  const i = base.lastIndexOf(".");
  return i < 0 ? "" : base.slice(i + 1).toLowerCase();
};

// -> { error: null | { code: "EMPTY" | "TOO_LARGE" | "NOT_ALLOWED" }, kind, mime }
export function inspectAttachment({ name, size, head }, maxBytes) {
  const t = ATTACHMENT_TYPES[extOf(name)];
  if (!t || !size) return { error: { code: size ? "NOT_ALLOWED" : "EMPTY" }, kind: null, mime: null };
  if (size > maxBytes) return { error: { code: "TOO_LARGE" }, kind: null, mime: null };
  if (!t.test(head || [])) return { error: { code: "NOT_ALLOWED" }, kind: null, mime: null };
  return { error: null, kind: t.kind, mime: t.mime };
}

export async function inspectAttachmentFile(file, maxBytes) {
  if (!file || typeof file.size !== "number") return { error: { code: "NOT_ALLOWED" }, kind: null, mime: null };
  const head = new Uint8Array(await file.slice(0, HEAD_BYTES).arrayBuffer());
  return inspectAttachment({ name: file.name, size: file.size, head }, maxBytes);
}

// UI string key for an inspectAttachment failure.
export const ATTACH_ERROR_KEY = { EMPTY: "errAttachBad", NOT_ALLOWED: "errAttachBad", TOO_LARGE: "errPdfTooLarge" };
