// Wires the mock API to the real localStorage, IndexedDB and the Vite env.
// Vite-only: tests build their own db with createMockDb() and never import this file.
import store from "../../utils/storage.js";
import { MAX_PDF_MB } from "../config.js";
import { mbToBytes } from "../../utils/pdfValidate.js";
import { createMockDb } from "./mockDb.js";
import { createMockAuth } from "./mockAuth.js";
import { createMockHistory } from "./mockHistory.js";
import { createMockAnnouncements } from "./mockAnnouncements.js";
import { createIdbFileStore } from "./fileStore.js";

const raw = import.meta.env.VITE_MOCK_LATENCY_MS;
const parsed = raw === undefined || raw === "" ? NaN : Number(raw);

export const mockDb = createMockDb({
  storage: store,
  latencyMs: Number.isFinite(parsed) ? parsed : 200,
});

export const mockAuth = createMockAuth(mockDb);
export const mockHistory = createMockHistory(mockDb);
export const mockAnnouncements = createMockAnnouncements(mockDb, { files: createIdbFileStore(), maxPdfBytes: mbToBytes(MAX_PDF_MB) });
// Seeds the demo accounts and sample announcements lazily, only once mock mode
// is actually used.
let seeding;
export const mockReady = () => (seeding ??= (async () => {
  await mockAuth.seedDemo();
  await mockAnnouncements.seed();
})());
