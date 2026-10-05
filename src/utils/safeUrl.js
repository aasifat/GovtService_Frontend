// URL checks for anything that ends up in an href/src. Pure, so it is tested
// directly. Link targets typed by an admin are never trusted: only http(s).

// A user-supplied link (the notice's source). Returns the normalised URL, or
// null for anything that is not a plain http: / https: URL (javascript:, data:,
// ftp:, relative paths, junk).
export function safeHttpUrl(value) {
  const s = String(value ?? "").trim();
  if (!s || s.length > 2048 || /[\u0000-\u001f\u007f\s]/.test(s)) return null;
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
}

// A file URL the API returned (static seed path, object URL, or an absolute
// http(s) URL from a real server). Same-site paths must start with a single "/".
export function safeAssetUrl(value) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  if (s.startsWith("blob:")) return s;
  if (s.startsWith("/") && !s.startsWith("//") && !s.includes("\\")) return s;
  return safeHttpUrl(s);
}
