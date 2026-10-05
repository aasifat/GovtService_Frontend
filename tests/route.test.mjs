import test from "node:test";
import assert from "node:assert/strict";
import { parseHashString, safeNext, authHref } from "../src/utils/route.js";

test("existing service and guide routes are unchanged", () => {
  assert.deepEqual(parseHashString("#/s/nid"), { page: "service", sid: "nid", gid: null, tab: "steps" });
  assert.deepEqual(parseHashString("#/s/nid/new/docs"), { page: "guide", sid: "nid", gid: "new", tab: "docs" });
});

test("home and unknown routes fall back to home", () => {
  assert.deepEqual(parseHashString(""), { page: "home" });
  assert.deepEqual(parseHashString("#/"), { page: "home" });
  assert.deepEqual(parseHashString("#/nope"), { page: "home" });
  assert.deepEqual(parseHashString("#/login/extra"), { page: "home" });
  assert.deepEqual(parseHashString("#/profile/a/b"), { page: "home" });
  assert.deepEqual(parseHashString("#/announcements/a/b"), { page: "home" });
});

test("login and register carry a sanitised next", () => {
  assert.deepEqual(parseHashString("#/login"), { page: "login", next: null });
  assert.deepEqual(parseHashString("#/login?next=/s/nid/new/docs"), { page: "login", next: "/s/nid/new/docs" });
  assert.deepEqual(parseHashString("#/register?next=%2Fprofile%2Fchats"), { page: "register", next: "/profile/chats" });
  assert.equal(parseHashString("#/login?next=https://evil.test").next, null);
  assert.equal(parseHashString("#/login?next=//evil.test").next, null);
});

test("next may itself contain a query", () => {
  assert.equal(parseHashString("#/login?next=%2Fannouncements%3Fq%3Dnid").next, "/announcements?q=nid");
});

test("profile tabs", () => {
  assert.deepEqual(parseHashString("#/profile"), { page: "profile", tab: "account" });
  assert.deepEqual(parseHashString("#/profile/chats"), { page: "profile", tab: "chats" });
});

test("announcement routes", () => {
  assert.deepEqual(parseHashString("#/announcements"), { page: "announcements" });
  assert.deepEqual(parseHashString("#/announcements/ann-1"), { page: "announcement", aid: "ann-1" });
});

test("safeNext and authHref", () => {
  assert.equal(safeNext("/s/nid"), "/s/nid");
  assert.equal(safeNext("s/nid"), null);
  assert.equal(safeNext("/\\evil"), null);
  assert.equal(safeNext(undefined), null);
  assert.equal(authHref("login", "/s/nid?x=1"), "#/login?next=%2Fs%2Fnid%3Fx%3D1");
  assert.equal(authHref("register", "//evil"), "#/register");
});

test("announcements list can carry a service filter", () => {
  assert.deepEqual(parseHashString("#/announcements?service=nid"), { page: "announcements", service: "nid" });
  assert.deepEqual(parseHashString("#/announcements?foo=1"), { page: "announcements" });
});

test("admin announcement routes", () => {
  assert.deepEqual(parseHashString("#/admin/announcements"), { page: "adminAnnouncements" });
  assert.deepEqual(parseHashString("#/admin/announcements/new"), { page: "adminAnnouncementForm", aid: null });
  assert.deepEqual(parseHashString("#/admin/announcements/ann_x1/edit"), { page: "adminAnnouncementForm", aid: "ann_x1" });
  assert.deepEqual(parseHashString("#/admin/announcements/ann%20x/edit"), { page: "adminAnnouncementForm", aid: "ann x" });
});

test("anything else under /admin falls back to home", () => {
  for (const h of ["#/admin", "#/admin/", "#/admin/users", "#/admin/announcements/ann_x1", "#/admin/announcements/new/edit", "#/admin/announcements/a/edit/more", "#/admin/announcements/a/delete", "#/admin/announcements/new/x"]) {
    assert.deepEqual(parseHashString(h), { page: "home" }, h);
  }
});
