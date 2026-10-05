import Logo from "./Logo.jsx";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";

export default function Footer({ lang }) {
  return (
    <footer className="foot ds-foot">
      <div className="wrap foot-in">
        <div className="foot-brand">
          <Logo size={28} ds />
          <span>আমার সেবা · Amar Sheba</span>
        </div>
        <p>{pick(UI.footer, lang)}</p>
        <p className="foot-small">{pick(UI.capstone, lang)}</p>
      </div>
    </footer>
  );
}
