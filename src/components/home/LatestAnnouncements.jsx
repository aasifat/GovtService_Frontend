import { useEffect, useState } from "react";
import Section from "../ui/Section.jsx";
import Surface from "../ui/Surface.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import { listAnnouncements } from "../../api/announcements.js";
import { TYPE_LABELS } from "../../data/announcements.js";
import { isNew } from "../../utils/announcementFilters.js";
import { UI } from "../../i18n/strings.js";
import { pick, formatDate } from "../../utils/lang.js";

// Home, Phase 3: the newest PUBLISHED announcement as the featured item, then
// the next three as rows. Uses the existing public API (published items only,
// newest first) and the existing announcement routes. There is no "important"
// flag: the featured item is simply the newest. With no published items the
// whole section is left out.
const href = (a) => `#/announcements/${encodeURIComponent(a.id)}`;

export default function LatestAnnouncements({ lang }) {
  const T = (k) => pick(UI[k], lang);
  const [state, setState] = useState({ status: "loading", items: [] });

  useEffect(() => {
    let live = true;
    listAnnouncements({ pageSize: 4 })
      .then((r) => live && setState({ status: "ok", items: r.items }))
      .catch(() => live && setState({ status: "error", items: [] }));
    return () => {
      live = false;
    };
  }, []);

  if (state.status === "error" || (state.status === "ok" && !state.items.length)) return null;
  const [first, ...rest] = state.items;

  return (
    <div className="wrap ds-home-wrap">
      <Section className="ds-home-ann" title={T("homeAnnTitle")} intro={T("homeAnnSub")} rule aria-busy={state.status === "loading" ? "true" : undefined}>
        <div className="ds-ann-body">
          {first && (
            <Surface as="article" variant="featured" className="ds-ann-featured">
              <div className="ds-ann-tags">
                <Badge variant="brand">{pick(TYPE_LABELS[first.type], lang)}</Badge>
                {isNew(first.date) && <Badge variant="accent">{T("annNew")}</Badge>}
                {first.sample && (
                  <Badge variant="warning" dot>
                    {T("sampleBadge")}
                  </Badge>
                )}
              </div>
              <h3 className="ds-ann-title">
                <a href={href(first)}>{pick(first.title, lang)}</a>
              </h3>
              <p className="ds-ann-meta">
                {pick(first.issuer, lang)} · {formatDate(first.date, lang)}
              </p>
              <p className="ds-ann-sum">{pick(first.summary, lang)}</p>
              <div>
                <Button href={href(first)} variant="secondary" size="sm">
                  {T("annRead")}
                </Button>
              </div>
            </Surface>
          )}
          {rest.length > 0 && (
            <ul className="ds-ann-rows">
              {rest.map((a) => (
                <li key={a.id}>
                  <a className="ds-ann-row" href={href(a)}>
                    <span className="ds-ann-date">{formatDate(a.date, lang)}</span>
                    <span className="ds-ann-rowtitle">{pick(a.title, lang)}</span>
                    <span className="ds-ann-rowtags">
                      {pick(TYPE_LABELS[a.type], lang)}
                      {isNew(a.date) && <b className="ds-ann-newdot">{T("annNew")}</b>}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="ds-ann-all">
          <a href="#/announcements">{T("annViewAll")}</a>
        </p>
      </Section>
    </div>
  );
}
