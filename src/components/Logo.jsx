// Brand mark: green square, red disc -- flag colors, independent of the
// light/dark ticket theme.
// `ds` (Phase 2b): the disc follows the design-system accent token. Without it
// the mark is exactly as before, so pages not migrated yet do not change.
export default function Logo({ size = 34, ds = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#006A4E" />
      <circle cx="18" cy="20" r="9" fill={ds ? "var(--color-accent)" : "#E63946"} />
    </svg>
  );
}
