import { forwardRef, useId, useState } from "react";
import { TriangleAlert } from "lucide-react";
import Icon from "./Icon.jsx";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";

// Labelled text input with an optional hint and an inline error. `error` is
// already-translated text (or null). Pass type="password" to get a show/hide
// button.
//
// Phase 8: used only by the login, register and profile pages. It gains the
// design-system classes (ds-field, ds-input, ds-field-error) next to the legacy ones
// (.field .has-err .field-box .pw-toggle .field-hint .field-err stay), and an error
// is shown with an icon as well as text. Ids, aria-describedby and aria-invalid are
// exactly as before; the error text is the same node content.
const Field = forwardRef(function Field({ label, error, hint, lang, type = "text", ...input }, ref) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPw = type === "password";
  const describedBy = [error && id + "-err", hint && id + "-hint"].filter(Boolean).join(" ") || undefined;

  return (
    <div className={"field ds-field" + (error ? " has-err ds-field--error" : "")}>
      <label className="ds-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="field-box">
        <input id={id} ref={ref} className="ds-input" type={isPw && shown ? "text" : type} aria-invalid={error ? "true" : undefined} aria-describedby={describedBy} {...input} />
        {isPw && (
          <button type="button" className="pw-toggle" onClick={() => setShown((v) => !v)} aria-pressed={shown} aria-label={pick(shown ? UI.hidePassword : UI.showPassword, lang)} title={pick(shown ? UI.hidePassword : UI.showPassword, lang)}>
            <Icon name={shown ? "eyeOff" : "eye"} size={18} />
          </button>
        )}
      </div>
      {hint && !error && (
        <p className="field-hint ds-field-help" id={id + "-hint"}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-err ds-field-error" id={id + "-err"}>
          <TriangleAlert size={16} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

export default Field;
