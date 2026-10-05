import { useEffect } from "react";

// For popovers (user menu, mobile menu, later the bell): while `open`, Esc and
// a click/tap outside `containerRef` call `onClose`. Esc also returns focus to
// the element that opened the popover (`returnRef`).
export default function useDismiss({ open, onClose, containerRef, returnRef }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        returnRef?.current?.focus();
      }
    };
    const onPointer = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, onClose, containerRef, returnRef]);
}
