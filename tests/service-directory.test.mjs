import test from "node:test";
import assert from "node:assert/strict";
import { groupServices, DIRECTORY_GROUPS, OTHER_GROUP, isSampleService, servicePortals, portalHost, guideCount } from "../src/components/directory/serviceDirectory.js";
import { SERVICES } from "../src/data/services.js";

const ids = (groups) => groups.flatMap((g) => g.items.map((s) => s.id));
const fake = (id) => ({ id, icon: "idcard", name: [id, id], desc: [id, id], guides: [] });

test("directory: every real service appears exactly once", () => {
  const groups = groupServices(SERVICES);
  const out = ids(groups);
  assert.equal(out.length, SERVICES.length);
  assert.equal(new Set(out).size, SERVICES.length);
  assert.deepEqual([...out].sort(), SERVICES.map((s) => s.id).sort());
});

test("directory: the three approved groups, in order, and no Other group today", () => {
  const groups = groupServices(SERVICES);
  assert.deepEqual(
    groups.map((g) => [g.id, g.items.map((s) => s.id)]),
    [
      ["identity", ["nid", "passport", "driving"]],
      ["property", ["landtax", "ereturn"]],
      ["legal", ["gd", "edu"]],
    ]
  );
  assert.deepEqual(groups.map((g) => g.titleKey), ["dirIdentity", "dirProperty", "dirLegal"]);
});

test("directory: unmapped services (current or future) go to Other services, once, in input order", () => {
  const extra = [fake("zeta"), fake("alpha")];
  const groups = groupServices([...SERVICES, ...extra]);
  const last = groups[groups.length - 1];
  assert.equal(last.id, OTHER_GROUP.id);
  assert.equal(last.titleKey, "dirOther");
  assert.deepEqual(last.items.map((s) => s.id), ["zeta", "alpha"]);
  const out = ids(groups);
  assert.equal(out.length, SERVICES.length + 2);
  assert.equal(new Set(out).size, out.length);
});

test("directory: a service that is only unmapped still shows up when the input has nothing mapped", () => {
  const groups = groupServices([fake("solo")]);
  assert.deepEqual(groups.map((g) => g.id), ["other"]);
  assert.deepEqual(ids(groups), ["solo"]);
});

test("directory: ten services (the stress case) are all placed exactly once", () => {
  const ten = [...SERVICES, fake("sample-8"), fake("sample-9"), fake("sample-10")];
  const out = ids(groupServices(ten));
  assert.equal(out.length, 10);
  assert.equal(new Set(out).size, 10);
});

test("directory: no service is duplicated even if the input repeats one", () => {
  const out = ids(groupServices([...SERVICES, SERVICES[0], fake("x"), fake("x")]));
  assert.equal(out.length, SERVICES.length + 1);
  assert.equal(new Set(out).size, out.length);
});

test("directory: an id named by two groups is placed once, in the first", () => {
  const groups = [
    { id: "a", titleKey: "ka", ids: ["nid", "passport"] },
    { id: "b", titleKey: "kb", ids: ["passport", "driving"] },
  ];
  const out = groupServices(SERVICES, groups);
  assert.deepEqual(out.find((g) => g.id === "a").items.map((s) => s.id), ["nid", "passport"]);
  assert.deepEqual(out.find((g) => g.id === "b").items.map((s) => s.id), ["driving"]);
  assert.equal(new Set(ids(out)).size, ids(out).length);
});

test("directory: empty groups are omitted; missing ids are skipped; empty input is fine", () => {
  assert.deepEqual(groupServices([]), []);
  assert.deepEqual(groupServices(undefined), []);
  const only = groupServices([SERVICES.find((s) => s.id === "gd")]);
  assert.deepEqual(only.map((g) => g.id), ["legal"]);
});

test("directory: grouping never changes the service data", () => {
  const before = JSON.stringify(SERVICES);
  const copy = [...SERVICES];
  groupServices(SERVICES);
  assert.equal(JSON.stringify(SERVICES), before);
  assert.deepEqual(SERVICES, copy);
  for (const g of DIRECTORY_GROUPS) assert.ok(Array.isArray(g.ids) && g.ids.length);
});

test("service detail: guide count, portals (distinct, in guide order) and host label", () => {
  for (const s of SERVICES) {
    assert.equal(guideCount(s), s.guides.length);
    const portals = servicePortals(s);
    assert.equal(new Set(portals).size, portals.length);
    for (const p of portals) assert.ok(s.guides.some((g) => g.portal === p));
  }
  assert.deepEqual(servicePortals({ guides: [{ portal: "https://a.gov.bd" }, { portal: "https://a.gov.bd" }, { portal: "https://b.gov.bd/x" }, {}] }), ["https://a.gov.bd", "https://b.gov.bd/x"]);
  assert.deepEqual(servicePortals({ guides: [{}] }), []);
  assert.deepEqual(servicePortals(null), []);
  assert.equal(portalHost("https://www.epassport.gov.bd/path?q=1"), "epassport.gov.bd");
  assert.equal(portalHost("http://services.nidw.gov.bd"), "services.nidw.gov.bd");
});

test("service detail: Sample data badge shows for sample services only", () => {
  for (const s of SERVICES) assert.equal(isSampleService(s), true, s.id + " is sample data");
  assert.equal(isSampleService({ id: "checked", sample: false }), false);
  assert.equal(isSampleService({ id: "marked", sample: true }), true);
  assert.equal(isSampleService(null), false);
});
