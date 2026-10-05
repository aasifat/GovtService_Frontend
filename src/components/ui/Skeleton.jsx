// Design-system loading placeholder. Decorative: hidden from assistive tech;
// the region that is loading should carry aria-busy and a visible/hidden label.
//   variant "text" | "title" | "avatar" | "thumb" | "button" | "badge"
//   lines   for "text": how many lines (the last one is shorter)
//   width   optional CSS width override
// Shimmer is removed under prefers-reduced-motion (see ds-primitives.css).
export default function Skeleton({ variant = "text", lines = 1, width, className = "", style, ...rest }) {
  if (variant === "text" && lines > 1) {
    return (
      <span aria-hidden="true" style={{ display: "block", width }} className={className} {...rest}>
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className="ds-skel ds-skel--text" style={{ width: i === lines - 1 ? "62%" : "100%" }} />
        ))}
      </span>
    );
  }
  return <span aria-hidden="true" className={`ds-skel ds-skel--${variant} ${className}`.trim()} style={{ width, ...style }} {...rest} />;
}
