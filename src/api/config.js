// true unless VITE_USE_MOCK_API=false. Everything under src/api/mock/ is only
// reachable when this is true.
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

// Largest PDF the mock accepts, in MB (VITE_MAX_PDF_MB, default 5). A real
// server sets its own limit; the form uses this one for instant feedback.
const mb = Number(import.meta.env.VITE_MAX_PDF_MB);
export const MAX_PDF_MB = Number.isFinite(mb) && mb > 0 ? mb : 5;
