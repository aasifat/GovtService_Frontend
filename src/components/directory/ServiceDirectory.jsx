import { useEffect, useId, useState } from "react";
import Icon from "../Icon.jsx";
import { SERVICES } from "../../data/services.js";
import { UI } from "../../i18n/strings.js";
import { pick, bnNum } from "../../utils/lang.js";
import { groupServices } from "./serviceDirectory.js";

// Phase 4: the grouped service directory. One row per service, each service
// exactly once, arranged in the presentation groups from serviceDirectory.js.
// Every row: icon, name, one-line description, its guide links and a chevron.
//
// Phone widths (<= 640px): rows are single-column, the group labels stick under
// the header, and each row's guide links sit behind a chevron button (the row
// itself still opens the service). Wider screens show the guide links inline.
//
// Props
//   services  the services to list (default: the real ones)
//   lang      "bn" | "en"
//   hrefs     optional { service(s), guide(s, g) } to override the links
//             (the styleguide stress sample uses it to keep its page in place)
const COMPACT = "(max-width: 640px)";
const useCompact = () => {
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(COMPACT).matches);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(COMPACT);
    const on = () => setCompact(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return compact;
};

const defaultHrefs = {
  service: (s) => `#/s/${s.id}`,
  guide: (s, g) => `#/s/${s.id}/${g.id}`,
};

function Row({ s, lang, compact, hrefs }) {
  const T = (k) => pick(UI[k], lang);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const n = s.guides.length;
  const name = pick(s.name, lang);
  const count = n === 1 ? T("dirGuideOne") : T("dirGuideMany").replace("{n}", bnNum(n, lang));
  const collapsed = compact && !open;
  return (
    <li className="ds-dir-row" data-service={s.id}>
      <div className="ds-dir-line">
        <a className="ds-dir-main" href={hrefs.service(s)}>
          <span className="ds-dir-ic" aria-hidden="true">
            <Icon name={s.icon} size={22} />
          </span>
          <span className="ds-dir-text">
            <b className="ds-dir-name">{name}</b>
            <span className="ds-dir-desc">{pick(s.desc, lang)}</span>
          </span>
          <Icon name="chevR" size={20} className="ds-dir-chev" />
        </a>
        {compact && n > 0 && (
          <button type="button" className="ds-dir-toggle" aria-expanded={open} aria-controls={listId} aria-label={`${T(open ? "dirHideGuides" : "dirShowGuides")}: ${name} (${count})`} onClick={() => setOpen((v) => !v)}>
            <Icon name="down" size={20} className="ds-dir-toggle-ic" />
          </button>
        )}
      </div>
      {n > 0 && (
        <ul className="ds-dir-guides" id={listId} aria-label={T("dirGuidesFor").replace("{name}", name)} hidden={collapsed}>
          {s.guides.map((g) => (
            <li key={g.id}>
              <a className="ds-dir-guide" href={hrefs.guide(s, g)}>
                {pick(g.title, lang)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ServiceDirectory({ services = SERVICES, lang, hrefs }) {
  const T = (k) => pick(UI[k], lang);
  const compact = useCompact();
  const h = { ...defaultHrefs, ...(hrefs || {}) };
  const groups = groupServices(services);
  const uid = useId();
  return (
    <div className="ds-dir">
      {groups.map((g) => (
        <section key={g.id} className="ds-dir-group" aria-labelledby={`${uid}-${g.id}`}>
          <h3 id={`${uid}-${g.id}`} className="ds-dir-title">
            {T(g.titleKey)} <span className="ds-dir-count">{bnNum(g.items.length, lang)}</span>
          </h3>
          <ul className="ds-dir-list">
            {g.items.map((s) => (
              <Row key={s.id} s={s} lang={lang} compact={compact} hrefs={h} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
