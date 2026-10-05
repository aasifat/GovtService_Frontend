// PDF upload checks, pure so they can be tested without a browser. The mock API
// runs them and so does the form (for instant feedback); a real server must run
// its own (docs/API_CONTRACT.md) because a client check is not a boundary.
import { bnNum } from "./lang.js";

export const DEFAULT_MAX_PDF_MB = 5;
export const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
export const mbToBytes = (mb) => Math.round(mb * 1024 * 1024);

// A Windows path or "../" prefix -> just the base name. Strips path parts, control and
// bidi-override characters, leading dots; caps the length but keeps the extension.
export function sanitizeFileName(name, max = 80) {
  let n = String(name ?? "");
  n = n.split(/[\\/]/).pop();
  n = n.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "");
  n = n.replace(/[<>:"|?*]/g, "").replace(/\s+/g, " ").trim().replace(/^\.+/, "").trim();
  if (!n) return "document.pdf";
  if (n.length > max) {
    const m = /(\.[A-Za-z0-9]{1,8})$/.exec(n);
    const ext = m ? m[1] : "";
    n = n.slice(0, max - ext.length) + ext;
  }
  return n;
}

// Returns null when the file is acceptable, else { code }:
//   EMPTY | TOO_LARGE | NOT_PDF. `head` is the file's first bytes.
// The extension and the browser-reported MIME type are deliberately ignored.
export function checkPdf({ size, head }, maxBytes = mbToBytes(DEFAULT_MAX_PDF_MB)) {
  if (!size) return { code: "EMPTY" };
  if (size > maxBytes) return { code: "TOO_LARGE" };
  const h = head || [];
  if (h.length < PDF_MAGIC.length || !PDF_MAGIC.every((b, i) => h[i] === b)) return { code: "NOT_PDF" };
  return null;
}

// Same check on a File/Blob (reads only its first 5 bytes).
export async function checkPdfFile(file, maxBytes) {
  if (!file || typeof file.size !== "number") return { code: "NOT_PDF" };
  const head = new Uint8Array(await file.slice(0, PDF_MAGIC.length).arrayBuffer());
  return checkPdf({ size: file.size, head }, maxBytes);
}

// UI string key for a checkPdf failure.
export const PDF_ERROR_KEY = { EMPTY: "errPdfNotPdf", NOT_PDF: "errPdfNotPdf", TOO_LARGE: "errPdfTooLarge" };

// 1536 -> "1.5 KB" / "১.৫ কেবি".
export function formatBytes(n, lang) {
  const v = Number(n) || 0;
  const units = lang === "bn" ? ["বাইট", "কেবি", "এমবি"] : ["B", "KB", "MB"];
  if (v < 1024) return `${bnNum(v, lang)} ${units[0]}`;
  const [val, unit] = v < 1024 * 1024 ? [v / 1024, units[1]] : [v / 1024 / 1024, units[2]];
  return `${bnNum(val.toFixed(1).replace(/\.0$/, ""), lang)} ${unit}`;
}
