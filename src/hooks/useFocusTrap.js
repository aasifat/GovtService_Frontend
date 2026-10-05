import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// For drawers: while `active`, focus moves into `ref`, Tab wraps inside it,
// Esc calls `onEscape` (and does not reach the page), and on deactivation
// focus returns to whatever was focused before.
export default function useFocusTrap(ref, active, onEscape) {
  const esc = useRef(onEscape);
  esc.current = onEscape;

  useEffect(() => {
    if (!active || !ref.current) return undefined;
    const node = ref.current;
    const opener = document.activeElement;
    (node.querySelector("[data-autofocus]") || node.querySelector(FOCUSABLE) || node).focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        esc.current?.();
      } else if (e.key === "Tab") {
        const items = [...node.querySelectorAll(FOCUSABLE)];
        if (!items.length) return e.preventDefault();
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === node)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      if (opener && opener.isConnected) opener.focus();
    };
  }, [active, ref]);
}
