// What the styleguide checks. Token names are CSS custom properties from
// src/styles/ds-tokens.css; their values are READ FROM THE STYLESHEET at run
// time (see probe.js), so the report always reflects the real tokens.
//
// kind: "normal" (4.5:1 text) | "large" (3:1 text, 24px+ regular or 18.66px+ bold)
//       | "ui" (3:1 non-text: focus rings, control borders) | "decorative" (exempt)

export const SWATCH_GROUPS = [
  { title: "Canvas and surfaces", tokens: ["canvas", "surface-1", "surface-2", "surface-3"] },
  { title: "Text", tokens: ["text", "text-muted"] },
  { title: "Lines and focus", tokens: ["line", "border-input", "focus", "focus-on-hero"] },
  { title: "Brand (identity green)", tokens: ["brand", "brand-soft", "text-on-brand"] },
  { title: "Action (brass)", tokens: ["action", "action-hover", "action-active", "action-ink", "text-on-action"] },
  { title: "Accent (flag red)", tokens: ["accent", "text-on-accent"] },
  { title: "Status", tokens: ["success", "success-bg", "warning", "warning-bg", "error", "error-bg"] },
  { title: "Hero band (deep green)", tokens: ["hero", "text-on-hero", "text-on-hero-muted"] },
];

const P = (fg, bg, kind, usage) => ({ fg, bg, kind, usage });

export const PAIRS = [
  // body and muted text on every surface
  P("text", "canvas", "normal", "Body text on the page"),
  P("text", "surface-1", "normal", "Body text on cards, forms, dialogs"),
  P("text", "surface-2", "normal", "Text inside inputs, quiet bands"),
  P("text", "surface-3", "normal", "Text on hover / selected rows, neutral badge"),
  P("text-muted", "canvas", "normal", "Secondary text on the page"),
  P("text-muted", "surface-1", "normal", "Secondary text on cards"),
  P("text-muted", "surface-2", "normal", "Placeholder text, helper text in inputs"),
  P("text-muted", "surface-3", "normal", "Secondary text on hover / selected rows"),
  // brand, links
  P("brand", "canvas", "normal", "Links and active states on the page"),
  P("brand", "surface-1", "normal", "Links on cards"),
  P("brand", "surface-3", "normal", "Ghost button on hover"),
  P("brand", "brand-soft", "normal", "Brand badge, ghost button hover"),
  P("text-on-brand", "brand", "normal", "Text on a solid brand fill"),
  // action (brass)
  P("text-on-action", "action", "normal", "Primary button label"),
  P("text-on-action", "action-hover", "normal", "Primary button label, hover"),
  P("text-on-action", "action-active", "normal", "Primary button label, pressed"),
  P("action-ink", "canvas", "normal", "Brass text, normal size, on the page"),
  P("action-ink", "surface-1", "normal", "Brass text, normal size, on cards"),
  P("action-ink", "canvas", "large", "Big numbers (fee, time) on the page"),
  P("action-ink", "surface-1", "large", "Big numbers on cards"),
  // accent
  P("text-on-accent", "accent", "normal", "NEW badge label"),
  P("accent", "canvas", "normal", "Flag-red text on the page (avoid; never alone)"),
  P("accent", "surface-1", "normal", "Flag-red text on cards (avoid; never alone)"),
  // status
  P("success", "canvas", "normal", "Success text on the page"),
  P("success", "surface-1", "normal", "Success text on cards"),
  P("success", "success-bg", "normal", "Success badge, success tint"),
  P("warning", "canvas", "normal", "Warning text on the page (sample-data note)"),
  P("warning", "surface-1", "normal", "Warning text on cards"),
  P("warning", "warning-bg", "normal", "Warning / Sample badge"),
  P("error", "canvas", "normal", "Error text on the page"),
  P("error", "surface-1", "normal", "Inline form error on cards"),
  P("error", "surface-2", "normal", "Error text on input background"),
  P("error", "error-bg", "normal", "Error badge, danger button hover"),
  // hero band
  P("text-on-hero", "hero", "normal", "Headline and body on the deep-green band"),
  P("text-on-hero-muted", "hero", "normal", "Supporting text on the deep-green band"),
  P("action", "hero", "normal", "Brass button / link text on the band"),
  P("action", "hero", "large", "Brass big numbers on the band"),
  // non-text
  P("focus", "canvas", "ui", "Focus ring on the page"),
  P("focus", "surface-1", "ui", "Focus ring on cards"),
  P("focus", "surface-2", "ui", "Focus ring on inputs"),
  P("focus-on-hero", "hero", "ui", "Focus ring on the deep-green band (Step 2.0 token)"),
  P("border-input", "canvas", "ui", "Input / secondary-button border against the page"),
  P("border-input", "surface-1", "ui", "Input border against a card"),
  P("border-input", "surface-2", "ui", "Input border against its own fill"),
  P("brand", "surface-1", "ui", "Selected / checked indicator on cards"),
  // exempt hairlines, shown for information
  P("line", "canvas", "decorative", "Divider on the page (exempt)"),
  P("line", "surface-1", "decorative", "Card border (exempt; content is not conveyed by it)"),
  P("surface-3", "surface-1", "decorative", "Hover / selected tint (exempt)"),
];
