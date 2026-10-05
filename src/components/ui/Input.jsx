import { forwardRef, useId } from "react";
import { TriangleAlert } from "lucide-react";

// Design-system text input with a persistent label above, optional helper text
// and an inline error. The error is announced and tied to the control with
// aria-describedby; colour is never the only signal (icon + text).
//   label  string (required for accessibility)
//   help   helper text shown while there is no error
//   error  already-translated error text, or falsy
const Input = forwardRef(function Input({ label, help, error, className = "", id, ...rest }, ref) {
  const uid = useId();
  const inputId = id || `ds-in-${uid}`;
  const helpId = `${inputId}-help`;
  const errId = `${inputId}-err`;
  const describedBy = [error && errId, help && !error && helpId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={"ds-field" + (error ? " ds-field--error" : "") + (className ? " " + className : "")}>
      <label className="ds-field-label" htmlFor={inputId}>
        {label}
      </label>
      <input ref={ref} id={inputId} className="ds-input" aria-invalid={error ? "true" : undefined} aria-describedby={describedBy} {...rest} />
      {help && !error && (
        <p className="ds-field-help" id={helpId}>
          {help}
        </p>
      )}
      {error && (
        <p className="ds-field-error" id={errId}>
          <TriangleAlert size={16} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

export default Input;
