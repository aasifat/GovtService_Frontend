import { useId } from "react";

// Design-system section: the standard page-rhythm wrapper.
//   eyebrow  small brand-coloured label above the title
//   title    the section heading (serif H2); labels the section for screen readers
//   intro    one supporting sentence under the title
//   rule     a top hairline separating it from the previous section
//   tone     "default" | "band" (deep green band, readable in both themes)
export default function Section({ eyebrow, title, intro, rule = false, tone = "default", className = "", children, ...rest }) {
  const titleId = useId();
  const cls = ["ds-section", rule ? "ds-section--rule" : "", tone === "band" ? "ds-section--band" : "", className].filter(Boolean).join(" ");
  return (
    <section className={cls} aria-labelledby={title ? titleId : undefined} {...rest}>
      {(title || eyebrow || intro) && (
        <header className="ds-section-head">
          {eyebrow && <span className="ds-section-eyebrow">{eyebrow}</span>}
          {title && (
            <h2 id={titleId} className="ds-t-h2">
              {title}
            </h2>
          )}
          {intro && <p className="ds-section-intro">{intro}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
