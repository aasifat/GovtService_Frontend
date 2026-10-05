import { CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react";
import Button from "./Button.jsx";

const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleX };

// Design-system toast: a short, non-blocking message.
//   variant  "info" | "success" | "warning" | "error"
//   title    required short heading
//   message  optional detail
//   action   optional { label, onClick } (for example Undo)
//   onClose  when given, shows a close button
// Errors and warnings use role="alert" (announced at once); info and success
// use role="status" (announced politely). Colour is never the only signal:
// every variant has its own icon.
export default function Toast({ variant = "info", title, message, action, onClose, closeLabel = "Dismiss", className = "", ...rest }) {
  const Icon = ICONS[variant] || Info;
  const urgent = variant === "error" || variant === "warning";
  return (
    <div className={`ds-toast ds-toast--${variant} ${className}`.trim()} role={urgent ? "alert" : "status"} {...rest}>
      <Icon className="ds-toast-icon" size={20} aria-hidden="true" />
      <div className="ds-toast-body">
        <p className="ds-toast-title">{title}</p>
        {message && <p className="ds-toast-msg">{message}</p>}
        {action && (
          <div className="ds-toast-action">
            <Button variant="ghost" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          </div>
        )}
      </div>
      {onClose && (
        <button type="button" className="ds-toast-close" onClick={onClose} aria-label={closeLabel}>
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
