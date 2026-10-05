import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon.jsx";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Modal dialog: labelled, traps Tab inside, closes on Esc or a backdrop click,
// and returns focus to whatever opened it. `children` is the body; put action
// buttons in `footer`.
export default function Dialog({ open, onClose, title, lang, children, footer, busy = false }) {
  const titleId = useId();
  const ref = useRef(null);
  // Latest props live in a ref so the effect below runs only when the dialog
  // opens or closes (an inline onClose would otherwise re-run it on every
  // parent render, stealing focus and recording the wrong opener).
  const live = useRef({ onClose, busy });
  live.current = { onClose, busy };

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const node = ref.current;
    const first = node.querySelector("[data-autofocus]") || node.querySelector(FOCUSABLE);
    (first || node).focus();
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape" && !live.current.busy) {
        e.stopPropagation();
        live.current.onClose();
      } else if (e.key === "Tab") {
        const items = [...node.querySelectorAll(FOCUSABLE)];
        if (!items.length) return e.preventDefault();
        const a = items[0];
        const z = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === a || document.activeElement === node)) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = "";
      if (opener && opener.isConnected) opener.focus();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="dlg-back" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="dlg" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <div className="dlg-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} disabled={busy} aria-label={pick(UI.close, lang)} title={pick(UI.close, lang)}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="dlg-body">{children}</div>
        {footer && <div className="dlg-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
