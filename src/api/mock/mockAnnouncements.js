// MOCK announcements, kept in the global `announcements` collection (not per
// user). Uploaded PDFs are blobs in the injected file store (IndexedDB in the
// browser), referenced from the document by key.
//
// ADMIN CHECKS: every admin function calls adminUser(), which reads the session
// user's `role` from browser storage. Anyone can edit that, so this is a
// stand-in, NOT security: a real server must check the role on every request.
//
// VISIBILITY: public functions return published items only. A draft, and its
// PDF, are reachable only by an admin.
//
// Stored document:
//   { id, title, summary, issuer: [bn, en], services: [id], type, date, sourceUrl,
//     sample, status, createdAt, updatedAt, updatedBy,
//     pdf: null | { kind: "static", url, name, size } | { kind: "blob", key, name, size } }
// The API never returns `pdf`; it returns hasPdf / pdfUrl / pdfName / pdfSize.
// Extra files (Excel, images) are `attachments: [{ id, key, name, size, kind, mime }]`
// (up to MAX_ATTACHMENTS); the API returns them as { id, name, size, kind, mime, url }
// without `key`, with `url` filled in only where a PDF url is (see present()).
import { ApiError } from "../errors.js";
import { validateAnnouncementInput } from "../../utils/announcementInput.js";
import { checkPdfFile, sanitizeFileName, mbToBytes, DEFAULT_MAX_PDF_MB, PDF_ERROR_KEY } from "../../utils/pdfValidate.js";
import { inspectAttachmentFile, ATTACH_ERROR_KEY, MAX_ATTACHMENTS } from "../../utils/attachmentValidate.js";
import { filterAnnouncements, byDateDesc, byUpdatedDesc, paginate } from "../../utils/announcementFilters.js";
import { makeSeedAnnouncements } from "../../data/announcements.js";
import { isAdmin } from "../../utils/roles.js";

const defaultUrls = () => ({
  create: (blob) => URL.createObjectURL(blob),
  revoke: (url) => URL.revokeObjectURL(url),
});

export function createMockAnnouncements(db, { files, maxPdfBytes = mbToBytes(DEFAULT_MAX_PDF_MB), now = () => new Date(), urls = defaultUrls() } = {}) {
  if (!files) throw new Error("createMockAnnouncements: a file store is required");
  const col = db.global("announcements");
  const users = db.global("users");

  const currentUser = () => {
    const id = db.getValue("session", null);
    return id ? users.get(id) : null;
  };
  // Guests and normal users both get FORBIDDEN here (a real server answers a
  // guest with 401; the UI treats the two alike).
  function adminUser() {
    const u = currentUser();
    if (!isAdmin(u)) throw new ApiError("FORBIDDEN", "Administrators only", 403);
    return u;
  }

  const notFound = () => new ApiError("NOT_FOUND", "Announcement not found", 404);

  // Internal document -> API shape. Blob URLs are only created on request.
  async function present(doc, { withUrl = false } = {}) {
    const { pdf, attachments = [], ...rest } = doc;
    const atts = await Promise.all(
      attachments.map(async ({ key, ...a }) => {
        let url = null;
        if (withUrl) {
          const blob = await files.get(key);
          url = blob ? urls.create(blob) : null;
        }
        return { ...a, url };
      })
    );
    let pdfUrl = null;
    if (pdf && pdf.kind === "static") pdfUrl = pdf.url;
    else if (pdf && withUrl) {
      const blob = await files.get(pdf.key);
      pdfUrl = blob ? urls.create(blob) : null;
    }
    return { ...rest, attachments: atts, hasPdf: !!pdf, pdfUrl, pdfName: pdf ? pdf.name : null, pdfSize: pdf ? pdf.size : null };
  }
  const presentAll = (docs) => Promise.all(docs.map((d) => present(d)));

  const validationError = (fields) => new ApiError("VALIDATION", "Invalid announcement", 422, { fields });

  // Validates the file first and stores it only after the document is valid.
  async function checkFile(file) {
    const bad = await checkPdfFile(file, maxPdfBytes);
    if (!bad) return;
    if (bad.code === "TOO_LARGE") throw new ApiError("PAYLOAD_TOO_LARGE", "PDF is too large", 413, { fields: { pdf: PDF_ERROR_KEY.TOO_LARGE } });
    throw new ApiError("UNSUPPORTED_MEDIA", "Only PDF files are accepted", 415, { fields: { pdf: PDF_ERROR_KEY[bad.code] } });
  }
  async function storeFile(id, file) {
    // Re-wrapped as application/pdf: the browser-reported type is not trusted.
    const blob = file.slice(0, file.size, "application/pdf");
    const key = `pdf_${id}_${db.newId("f")}`;
    await files.put(key, blob);
    return { kind: "blob", key, name: sanitizeFileName(file.name), size: file.size };
  }
  // Validates every new attachment (type by content, size) and the total count
  // before anything is stored. Returns [{ file, kind, mime }].
  async function checkAttachments(newFiles, keptCount) {
    if (keptCount + newFiles.length > MAX_ATTACHMENTS) throw validationError({ attachments: "errAttachMax" });
    const checked = [];
    for (const file of newFiles) {
      const r = await inspectAttachmentFile(file, maxPdfBytes);
      if (r.error) {
        const fields = { attachments: ATTACH_ERROR_KEY[r.error.code] };
        throw r.error.code === "TOO_LARGE" ? new ApiError("PAYLOAD_TOO_LARGE", "File is too large", 413, { fields }) : new ApiError("UNSUPPORTED_MEDIA", "File type not allowed", 415, { fields });
      }
      checked.push({ file, kind: r.kind, mime: r.mime });
    }
    return checked;
  }
  async function storeAttachment(id, { file, kind, mime }) {
    const key = `att_${id}_${db.newId("f")}`;
    await files.put(key, file.slice(0, file.size, mime)); // stored with the detected type
    return { id: db.newId("a"), key, name: sanitizeFileName(file.name), size: file.size, kind, mime };
  }
  const dropAttachments = (list = []) => Promise.all(list.map((a) => files.delete(a.key)));
  const dropFile = (pdf) => (pdf && pdf.kind === "blob" ? files.delete(pdf.key) : undefined);

  const inputOf = (d) => ({ title: d.title, summary: d.summary, issuer: d.issuer, services: d.services, type: d.type, date: d.date, sourceUrl: d.sourceUrl, status: d.status });

  return {
    // Seeds the sample items once per browser. The flag stops them coming back
    // after an admin deletes everything; use resetDemoAnnouncements for that.
    async seed() {
      if (db.getValue("announcementsSeeded", false)) return;
      db.setValue("announcementsSeeded", true);
      if (!col.all().length) col.replaceAll(makeSeedAnnouncements(now()));
    },

    // ---- public ----

    async listAnnouncements({ service, type, q, page = 1, pageSize = 10 } = {}) {
      await db.delay();
      const rows = filterAnnouncements(col.all(), { service, type, q, status: "published" }).sort(byDateDesc);
      const pg = paginate(rows, page, pageSize);
      return { ...pg, items: await presentAll(pg.items) };
    },

    // Drafts look exactly like missing items to everyone but an admin.
    async getAnnouncement(id) {
      await db.delay();
      const doc = col.get(id);
      if (!doc || (doc.status !== "published" && !isAdmin(currentUser()))) throw notFound();
      return present(doc, { withUrl: true });
    },

    // For saved items: which of these ids can still be opened? Never throws for
    // a missing, unpublished or deleted item.
    async resolveAnnouncements(ids = []) {
      await db.delay();
      return Promise.all(
        [...new Set(ids)].map(async (id) => {
          const doc = col.get(id);
          return doc && doc.status === "published" ? { id, available: true, announcement: await present(doc) } : { id, available: false, announcement: null };
        })
      );
    },

    // Revokes a blob URL this module created (call it when a page is done with one).
    release(announcementOrUrl) {
      const a = announcementOrUrl;
      const list = typeof a === "string" ? [a] : a ? [a.pdfUrl, ...(a.attachments || []).map((x) => x.url)] : [];
      for (const url of list) if (typeof url === "string" && url.startsWith("blob:")) urls.revoke(url);
    },

    // ---- admin ----

    async listAllAnnouncements({ status, service, q, page = 1, pageSize = 10 } = {}) {
      await db.delay();
      adminUser();
      const rows = filterAnnouncements(col.all(), { status, service, q }).sort(byUpdatedDesc);
      const pg = paginate(rows, page, pageSize);
      return { ...pg, items: await presentAll(pg.items) };
    },

    async createAnnouncement(input, pdfFile = null, { attachments: newFiles = [] } = {}) {
      await db.delay();
      const admin = adminUser();
      const { ok, errors, value } = validateAnnouncementInput(input);
      if (!ok) throw validationError(errors);
      if (pdfFile) await checkFile(pdfFile);
      const checked = await checkAttachments(newFiles, 0);
      const id = db.newId("ann");
      const stamp = now().toISOString();
      const pdf = pdfFile ? await storeFile(id, pdfFile) : null;
      const attachments = [];
      for (const c of checked) attachments.push(await storeAttachment(id, c));
      const doc = col.put({ id, ...value, sample: false, createdAt: stamp, updatedAt: stamp, updatedBy: admin.id, pdf, attachments });
      return present(doc, { withUrl: true });
    },

    // `patch` holds any of the input fields; the rest keep their value. A new
    // file replaces the old one; removePdf drops it (a new file wins over it).
    // addAttachments: new Files; removeAttachmentIds: ids of attachments to drop.
    async updateAnnouncement(id, patch = {}, pdfFile = null, { removePdf = false, addAttachments = [], removeAttachmentIds = [] } = {}) {
      await db.delay();
      const admin = adminUser();
      const cur = col.get(id);
      if (!cur) throw notFound();
      const { ok, errors, value } = validateAnnouncementInput({ ...inputOf(cur), ...patch });
      if (!ok) throw validationError(errors);
      if (pdfFile) await checkFile(pdfFile);
      const dropped = (cur.attachments || []).filter((a) => removeAttachmentIds.includes(a.id));
      const kept = (cur.attachments || []).filter((a) => !removeAttachmentIds.includes(a.id));
      const checked = await checkAttachments(addAttachments, kept.length);
      let pdf = cur.pdf;
      if (pdfFile) pdf = await storeFile(id, pdfFile);
      else if (removePdf) pdf = null;
      const added = [];
      for (const c of checked) added.push(await storeAttachment(id, c));
      const doc = col.put({ ...cur, ...value, pdf, attachments: [...kept, ...added], updatedAt: now().toISOString(), updatedBy: admin.id });
      if (pdf !== cur.pdf) await dropFile(cur.pdf); // only after the new state is saved
      await dropAttachments(dropped);
      return present(doc, { withUrl: true });
    },

    async setAnnouncementStatus(id, status) {
      await db.delay();
      const admin = adminUser();
      const cur = col.get(id);
      if (!cur) throw notFound();
      if (status !== "draft" && status !== "published") throw validationError({ status: "errRequired" });
      const doc = col.put({ ...cur, status, updatedAt: now().toISOString(), updatedBy: admin.id });
      return present(doc);
    },

    async deleteAnnouncement(id) {
      await db.delay();
      adminUser();
      const cur = col.get(id);
      if (!cur) throw notFound();
      col.remove(id);
      await dropFile(cur.pdf);
      await dropAttachments(cur.attachments);
    },

    // MOCK ONLY: throws away every announcement (and uploaded file) and loads
    // the sample items again.
    async resetDemoAnnouncements() {
      await db.delay();
      adminUser();
      for (const d of col.all()) {
        await dropFile(d.pdf);
        await dropAttachments(d.attachments);
      }
      col.replaceAll(makeSeedAnnouncements(now()));
      db.setValue("announcementsSeeded", true);
    },
  };
}
