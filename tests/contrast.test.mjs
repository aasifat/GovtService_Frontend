import test from "node:test";
import assert from "node:assert/strict";
import { contrast, luminance, evaluate, suggestAdjusted, hexToRgb, rgbToHex } from "../src/styleguide/contrast.js";

const close = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("black on white is 21:1 and the ratio is symmetric", () => {
  close(contrast("#000000", "#ffffff"), 21, 0.001);
  close(contrast("#ffffff", "#000000"), 21, 0.001);
  close(contrast("#123456", "#123456"), 1, 0.001);
});

test("known WCAG reference values", () => {
  close(contrast("#767676", "#ffffff"), 4.54); // the classic AA boundary grey
  close(contrast("#777777", "#ffffff"), 4.48);
  close(luminance("#ffffff"), 1, 0.0001);
  close(luminance("#000000"), 0, 0.0001);
});

test("evaluate applies the right threshold per kind", () => {
  assert.equal(evaluate("#777777", "#ffffff", "normal").status, "fail");
  assert.equal(evaluate("#777777", "#ffffff", "large").status, "pass");
  assert.equal(evaluate("#777777", "#ffffff", "ui").status, "pass");
  assert.equal(evaluate("#aaaaaa", "#ffffff", "ui").status, "fail");
  assert.equal(evaluate("#eeeeee", "#ffffff", "decorative").status, "exempt");
  assert.equal(evaluate("#eeeeee", "#ffffff", "decorative").required, null);
});

test("hex parsing and formatting", () => {
  assert.deepEqual(hexToRgb("#0A1813"), [10, 24, 19]);
  assert.deepEqual(hexToRgb("fff"), [255, 255, 255]);
  assert.equal(rgbToHex([10, 24, 19]), "#0A1813");
  assert.throws(() => hexToRgb("rgb(0,0,0)"));
});

test("suggestAdjusted reaches the target and keeps hue-ish", () => {
  const s = suggestAdjusted("#777777", "#ffffff", 4.5);
  assert.ok(s.ratio >= 4.5);
  assert.ok(contrast(s.hex, "#ffffff") >= 4.5);
  const dark = suggestAdjusted("#3F6354", "#163027", 3);
  assert.ok(dark.ratio >= 3);
  assert.equal(suggestAdjusted("#ffffff", "#ffffff", 21.5), null); // impossible target
});
