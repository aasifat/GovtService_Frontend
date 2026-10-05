import { useEffect, useState } from "react";
import Colors from "./Colors.jsx";
import Typography from "./Typography.jsx";
import Foundations from "./Foundations.jsx";
import Primitives from "./Primitives.jsx";
import SurfaceCompare from "./SurfaceCompare.jsx";
import DirectoryStress from "./DirectoryStress.jsx";
import FontFallbacks from "./FontFallbacks.jsx";

const NAV = [
  ["colors", "Colour"],
  ["contrast-summary", "WCAG failures"],
  ["surface-compare", "Surface 1"],
  ["typography", "Typography"],
  ["bangla-small", "Small Bangla"],
  ["fallback-fonts", "Fallback fonts"],
  ["spacing", "Spacing"],
  ["radius", "Radius"],
  ["elevation", "Elevation"],
  ["motion", "Motion"],
  ["buttons", "Button"],
  ["inputs", "Input"],
  ["badges", "Badge"],
  ["surfaces", "Surface"],
  ["sections", "Section"],
  ["skeletons", "Skeleton"],
  ["toasts", "Toast"],
  ["directory-stress", "Directory (10)"],
];

export default function Styleguide() {
  const [theme, setTheme] = useState("dark"); // dark deep green is the default
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      <a className="sg-skip" href="#main">
        Skip to content
      </a>
      <header className="sg-bar">
        <div className="sg-bar-in">
          <span className="sg-brand">
            <span className="sg-disc" aria-hidden="true" />
            <b>Amar Sheba</b> design system <span className="sg-phase">Phase 1 · styleguide</span>
          </span>
          <div className="sg-theme" role="group" aria-label="Theme">
            <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
              Dark (default)
            </button>
            <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
              Light
            </button>
          </div>
        </div>
        <nav className="sg-nav" aria-label="Styleguide sections">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
      </header>
      <main id="main" className="sg-main">
        <div className="sg-hero">
          <p className="sg-eyebrow">Civic Ledger · standalone review page</p>
          <h1 className="ds-t-display">Design system, Phase 1</h1>
          <p className="ds-t-body sg-lead">Tokens and primitives for the redesign, reviewed on their own. This page is not part of the app: it is not routed, not built into production, and no existing page uses these tokens yet. Toggle the theme at the top right.</p>
        </div>
        <Colors />
        <SurfaceCompare />
        <Typography />
        <FontFallbacks />
        <Foundations />
        <Primitives />
        <DirectoryStress />
        <footer className="sg-foot ds-t-small">Phase 1 styleguide · values are proposals; contrast results are computed from the stylesheet at load time.</footer>
      </main>
    </>
  );
}
