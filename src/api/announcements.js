// Government announcements. The first group is public (published items only);
// the second is for admins and every function there rejects non-admins with
// ApiError("FORBIDDEN"). Mock mode (default) runs against browser storage; the
// real endpoints are in docs/API_CONTRACT.md.
//
// List results are { items, total, page, pageSize, hasMore }. An announcement is
//   { id, title, summary, issuer: [bn, en], services, type, date, sourceUrl, sample,
//     status, createdAt, updatedAt, updatedBy, hasPdf, pdfUrl, pdfName, pdfSize }
// In mock mode `pdfUrl` of an uploaded file is only filled in by getAnnouncement
// (and the admin write calls): it is a temporary object URL, so call
// releaseAnnouncement() when the page is done with it.
import { USE_MOCK_API } from "./config.js";
import { ApiError } from "./errors.js";
import { mockAnnouncements as m, mockReady } from "./mock/index.js";

const notImplemented = async () => {
  throw new ApiError("NOT_IMPLEMENTED", "Real backend is not connected yet", 501);
};
const ready = (fn) => async (...args) => (await mockReady(), fn(...args));

const names = ["listAnnouncements", "getAnnouncement", "resolveAnnouncements", "listAllAnnouncements", "createAnnouncement", "updateAnnouncement", "setAnnouncementStatus", "deleteAnnouncement", "resetDemoAnnouncements"];
const impl = Object.fromEntries(names.map((n) => [n, USE_MOCK_API ? ready(m[n]) : notImplemented]));

// ---- public ----
export const listAnnouncements = (params) => impl.listAnnouncements(params);
export const getAnnouncement = (id) => impl.getAnnouncement(id);
// Saved items: [{ id, available, announcement }]. An unpublished or deleted
// announcement comes back as available:false instead of an error.
export const resolveAnnouncements = (ids) => impl.resolveAnnouncements(ids);

// ---- admin ----
export const listAllAnnouncements = (params) => impl.listAllAnnouncements(params);
// opts: { attachments: File[] } (Excel / images, up to 5)
export const createAnnouncement = (input, pdfFile, opts) => impl.createAnnouncement(input, pdfFile, opts);
export const updateAnnouncement = (id, patch, pdfFile, opts) => impl.updateAnnouncement(id, patch, pdfFile, opts); // opts: { removePdf, addAttachments: File[], removeAttachmentIds: string[] }
export const setAnnouncementStatus = (id, status) => impl.setAnnouncementStatus(id, status);
export const deleteAnnouncement = (id) => impl.deleteAnnouncement(id);
export const resetDemoAnnouncements = () => impl.resetDemoAnnouncements(); // mock only

// Frees the temporary object URL of an announcement (or a bare URL) returned by
// this module. Safe to call on anything.
export const releaseAnnouncement = (a) => (USE_MOCK_API ? m.release(a) : undefined);
