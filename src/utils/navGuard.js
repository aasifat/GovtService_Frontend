// One optional "are you sure you want to leave?" hook for the hash router.
// A page with unsaved work registers a blocker; App.jsx checks it on every
// hashchange. When a blocker is set, the navigation is undone and the blocker's
// onAttempt(targetHash) is called instead, so the page can ask first and then
// navigate by itself once the person confirms.
let blocker = null;

export const setNavBlocker = (b) => {
  blocker = b;
};
export const getNavBlocker = () => blocker;
