import { useId } from "react";
import { TriangleAlert } from "lucide-react";

// Labelled single-line or multi-line input with a hint and an inline error tied
// to the control through aria-describedby. `error` is already-translated text.
// The id is derived from `name` so the form can focus a field by id.
//
// Phase 9: used only by the admin announcement form. It gains the design-system classes
// (ds-field, ds-field-label, ds-input, ds-field-help, ds-field-error) next to the legacy
// ones, and an error is shown with an icon as well as text. Ids, names, aria-invalid and
// aria-describedby are exactly as before; the error text is the same node content.
export default function FormField({ name, label, error, hint, multiline = false, className = "", ...input }) {
  const uid = useId();
  const id = `f-${name}`;
  const errId = `${uid}-err`;
  const hintId = `${uid}-hint`;
  const describedBy = [error && errId, hint && hintId].filter(Boolean).join(" ") || undefined;
  const Control = multiline ? "textarea" : "input";
  return (
    <div className={"field ds-field " + className + (error ? " has-err ds-field--error" : "")}>
      <label className="ds-field-label" htmlFor={id}>
        {label}
      </label>
      <Control id={id} name={name} className={"ds-input" + (multiline ? " ds-adm-textarea" : "")} aria-invalid={error ? "true" : undefined} aria-describedby={describedBy} {...input} />
      {hint && (
        <p className="field-hint ds-field-help" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-err ds-field-error" id={errId}>
          <TriangleAlert size={16} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
