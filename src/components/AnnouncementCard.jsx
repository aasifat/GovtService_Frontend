import Icon from "./Icon.jsx";
import Badge from "./ui/Badge.jsx";
import { findService } from "../data/services.js";
import { TYPE_LABELS } from "../data/announcements.js";
import { UI } from "../i18n/strings.js";
import { pick, formatDate, bnNum } from "../utils/lang.js";
import { isNew } from "../utils/announcementFilters.js";
import { safeHttpUrl } from "../utils/safeUrl.js";

// One announcement on the public list. With `preview`, the same card is drawn
// without links (used by the admin form's live preview).
//
// Phase 7: `ds` draws the design-system version used by the public list, either as
// the featured card (`featured`, the newest published item) or as a ledger row
// (date column, then the item). The data, the links, the heading level and every
// legacy class (.ann-card .ann-tags .ann-tag .ann-type .ann-new .ann-chip.draft
// .ann-sample .ann-title .ann-meta .ann-sum .ann-actions .ann-pdf-flag .ann-src)
// stay on the same elements. Without `ds` the markup is exactly what it was.
//
// Phase 9: the admin form's live preview passes `ds` together with `preview`. That draws the
// same card, stacked (no date column, no "Latest" label, no links), as `.ds-anl-preview`.
export default function AnnouncementCard({ a, lang, preview = false, Heading = "h2", ds = false, featured = false }) {
  const T = (k) => pick(UI[k], lang);
  const title = pick(a.title, lang);
  const issuer = pick(a.issuer, lang);
  const summary = pick(a.summary, lang);
  const source = safeHttpUrl(a.sourceUrl);
  const href = `#/announcements/${encodeURIComponent(a.id)}`;
  const fresh = isNew(a.date);

  const tags = (
    <div className={ds ? "ann-tags ds-anl-tags" : "ann-tags"}>
      {a.services.map((sid) => {
        const s = findService(sid);
        return (
          <span className={ds ? "ann-tag ds-anl-tag" : "ann-tag"} key={sid}>
            {s ? pick(s.name, lang) : sid}
          </span>
        );
      })}
      <span className={ds ? "ann-tag ann-type ds-anl-tag ds-anl-type" : "ann-tag ann-type"}>{pick(TYPE_LABELS[a.type], lang)}</span>
      {ds ? (
        <>
          {fresh && (
            <Badge variant="accent" className="ann-new">
              {T("annNew")}
            </Badge>
          )}
          {a.status === "draft" && (
            <Badge variant="error" className="ann-chip draft">
              {T("statusDraft")}
            </Badge>
          )}
          {a.sample && (
            <Badge variant="warning" dot className="ann-sample">
              {T("sampleBadge")}
            </Badge>
          )}
        </>
      ) : (
        <>
          {fresh && <span className="ann-new">{T("annNew")}</span>}
          {a.status === "draft" && <span className="ann-chip draft">{T("statusDraft")}</span>}
          {a.sample && <span className="ann-sample">{T("sample")}</span>}
        </>
      )}
    </div>
  );

  const heading = (
    <Heading className={ds ? "ann-title ds-anl-title" : "ann-title"}>{preview || !a.id ? title : <a href={href} className={ds ? "ds-anl-titlelink" : undefined}>{title}</a>}</Heading>
  );

  const actions = (
    <div className={ds ? "ann-actions ds-anl-actions" : "ann-actions"}>
      {!preview && (
        <a className={ds ? "btn-outline ds-btn ds-btn--secondary ds-btn--sm ds-anl-read" : "btn-outline"} href={href}>
          {T("annRead")}
          <Icon name="chevR" size={16} />
        </a>
      )}
      {a.hasPdf && (
        <span className={ds ? "ann-pdf-flag ds-anl-flag" : "ann-pdf-flag"} title={T("annHasPdf")}>
          <Icon name="file" size={16} /> {T("annPdf")}
        </span>
      )}
      {a.attachments && a.attachments.length > 0 && (
        <span className={ds ? "ann-pdf-flag ds-anl-flag" : "ann-pdf-flag"} title={T("annAttachments")}>
          <Icon name="clip" size={16} /> {bnNum(a.attachments.length, lang)}
        </span>
      )}
      {source && (
        <a className={ds ? "ann-src ds-anl-src" : "ann-src"} href={source} target="_blank" rel="noopener noreferrer">
          {T("annSource")}
          <Icon name="ext" size={14} />
        </a>
      )}
    </div>
  );

  if (!ds) {
    return (
      <article className="ann-card">
        {tags}
        {heading}
        <p className="ann-meta">
          {issuer && <span>{issuer}</span>}
          {a.date && <span>{formatDate(a.date, lang)}</span>}
        </p>
        <p className="ann-sum">{summary}</p>
        {actions}
      </article>
    );
  }

  // DS markup: a lead (date, and "Latest" on the featured card), then the item.
  const shape = preview ? "ds-anl-preview" : featured ? "ds-anl-featured" : "ds-anl-row";
  return (
    <article className={"ann-card ds-anl-item " + shape}>
      <div className="ds-anl-lead">
        {featured && <span className="ds-anl-eyebrow">{T("annFeatured")}</span>}
        {a.date && <span className="ann-date ds-anl-date">{formatDate(a.date, lang)}</span>}
      </div>
      <div className="ds-anl-main">
        {tags}
        {heading}
        {issuer && (
          <p className="ann-meta ds-anl-meta">
            <span>{issuer}</span>
          </p>
        )}
        <p className="ann-sum ds-anl-sum">{summary}</p>
        {actions}
      </div>
    </article>
  );
}
