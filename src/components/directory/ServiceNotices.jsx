import { useEffect, useId, useState } from "react";
import Badge from "../ui/Badge.jsx";
import { listAnnouncements } from "../../api/announcements.js";
import { TYPE_LABELS } from "../../data/announcements.js";
import { isNew } from "../../utils/announcementFilters.js";
import { UI } from "../../i18n/strings.js";
import { pick, formatDate } from "../../utils/lang.js";

// Phase 4, service detail: the latest published notices for ONE service, from
// the existing public API and the existing announcement routes (the same query
// the guide page's notices use). Drafts never appear (the public API only
// returns published items). With nothing to show, or on an error, the whole
// block is left out, so the page never shows a broken or invented section.
export default function ServiceNotices({ sid, lang }) {
  const T = (k) => pick(UI[k], lang);
  const [items, setItems] = useState([]);
  const hid = useId();

  useEffect(() => {
    let live = true;
    listAnnouncements({ service: sid, pageSize: 3 })
      .then((r) => live && setItems(r.items))
      .catch(() => live && setItems([]));
    return () => {
      live = false;
    };
  }, [sid]);

  if (!items.length) return null;
  return (
    <section className="ds-svc-notices" aria-labelledby={hid}>
      <div className="ds-svc-notices-head">
        <h2 id={hid} className="ds-svc-h2">
          {T("annLatest")}
        </h2>
        <a className="ds-svc-viewall" href={`#/announcements?service=${encodeURIComponent(sid)}`}>
          {T("annViewAll")}
        </a>
      </div>
      <ul className="ds-svc-notice-list">
        {items.map((a) => (
          <li key={a.id}>
            <a className="ds-svc-notice" href={`#/announcements/${encodeURIComponent(a.id)}`}>
              <span className="ds-svc-notice-title">{pick(a.title, lang)}</span>
              <span className="ds-svc-notice-meta">
                {pick(TYPE_LABELS[a.type], lang)} · {formatDate(a.date, lang)}
                {isNew(a.date) && <Badge variant="accent">{T("annNew")}</Badge>}
                {a.sample && (
                  <Badge variant="warning" dot>
                    {T("sampleBadge")}
                  </Badge>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
