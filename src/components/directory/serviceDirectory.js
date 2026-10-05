// Phase 4: pure presentation helpers for the service directory and the service
// detail page. Nothing here reads or changes the service data; it only decides
// how the existing services are ARRANGED on screen.
//
// Grouping is presentation only (keyed by service id). A service that no group
// names, today or in the future, lands in "Other services", so a service can
// never disappear from the directory, and none can appear twice.

export const DIRECTORY_GROUPS = [
  { id: "identity", titleKey: "dirIdentity", ids: ["nid", "passport", "driving"] },
  { id: "property", titleKey: "dirProperty", ids: ["landtax", "ereturn"] },
  { id: "legal", titleKey: "dirLegal", ids: ["gd", "edu"] },
];
export const OTHER_GROUP = { id: "other", titleKey: "dirOther" };

// services -> [{ id, titleKey, items: service[] }]
// - every input service appears in exactly one group, exactly once
//   (a repeated id in the input, or an id named by two groups, is placed once);
// - ids a group names that are not in the input are skipped;
// - empty groups are left out;
// - the input array and the service objects are never changed.
export function groupServices(services, groups = DIRECTORY_GROUPS) {
  const unique = [];
  const seen = new Set();
  for (const s of services || []) {
    if (!s || seen.has(s.id)) continue;
    seen.add(s.id);
    unique.push(s);
  }
  const byId = new Map(unique.map((s) => [s.id, s]));
  const claimed = new Set();
  const out = [];
  for (const g of groups) {
    const items = [];
    for (const id of g.ids) {
      const s = byId.get(id);
      if (!s || claimed.has(id)) continue;
      claimed.add(id);
      items.push(s);
    }
    if (items.length) out.push({ id: g.id, titleKey: g.titleKey, items });
  }
  const rest = unique.filter((s) => !claimed.has(s.id));
  if (rest.length) out.push({ ...OTHER_GROUP, items: rest });
  return out;
}

// All the data in services.js is declared SAMPLE data (see the header of that
// file), so the "Sample data" badge shows for every service. A service whose
// content has been checked against the official source can say `sample: false`
// and the badge goes away without any code change.
export const isSampleService = (s) => !!s && s.sample !== false;

// The distinct official portals named by a service's guides, in guide order.
export function servicePortals(s) {
  const out = [];
  for (const g of (s && s.guides) || []) {
    if (g && g.portal && !out.includes(g.portal)) out.push(g.portal);
  }
  return out;
}

// "https://www.epassport.gov.bd/x" -> "epassport.gov.bd"
export const portalHost = (url) => String(url).replace(/^https?:\/\/(www\.)?/, "").replace(/[/?#].*$/, "");

export const guideCount = (s) => ((s && s.guides) || []).length;
