// Entry for the standalone styleguide (styleguide.html). Nothing in the app
// imports this file and the app's index.html / main.jsx never load the CSS
// below, so the production build (which only starts from index.html) does not
// contain any of it.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/ds-tokens.css";
import "../styles/ds-primitives.css";
import "../styles/ds-directory.css"; // Phase 4: the real directory component is shown in the stress sample
import "../styles/ds-styleguide.css";
import Styleguide from "./Styleguide.jsx";

// The metric-adjusted fallback faces. Add ?nofallback to the URL to leave them
// out and see what a plain system-font fallback does to layout.
if (!new URLSearchParams(location.search).has("nofallback")) await import("../styles/ds-fonts.css");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Styleguide />
  </StrictMode>
);
