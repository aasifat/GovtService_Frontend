import { useEffect, useId, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import Icon from "./Icon.jsx";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";
import { formatBytes } from "../utils/pdfValidate.js";
import { safeAssetUrl } from "../utils/safeUrl.js";

// PDF picker for the announcement form: a drop zone that is also a real button
// (so it works with the keyboard), the current file's name and size, Replace,
// Remove, and a preview link.
//
//   file      File chosen in this form (not saved yet), or null
//   existing  { name, size, url } of the file already attached on the server, or null
//   removed   true when the existing file is marked for removal
//   error     already-translated error text for the last rejected file
// The parent owns the state and does the validation (onPick gets a File).
// Phase 9: used only by the admin form; gains design-system classes next to the legacy ones
// (.pdf-field .pdf-label .pdf-zone .pdf-file .pdf-meta .pdf-btns .field-hint .field-err stay).
export default function PdfDropzone({ lang, file, existing, removed, error, maxMb, onPick, onRemove, onUndoRemove }) {
  const T = (k) => pick(UI[k], lang);
  const id = useId();
  const input = useRef(null);
  const [over, setOver] = useState(false);

  // Preview URL for a file that is not saved yet; revoked when it changes.
  const [localUrl, setLocalUrl] = useState(null);
  useEffect(() => {
    if (!file) return setLocalUrl(null);
    const u = URL.createObjectURL(file);
    setLocalUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const shown = file ? { name: file.name, size: file.size, url: localUrl, fresh: true } : existing && !removed ? { ...existing, fresh: false } : null;
  const errId = `${id}-err`;
  const open = () => input.current && input.current.click();
  const take = (f) => f && onPick(f);

  return (
    <div className="pdf-field">
      <span className="pdf-label ds-field-label" id={`${id}-label`}>
        {T("frmPdf")}
      </span>
      <div
        className={"pdf-zone ds-admf-zone" + (over ? " over" : "") + (error ? " has-err" : "")}
        role="group"
        aria-labelledby={`${id}-label`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files && e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={input}
          id={id}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          tabIndex={-1}
          onChange={(e) => {
            take(e.target.files && e.target.files[0]);
            e.target.value = ""; // picking the same file again must still fire
          }}
        />
        {shown ? (
          <div className="pdf-file">
            <Icon name="file" size={22} />
            <div className="pdf-meta">
              <b dir="ltr">{shown.name}</b>
              <span>
                {shown.size ? formatBytes(shown.size, lang) : ""}
                {shown.fresh ? ` · ${T("frmPdfNew")}` : ""}
              </span>
            </div>
            <div className="pdf-btns">
              {safeAssetUrl(shown.url) && (
                <a className="btn-text ds-btn ds-btn--ghost ds-btn--sm" href={safeAssetUrl(shown.url)} target="_blank" rel="noopener noreferrer">
                  {T("frmPdfPreview")} <Icon name="ext" size={14} />
                </a>
              )}
              <button type="button" className="btn-outline ds-btn ds-btn--secondary ds-btn--sm" onClick={open} aria-describedby={error ? errId : undefined}>
                <Icon name="upload" size={16} /> {T("frmPdfReplace")}
              </button>
              <button type="button" className="btn-danger ds-btn ds-btn--danger ds-btn--sm" onClick={onRemove}>
                <Icon name="trash" size={16} /> {T("frmPdfRemove")}
              </button>
            </div>
          </div>
        ) : (
          <div className="pdf-empty">
            <Icon name="upload" size={24} />
            <p>{removed ? T("frmPdfWillRemove") : T("frmPdfDrop")}</p>
            <div className="pdf-btns">
              <button type="button" className="btn-outline ds-btn ds-btn--secondary ds-btn--sm" onClick={open} aria-describedby={error ? errId : undefined}>
                {T("frmPdfChoose")}
              </button>
              {removed && (
                <button type="button" className="btn-text ds-btn ds-btn--ghost ds-btn--sm" onClick={onUndoRemove}>
                  {T("frmPdfUndo")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="field-hint ds-field-help">{T("frmPdfLimit").replace("{mb}", String(maxMb))}</p>
      {error && (
        <p className="field-err ds-field-error" id={errId} role="alert">
          <TriangleAlert size={16} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
