// Design-system surface: a grouped container. "Cards are selective": use a
// surface for things that benefit from grouping or interaction, not for every
// list item.
//   variant "flat" (hairline only, default) | "raised" | "quiet" | "featured"
//           | "inverse" (deep green band colours) | "overlay" (dialogs, popovers)
//   padding "sm" | "md" (default) | "lg"
//   interactive  hover lift and brand border (for clickable surfaces)
//   as      element or component to render (default "div")
export default function Surface({ as: Tag = "div", variant = "flat", padding = "md", interactive = false, className = "", children, ...rest }) {
  const cls = ["ds-surface", variant !== "flat" ? `ds-surface--${variant}` : "", padding !== "md" ? `ds-surface--pad-${padding}` : "", interactive ? "ds-surface--interactive" : "", className].filter(Boolean).join(" ");
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
