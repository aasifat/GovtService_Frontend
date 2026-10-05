> **How to use:** copy this file to `docs/PHASE_G.md` in the project, make a backup or commit of the current state, open a **new** conversation in Claude Code, and send:
> **"Read @docs/PHASE_G.md and execute it. Stop when done so I can review."**
> Everything below this line is the prompt.

---

# Task: Phase G for Amar Sheba (frontend only): admin management of government announcements

## Context

Phases A to F are finished. The app has a mock API layer (`src/api/`, with a localStorage-backed mock behind swappable modules), `AuthContext`, optional login, chat history, a public announcements section, reminders, saved items, `docs/API_CONTRACT.md` and `docs/PHASE2_NOTES.md`. Announcements are currently a static seed list (`src/data/announcements.js`) that is read through `src/api/announcements.js`, with PDFs served from `public/announcements/`.

Phase G lets an **admin** create, edit, publish/unpublish and delete announcements, including attaching a PDF, from inside the site. There is still **no backend**: this is built against the mock API, and the contract for the real server is written down so the backend can be built from it later.

**I have not seen the code Claude Code produced in Phases A to F, so file names below are best guesses.** Before writing anything, read the current code and the two docs above, then follow the names and conventions that actually exist. Where this document names a file or function that doesn't exist, use the equivalent and note it in `docs/PHASE_G_NOTES.md`. Candidates to read first: `src/api/announcements.js` and its mock, `src/api/mock/mockDb.js`, `src/api/auth.js` and its mock, `src/context/AuthContext.jsx`, `src/components/RequireLogin.jsx`, `src/components/Header.jsx`, `src/pages/` (announcement pages), `src/data/announcements.js`, `src/utils/route.js`, `src/i18n/strings.js`, `tests/`.

## Rules that still apply from Phase 2

Mock API behind async signatures; per-feature CSS file; `[bangla, english]` string pairs through `pick()`; no hard-coded user-facing text; `--page-ink` / `--page-muted` for text directly on the page background; check both themes, both languages, 390 px and 1280 px; new icons only through the `Icon.jsx` map (confirm the lucide name exists); no new dependencies; hash router; tests in `node --test` against pure modules with an injected `Map` storage; `npm run build` and `npm test` must pass. The existing tests must keep passing.

## Requirements

### 1. Admin role

- Add `role: "user" | "admin"` to the user model. Existing users default to `"user"`.
- Seed one admin on first load in mock mode: `admin@amarsheba.test` / `Admin1234!`. Show it in a small "Demo admin account" hint on the login page **only in mock mode**.
- `register()` and `updateProfile()` must ignore any `role` the caller sends. Nobody becomes an admin through the UI.
- Add `isAdmin(user)` and a `RequireAdmin` guard component. Guests get the login prompt (with `next`). Signed-in non-admins get a clear "You don't have access to this page" screen.
- Comment in the mock that this role lives in browser storage, so it can be edited by anyone and is **not security**; real enforcement is server-side.

### 2. Announcements become data, not a static file

- Move announcements into a mock-db collection (global, not per user). On first load, seed it from the existing static seed, guarded by a persistent `seeded` flag so that an admin deleting everything does not bring the seeds back on reload.
- Extend the model: `status: "draft" | "published"`, `createdAt`, `updatedAt`, `updatedBy` (user id), plus `pdfUrl`, `pdfName`, `pdfSize` returned by the API (how the mock produces `pdfUrl` is internal). Existing seeds become `published`.
- Public functions (`listAnnouncements`, `getAnnouncement`, the "Latest notices" block on guide pages, saved items) return **published items only**. A draft must be invisible to guests and to normal users, including by direct URL (show the normal not-found state).
- Add admin functions to the announcements API; each checks the session and throws `ApiError("FORBIDDEN")` for non-admins:
  `listAllAnnouncements({status, service, q, page, pageSize})`, `createAnnouncement(input, pdfFile?)`, `updateAnnouncement(id, patch, pdfFile?, {removePdf})`, `setAnnouncementStatus(id, status)`, `deleteAnnouncement(id)`, `resetDemoAnnouncements()` (mock only).
- If an announcement that people have saved gets unpublished or deleted, the Saved items list must handle it gracefully (show "no longer available" with a remove button, not a crash).

### 3. PDF handling in the mock

- Store uploaded PDFs as blobs in **IndexedDB** (localStorage is too small), behind an injectable file-store adapter (`put`, `get`, `delete`) with a `Map` implementation for tests. Create object URLs when reading and revoke them when no longer needed.
- Validation, in one pure module so it can be tested:
  - the file's first bytes must be `%PDF-` (do not trust the extension or the browser-reported MIME type alone);
  - maximum size **5 MB** in the mock (configurable with `VITE_MAX_PDF_MB`), with a clear bilingual message;
  - display name sanitized (strip path parts and control characters, limit length);
  - one PDF per announcement; replacing or removing deletes the old blob.
- Deleting an announcement deletes its blob.
- A draft's PDF must not be reachable through public functions.

### 4. Admin screens

Routes (all behind `RequireAdmin`): `#/admin/announcements`, `#/admin/announcements/new`, `#/admin/announcements/<id>/edit`. Add `parseHash` tests for them. The avatar menu shows **Manage announcements** for admins only.

**List page:** a table on desktop and cards on mobile with title (in the current language), service tags, type, publish date, a status chip (Draft / Published), a "PDF" indicator, and actions: Edit, Publish/Unpublish, Delete (confirm dialog that names the item). Filters: status, service, search. Newest-updated first, with pagination or "Load more". An empty state with a "New announcement" button. A **Reset demo data** button (mock mode only, behind a confirm) that restores the seeds.

**Form page (create and edit):**
- Title, summary and issuer, each in **both** Bangla and English (all required).
- Services: multi-select over the 7 services (at least one).
- Type: notice, gazette, circular, deadline, press.
- Published date (`YYYY-MM-DD`, defaults to today).
- Source link (optional): accept only `http:` or `https:` URLs. Reject `javascript:` and every other scheme, here and when rendering it anywhere in the app.
- PDF: a drop zone that is also a keyboard-operable file button; shows file name and size; Replace and Remove; a link to preview the attached file.
- Status: **Save as draft** and **Publish** buttons. Editing a published item has **Save changes** and **Unpublish**.
- Inline bilingual validation with errors tied to inputs (`aria-describedby`), a saving state, and a success message that links to the public page.
- A "leave without saving?" warning when the form has unsaved changes.
- A small live preview of how the card will look on the public list.

### 5. Contract and docs

Extend `docs/API_CONTRACT.md` with the admin endpoints the real server must provide:
`GET /api/admin/announcements`, `POST /api/admin/announcements` (`multipart/form-data`: JSON fields plus the PDF), `PUT /api/admin/announcements/<id>`, `PATCH /api/admin/announcements/<id>/status`, `DELETE /api/admin/announcements/<id>`, and how public clients fetch PDFs. For each: request and response JSON, and status codes (`401`, `403`, `404`, `413`, `415`, `422`). State the server-side rules the frontend cannot enforce: the role check on every request; PDF content-type and magic-byte validation; size limit; random storage file names; files stored outside the web root and served with the correct `Content-Type` and `Content-Disposition`; draft files not publicly reachable; an audit trail of who changed what. Add a note, clearly marked as future backend work: on publish, extract the PDF text, chunk it and index it into the RAG store with metadata (service ids, published date, source), and re-index or remove it on edit, unpublish or delete.

Update `README.md` (admin account, routes, mock limitations) and write `docs/PHASE_G_NOTES.md` (decisions, name mismatches, anything unverified).

### 6. Tests (`node --test`, no DOM)

- Admin guard: create, update, delete, status change and `listAllAnnouncements` throw `FORBIDDEN` for guests and normal users; `register()` cannot set `role`.
- Visibility: drafts never appear in public functions; publish and unpublish change visibility; a direct `getAnnouncement` of a draft fails for non-admins.
- PDF validation: real `%PDF-` bytes pass; a text file renamed to `.pdf` fails; oversize fails; odd file names are sanitized.
- URL validation: `https://example.com` passes; `javascript:alert(1)`, `data:` and `ftp:` fail.
- CRUD persists across a simulated reload (re-create the db on the same storage); delete removes the blob; replacing a PDF removes the old blob.
- Seeding runs once and is not repeated after the admin deletes all items; `resetDemoAnnouncements` restores them.
- A saved item pointing at an unpublished or deleted announcement is reported as unavailable rather than throwing.

## Out of scope

Real file upload to a server; real authentication; a user-management or multi-role UI; scheduled publishing; a rich-text editor; image attachments; versioning or an audit-log screen; analytics; implementing RAG indexing (document it only).

## Definition of done

- Signed in as the demo admin, I can create a draft with a PDF, see it is invisible to a guest, publish it, see it in the public list and in the guide page's notice block, edit it, unpublish it, and delete it.
- A guest and a normal user cannot reach any admin route or admin function.
- Invalid PDFs and bad URLs are rejected with clear messages in both languages.
- `npm run build` and `npm test` pass, including all earlier tests.
- Both themes and both widths checked; keyboard-only pass over the form and the delete dialog.

## When you finish, report

1. What was built, and the commit hash if you committed.
2. Differences from this document and why.
3. Anything you could not verify.
4. Exact steps to try it: how to log in as admin and create a notice.
