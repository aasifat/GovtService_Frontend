import { useEffect, useState } from "react";
import Badge from "./ui/Badge.jsx";
import { listAnnouncements } from "../api/announcements.js";
import { UI } from "../i18n/strings.js";
import { TYPE_LABELS } from "../data/announcements.js";
import { pick, formatDate } from "../utils/lang.js";
import { isNew } from "../utils/announcementFilters.js";

// "Latest notices for this service": up to 3 published items on a guide page,
// linking to the filtered list. Renders nothing while loading, on error, or
// when there is nothing to show, so a guide page never gets a broken block.
// Phase 5: restyled as a compact list (same data, same routes, same ids).
export default function LatestNotices({ sid, lang }) {
  const T = (k) => pick(UI[k], lang);
  const [items, setItems] = useState([]);

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
    <section className="latest-notices ds-gd-notices" aria-labelledby="latest-notices-h">
      <div className="latest-head ds-gd-notices-head">
        <h2 id="latest-notices-h" className="ds-gd-notices-title">
          {T("annLatest")}
        </h2>
        <a className="ds-gd-notices-all" href={`#/announcements?service=${encodeURIComponent(sid)}`}>
          {T("annViewAll")}
        </a>
      </div>
      <ul className="ds-gd-notice-list">
        {items.map((a) => (
          <li key={a.id} className="ds-gd-notice">
            <a className="ds-gd-notice-link" href={`#/announcements/${encodeURIComponent(a.id)}`}>
              {pick(a.title, lang)}
            </a>
            <span className="latest-meta ds-gd-notice-meta">
              {pick(TYPE_LABELS[a.type], lang)} · {formatDate(a.date, lang)}
              {isNew(a.date) && <Badge variant="accent">{T("annNew")}</Badge>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
