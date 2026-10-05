import Icon from "../Icon.jsx";
import Badge from "../ui/Badge.jsx";
import { SERVICES } from "../../data/services.js";
import { UI } from "../../i18n/strings.js";
import { pick } from "../../utils/lang.js";

// Home, Phase 3: only information that is already in the guide data. Every
// portal below is read from SERVICES[*].guides[*].portal (de-duplicated by
// address) and labelled with the service name(s) it belongs to; the note is the
// site's existing "sample data, verify first" string. Nothing is invented: no
// review date, no extra claims.
function portals() {
  const map = new Map();
  for (const s of SERVICES) {
    for (const g of s.guides) {
      if (!g.portal) continue;
      if (!map.has(g.portal)) map.set(g.portal, []);
      if (!map.get(g.portal).includes(s)) map.get(g.portal).push(s);
    }
  }
  return [...map.entries()].map(([url, services]) => ({ url, services }));
}

export default function TrustStrip({ lang }) {
  const T = (k) => pick(UI[k], lang);
  const list = portals();
  return (
    <section className="ds-trust" aria-labelledby="ds-trust-h">
      <div className="wrap ds-trust-in">
        <div className="ds-trust-head">
          <h2 id="ds-trust-h" className="ds-trust-title">
            {T("trustTitle")}
          </h2>
          <p>{T("trustSub")}</p>
          <Badge variant="warning" dot>
            {T("sample")}
          </Badge>
        </div>
        <ul className="ds-trust-list">
          {list.map((p) => (
            <li key={p.url}>
              <a href={p.url} target="_blank" rel="noopener noreferrer">
                <span dir="ltr">{p.url.replace(/^https?:\/\/(www\.)?/, "")}</span>
                <Icon name="ext" size={14} />
              </a>
              <small>{p.services.map((s) => pick(s.name, lang)).join(" · ")}</small>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
