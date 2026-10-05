// Tiny hash router: no dependency, and the URLs stay shareable/bookmarkable.
// #/                              -> home
// #/s/<serviceId>                 -> service page
// #/s/<serviceId>/<guideId>       -> guide page, "steps" tab
// #/s/<serviceId>/<guideId>/<tab> -> guide page, a specific tab
// #/login, #/register             -> auth pages (both accept ?next=/some/path)
// #/profile, #/profile/<tab>      -> profile page, "account" tab by default
// #/announcements                 -> announcements list (?service=<id> pre-filters it)
// #/announcements/<id>            -> one announcement
// #/admin/announcements           -> admin: manage announcements
// #/admin/announcements/new       -> admin: create
// #/admin/announcements/<id>/edit -> admin: edit
// Anything else falls back to home.

// Only same-site paths are accepted as a post-login destination.
export function safeNext(next) {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
}

// Pure version (takes the hash string) so it can be tested without a browser.
export function parseHashString(hash) {
  const raw = (hash || "#/").replace(/^#\/?/, "");
  const q = raw.indexOf("?");
  const path = q >= 0 ? raw.slice(0, q) : raw;
  const next = q >= 0 ? safeNext(new URLSearchParams(raw.slice(q + 1)).get("next")) : null;
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "s" && parts[1]) {
    return {
      page: parts[2] ? "guide" : "service",
      sid: parts[1],
      gid: parts[2] || null,
      tab: parts[3] || "steps",
    };
  }
  if (parts[0] === "login" && parts.length === 1) return { page: "login", next };
  if (parts[0] === "register" && parts.length === 1) return { page: "register", next };
  if (parts[0] === "profile" && parts.length <= 2) return { page: "profile", tab: parts[1] || "account" };
  if (parts[0] === "announcements" && parts.length === 1) {
    const service = q >= 0 ? new URLSearchParams(raw.slice(q + 1)).get("service") : null;
    return service ? { page: "announcements", service } : { page: "announcements" };
  }
  if (parts[0] === "admin" && parts[1] === "announcements") {
    if (parts.length === 2) return { page: "adminAnnouncements" };
    if (parts.length === 3 && parts[2] === "new") return { page: "adminAnnouncementForm", aid: null };
    if (parts.length === 4 && parts[3] === "edit" && parts[2] !== "new") return { page: "adminAnnouncementForm", aid: decodeURIComponent(parts[2]) };
  }
  if (parts[0] === "announcements" && parts.length === 2) return { page: "announcement", aid: decodeURIComponent(parts[1]) };
  return { page: "home" };
}

export function parseHash() {
  return parseHashString(location.hash);
}

export function go(path) {
  location.hash = path;
}

// Current location as a "/path?query" string, e.g. to use as `next`.
export function currentPath() {
  return (location.hash || "#/").replace(/^#/, "") || "/";
}

// "#/login?next=%2Fs%2Fnid" -- `next` is optional.
export function authHref(page, next) {
  const n = safeNext(next);
  return `#/${page}` + (n ? `?next=${encodeURIComponent(n)}` : "");
}
