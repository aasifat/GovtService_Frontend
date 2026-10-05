// Small helpers used everywhere for the bilingual (Bangla/English) UI.

export const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

// Renders a number in Bangla digits when lang === "bn", else as-is.
export function bnNum(value, lang) {
  return lang === "bn" ? String(value).replace(/[0-9]/g, (d) => BN_DIGITS[+d]) : String(value);
}

// Content in this app is stored as [bangla, english] pairs. `pick` reads the
// right one for the current language. Non-array values pass through, so it's
// safe to call on plain strings too.
export function pick(pair, lang) {
  return Array.isArray(pair) ? (lang === "bn" ? pair[0] : pair[1]) : pair;
}

// "2026-10-02" (or a full ISO timestamp) -> "২ অক্টোবর, ২০২৬" / "2 October 2026".
// Plain YYYY-MM-DD strings are read as local calendar dates, so the day never
// shifts with the viewer's timezone. `bn-BD` renders Bangla digits natively.
export function formatDate(iso, lang) {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

// "2 hours ago" / "২ ঘণ্টা আগে". Uses Intl, so Bangla digits come for free.
// `now` is a parameter so the function stays pure and testable.
export function relativeTime(iso, lang, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.round((t - now) / 1000); // negative = in the past
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(lang === "bn" ? "bn-BD" : "en", { numeric: "auto" });
  if (abs < 45) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), "month");
  return rtf.format(Math.round(diff / (86400 * 365)), "year");
}
