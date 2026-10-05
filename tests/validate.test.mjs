import test from "node:test";
import assert from "node:assert/strict";
import { validateName, validateEmail, validatePassword } from "../src/utils/validate.js";
import { formatDate } from "../src/utils/lang.js";

test("name", () => {
  assert.equal(validateName("  "), "errNameRequired");
  assert.equal(validateName("Rina"), null);
});

test("email", () => {
  assert.equal(validateEmail(""), "errEmailRequired");
  assert.equal(validateEmail("rina@"), "errEmailInvalid");
  assert.equal(validateEmail("a b@c.com"), "errEmailInvalid");
  assert.equal(validateEmail(" rina@example.com "), null);
});

test("password needs 8+ characters", () => {
  assert.equal(validatePassword("1234567"), "errPasswordShort");
  assert.equal(validatePassword("12345678"), null);
});

test("formatDate reads YYYY-MM-DD as a local calendar date", () => {
  assert.equal(formatDate("2026-10-02", "en"), "2 October 2026");
  assert.match(formatDate("2026-10-02", "bn"), /২০২৬/);
  assert.equal(formatDate("", "en"), "");
  assert.equal(formatDate("garbage", "en"), "");
});
