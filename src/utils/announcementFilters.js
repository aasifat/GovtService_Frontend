// Pure list logic for announcements: filter, sort, paginate, "NEW" badge.
// Used by the mock API and by tests; no storage, no DOM.

const norm = (s) => String(s ?? "").normalize("NFC").toLowerCase();

// Search looks at both languages, whatever language the UI is in, so a Bangla
// search finds an item even when English is selected (and vice versa).
export function matchesQuery(a, q) {
  const needle = norm(q).trim();
  if (!needle) return true;
  const hay = [...(a.title || []), ...(a.summary || []), ...(a.issuer || [])].map(norm).join("\n");
  return needle.split(/\s+/).every((w) => hay.includes(w));
}

export function filterAnnouncements(items, { service, type, q, status } = {}) {
  return items.filter(
    (a) =>
      (!service || a.services.includes(service)) &&
      (!type || a.type === type) &&
      (!status || a.status === status) &&
      matchesQuery(a, q)
  );
}

const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
// Public order: newest published date first (ties: newest created first).
export const byDateDesc = (a, b) => cmp(b.date, a.date) || cmp(b.createdAt || "", a.createdAt || "");
// Admin order: most recently edited first.
export const byUpdatedDesc = (a, b) => cmp(b.updatedAt || "", a.updatedAt || "");

export function paginate(items, page = 1, pageSize = 10) {
  const size = Math.max(1, Math.floor(pageSize) || 10);
  const p = Math.max(1, Math.floor(page) || 1);
  const start = (p - 1) * size;
  return { items: items.slice(start, start + size), total: items.length, page: p, pageSize: size, hasMore: start + size < items.length };
}

const dayNumber = (y, m, d) => Math.floor(Date.UTC(y, m, d) / 86400000);

// True when the published date (YYYY-MM-DD) is today or up to `days` calendar
// days ago. Compared as local calendar dates, so the time of day never matters;
// a date in the future is not "new".
export function isNew(date, now = new Date(), days = 14) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  if (!m) return false;
  const age = dayNumber(now.getFullYear(), now.getMonth(), now.getDate()) - dayNumber(+m[1], +m[2] - 1, +m[3]);
  return age >= 0 && age <= days;
}

// Local calendar date as YYYY-MM-DD.
export function todayString(now = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}
