import { useEffect, useId, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import Icon from "./Icon.jsx";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";
import { formatBytes } from "../utils/pdfValidate.js";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENTS } from "../utils/attachmentValidate.js";
import { safeAssetUrl } from "../utils/safeUrl.js";

// Picker for the extra files of an announcement (Excel workbooks and images).
// The parent owns the state and validates; this only shows it.
//   existing    attachments already saved: [{ id, name, size, kind, url }]
//   removedIds  ids of existing ones marked for removal
//   newFiles    File[] chosen in this form, not saved yet
// Phase 9: used only by the admin form; gains design-system classes next to the legacy ones.
export default function AttachmentsField({ lang, existing, removedIds, newFiles, error, maxMb, onAdd, onRemoveExisting, onUndoRemove, onRemoveNew }) {
  const T = (k) => pick(UI[k], lang);
  const id = useId();
  const input = useRef(null);
  const kept = existing.filter((a) => !removedIds.includes(a.id));
  const total = kept.length + newFiles.length;
  const errId = `${id}-err`;

  return (
    <div className="att-field">
      <span className="pdf-label ds-field-label" id={`${id}-label`}>
        {T("frmAttach")}
      </span>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        tabIndex={-1}
        accept={ATTACHMENT_ACCEPT}
        onChange={(e) => {
          onAdd([...e.target.files]);
          e.target.value = "";
        }}
      />
      {(existing.length > 0 || newFiles.length > 0) && (
        <ul className="att-list" aria-labelledby={`${id}-label`}>
          {existing.map((a) => {
            const gone = removedIds.includes(a.id);
            return (
              <li key={a.id} className={"att-row" + (gone ? " gone" : "")}>
                <Thumb kind={a.kind} url={a.url} />
                <div className="pdf-meta">
                  <b dir="ltr">{a.name}</b>
                  <span>{gone ? T("frmAttachWillRemove") : formatBytes(a.size, lang)}</span>
                </div>
                {gone ? (
                  <button type="button" className="btn-text ds-btn ds-btn--ghost ds-btn--sm" onClick={() => onUndoRemove(a.id)}>
                    {T("frmPdfUndo")}
                  </button>
                ) : (
                  <button type="button" className="btn-danger ds-btn ds-btn--danger ds-btn--sm" onClick={() => onRemoveExisting(a.id)} aria-label={`${T("frmPdfRemove")}: ${a.name}`}>
                    <Icon name="trash" size={15} /> {T("frmPdfRemove")}
                  </button>
                )}
              </li>
            );
          })}
          {newFiles.map((f, i) => (
            <li key={`${f.name}-${i}`} className="att-row">
              <NewThumb file={f} />
              <div className="pdf-meta">
                <b dir="ltr">{f.name}</b>
                <span>
                  {formatBytes(f.size, lang)} · {T("frmPdfNew")}
                </span>
              </div>
              <button type="button" className="btn-danger ds-btn ds-btn--danger ds-btn--sm" onClick={() => onRemoveNew(i)} aria-label={`${T("frmPdfRemove")}: ${f.name}`}>
                <Icon name="trash" size={15} /> {T("frmPdfRemove")}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <button type="button" className="btn-outline ds-btn ds-btn--secondary ds-btn--sm" disabled={total >= MAX_ATTACHMENTS} onClick={() => input.current.click()} aria-describedby={error ? errId : undefined}>
          <Icon name="clip" size={16} /> {T("frmAttachAdd")}
        </button>
      </div>
      <p className="field-hint ds-field-help">{T("frmAttachHint").replace("{n}", String(MAX_ATTACHMENTS)).replace("{mb}", String(maxMb))}</p>
      {error && (
        <p className="field-err ds-field-error" id={errId} role="alert">
          <TriangleAlert size={16} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function Thumb({ kind, url }) {
  const src = kind === "image" ? safeAssetUrl(url) : null;
  return src ? <img className="att-thumb" src={src} alt="" /> : <span className="att-thumb att-icon"><Icon name={kind === "excel" ? "sheet" : "file"} size={22} /></span>;
}

// Thumbnail for a File that is not saved yet; its temporary URL is revoked on change.
function NewThumb({ file }) {
  const [url, setUrl] = useState(null);
  const isImage = file.type.startsWith("image/");
  useEffect(() => {
    if (!isImage) return undefined;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, isImage]);
  return <Thumb kind={isImage ? "image" : "excel"} url={url} />;
}
