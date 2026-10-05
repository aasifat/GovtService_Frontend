// Design-system badge: a short status or category label.
//   variant "neutral" | "brand" | "success" | "warning" | "error" | "accent"
//           ("accent" is the solid flag-red NEW badge)
//   dot     adds a leading dot (used for the "Sample data" badge)
export default function Badge({ variant = "neutral", dot = false, className = "", children, ...rest }) {
  const cls = ["ds-badge", variant !== "neutral" ? `ds-badge--${variant}` : "", className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {dot && <span className="ds-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
