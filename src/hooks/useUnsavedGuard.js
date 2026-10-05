import { useCallback, useEffect, useState } from "react";
import { setNavBlocker } from "../utils/navGuard.js";

// Guards a page that has unsaved changes while `dirty` is true:
//  - closing or reloading the tab shows the browser's own warning;
//  - in-app navigation (links and the back button) is held back and reported
//    as `pendingLeave`, so the page can show a confirm dialog.
// `stay` dismisses the dialog; `leave` goes where the person was headed.
export default function useUnsavedGuard(dirty) {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!dirty) return undefined;
    setNavBlocker({ onAttempt: setTarget });
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      setNavBlocker(null);
      window.removeEventListener("beforeunload", warn);
    };
  }, [dirty]);

  const stay = useCallback(() => setTarget(null), []);
  const leave = useCallback(() => {
    const t = target;
    setTarget(null);
    setNavBlocker(null);
    if (t) location.hash = t;
  }, [target]);

  return { pendingLeave: target !== null, stay, leave };
}
