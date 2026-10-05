// Validation and normalising for announcement input. One pure module shared by
// the form (inline errors) and the mock API (which mirrors what a server does).
// Errors map a field name to the key of the UI string that explains it.
import { ANNOUNCEMENT_TYPES } from "../data/announcements.js";
import { SERVICES } from "../data/services.js";
import { safeHttpUrl } from "./safeUrl.js";

export const SERVICE_IDS = SERVICES.map((s) => s.id);
export const LIMITS = { title: 200, issuer: 200, summary: 1000 };

const str = (v) => (typeof v === "string" ? v.trim() : "");
const pair = (v) => (Array.isArray(v) ? [str(v[0]), str(v[1])] : ["", ""]);

function validDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return false;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3];
}

// input: { title, summary, issuer: [bn, en], services, type, date, sourceUrl?, status? }
// Returns { ok, errors, value }; `value` is the trimmed, normalised input.
// Error keys are form field names: titleBn, titleEn, summaryBn, ... services,
// type, date, sourceUrl.
export function validateAnnouncementInput(input = {}) {
  const errors = {};
  const out = {};
  for (const key of ["title", "summary", "issuer"]) {
    const p = pair(input[key]);
    out[key] = p;
    ["Bn", "En"].forEach((lg, i) => {
      if (!p[i]) errors[key + lg] = "errRequired";
      else if (p[i].length > LIMITS[key]) errors[key + lg] = "errTooLong";
    });
  }
  const services = [...new Set(Array.isArray(input.services) ? input.services : [])];
  out.services = services;
  if (!services.length || services.some((s) => !SERVICE_IDS.includes(s))) errors.services = "errServicesMin";

  out.type = input.type;
  if (!ANNOUNCEMENT_TYPES.includes(input.type)) errors.type = "errRequired";

  out.date = str(input.date);
  if (!validDate(out.date)) errors.date = "errDateInvalid";

  const rawUrl = str(input.sourceUrl);
  out.sourceUrl = "";
  if (rawUrl) {
    const safe = safeHttpUrl(rawUrl);
    if (safe) out.sourceUrl = safe;
    else errors.sourceUrl = "errUrlScheme";
  }

  out.status = input.status === "published" ? "published" : "draft";
  return { ok: Object.keys(errors).length === 0, errors, value: out };
}
