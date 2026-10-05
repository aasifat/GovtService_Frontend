import { forwardRef } from "react";

// Design-system button (Phase 1; not used by the existing app yet).
//   variant  "primary" (brass, the one main action) | "secondary" | "ghost" | "danger"
//   size     "md" (44px, default) | "sm" (36px)
//   loading  keeps the button's width, hides the label and shows a spinner;
//            the button is also disabled and aria-busy
//   href     renders an <a> styled as a button
//   iconLeft optional node placed before the label
const Button = forwardRef(function Button({ variant = "primary", size = "md", loading = false, disabled = false, href, iconLeft, className = "", children, type = "button", ...rest }, ref) {
  const cls = ["ds-btn", `ds-btn--${variant}`, size === "sm" ? "ds-btn--sm" : "", className].filter(Boolean).join(" ");
  const content = (
    <>
      {loading && <span className="ds-spinner" aria-hidden="true" />}
      <span className={loading ? "ds-btn-label--hidden" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
        {iconLeft}
        {children}
      </span>
    </>
  );
  if (href && !disabled) {
    return (
      <a ref={ref} className={cls} href={href} aria-busy={loading || undefined} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} className={cls} type={type} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
});

export default Button;
