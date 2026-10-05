# API contract (frontend to backend)

Status: **Phases A, B and G** (auth and roles, chat history, announcements with admin management). Sections for reminders and saved items are added as those phases land.

The frontend talks to the backend only through `src/api/<name>.js`. Today each
module runs against a mock in `src/api/mock/` (`localStorage`). A real backend
implements the same async signatures over HTTP; select it with
`VITE_USE_MOCK_API=false`.

## Conventions

- JSON bodies, UTF-8. Dates: `YYYY-MM-DD` for due dates, full ISO 8601 for timestamps.
- **Auth model:** an httpOnly, `Secure`, `SameSite=Lax` session cookie set by `POST /api/auth/login` and `/register`. The browser sends it with `credentials: "include"`. The frontend never sees the token.
- **`401`** on a missing or expired session. The frontend treats it as "signed out" and shows the guest UI.
- **Errors** use one shape; `code` is stable and is what the UI branches on (`ApiError.code` in `src/api/errors.js`):

  ```json
  { "error": { "code": "EMAIL_TAKEN", "message": "Email already registered" } }
  ```

- **Gating is UX only.** The frontend hides or replaces features for guests (history, saving, reminders, PDF download), but that is a convenience, not a security measure. The backend must enforce every one of these rules itself, per user, on every request.
- The mock hashes passwords with PBKDF2 in the browser purely so they are not stored in plain text. It has no real security. The backend must hash server-side (for example argon2id or bcrypt) and must never accept or return a password hash.

## Auth

`User` = `{ id, name, email, lang: "bn" | "en", role: "user" | "admin", createdAt }`

`role` is set only by the server. `register` and `updateProfile` must ignore any `role` the client sends; admins are created out of band (seed, console, or an internal tool). The mock keeps the role in browser storage, where anyone can edit it; that is not security.

| Function | Endpoint | Request | Success | Errors |
|---|---|---|---|---|
| `getSession()` | `GET /api/auth/session` | cookie | `200` `User`, or `200` `null` when signed out (a `401` is also treated as signed out) | none |
| `register({name, email, password, lang})` | `POST /api/auth/register` | `{ name, email, password, lang }` | `201` `User` and sets the session cookie | `409 EMAIL_TAKEN`, `422 VALIDATION` (name required, valid email, password >= 8 chars) |
| `login({email, password})` | `POST /api/auth/login` | `{ email, password }` | `200` `User` and sets the session cookie | `401 INVALID_CREDENTIALS` (same response for unknown email and wrong password) |
| `logout()` | `POST /api/auth/logout` | cookie | `204`, clears the cookie | none |
| `updateProfile({name, lang})` | `PATCH /api/auth/profile` | `{ name?, lang? }` | `200` `User` | `401`, `422 VALIDATION` |
| `deleteAccount()` | `DELETE /api/auth/account` | cookie | `204`, clears the cookie. Must also delete the user's chats, reminders and saved items. | `401` |

Notes:

- Emails are compared case-insensitively and trimmed; store them normalised.
- Email is not changeable in the UI, so there is no endpoint for it.
- Password reset is out of scope for the demo.

## Service ids

The frontend uses these ids (`src/data/services.js`): `nid`, `passport`,
`driving`, `landtax`, `gd`, `ereturn`, `edu`.

The RAG service uses different ids (for example `nid_registration`,
`nid_correction`, `driving_license`, `online_gd`,
`education_certificate_correction`). A mapping between the two is needed when
the services are connected.

TODO: confirm with backend. The full list of RAG service ids has not been seen,
so no mapping is guessed here.

## Chat history

All endpoints need the session cookie (`401` otherwise) and only ever return the caller's own conversations. Guests have no history: the frontend does not call these for guests, and the backend must still reject them.

`Conversation` = `{ id, title, createdAt, updatedAt, memo, messages: [...] }`. `messages` are the objects the chat already renders (`from`, `text`, optional `list`, `table`, `sources`, `suggestions`, `rated`, ...). Treat them as opaque JSON.

| Function | Endpoint | Request | Success | Errors |
|---|---|---|---|---|
| `listConversations()` | `GET /api/conversations` | none | `200` `Conversation[]`, newest `updatedAt` first | `401` |
| `getConversation(id)` | `GET /api/conversations/{id}` | none | `200` `Conversation` | `401`, `404 NOT_FOUND` |
| `saveConversation(conv)` | `PUT /api/conversations/{id}` | `{ title, createdAt, memo, messages }` | `200` `Conversation`. Upsert: the server keeps the first `createdAt` and sets `updatedAt` to now. | `401`, `422 VALIDATION` |
| `renameConversation(id, title)` | `PATCH /api/conversations/{id}` | `{ title }` | `200` `Conversation`. Does **not** change `updatedAt`. | `401`, `404`, `422 VALIDATION` (blank title) |
| `deleteConversation(id)` | `DELETE /api/conversations/{id}` | none | `204` | `401`, `404 NOT_FOUND` |

Notes: the client generates the `id` (`c_...`) on the first message and saves after every completed bot reply, so `PUT` must be idempotent. Titles are derived client-side (first user message, 40 characters). A conversation is only saved once it has at least one user message.

## Announcements

`Announcement` =

```json
{
  "id": "ann_x1",
  "title": ["bn", "en"], "summary": ["bn", "en"], "issuer": ["bn", "en"],
  "services": ["nid", "passport"],
  "type": "notice | gazette | circular | deadline | press",
  "date": "2026-09-29",
  "sourceUrl": "https://example.gov.bd/notice",
  "sample": false,
  "status": "draft | published",
  "createdAt": "ISO", "updatedAt": "ISO", "updatedBy": "<user id>",
  "hasPdf": true, "pdfUrl": "/files/announcements/<id>.pdf", "pdfName": "notice.pdf", "pdfSize": 123456,
  "attachments": [ { "id": "a_1", "name": "fees.xlsx", "size": 20480, "kind": "excel | image", "mime": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "url": "/files/announcements/a_1" } ]
}
```

`services` uses the frontend service ids (see "Service ids" above). `sourceUrl` is `""` or an `http:`/`https:` URL. `attachments` are extra files besides the PDF: Excel workbooks (`.xlsx`, `.xls`) and images (`.png`, `.jpg`/`.jpeg`, `.gif`, `.webp`), at most 5 per announcement. List responses are `{ items, total, page, pageSize, hasMore }`.

### Public (no login)

| Function | Endpoint | Success | Errors |
|---|---|---|---|
| `listAnnouncements({service, type, q, page, pageSize})` | `GET /api/announcements?service=&type=&q=&page=&pageSize=` | `200` list of **published** items, newest `date` first. `q` matches title, summary and issuer in both languages. | none |
| `getAnnouncement(id)` | `GET /api/announcements/{id}` | `200` `Announcement` | `404 NOT_FOUND` for a missing item **and for a draft** (admins may read drafts) |
| `resolveAnnouncements(ids)` | `POST /api/announcements/resolve` `{ ids }` | `200` `[{ id, available, announcement }]`. Unpublished or deleted ids come back `available: false`, never an error. For saved items. | `422` |

**Public PDFs.** `pdfUrl` is a stable URL the browser can use in an `<object>`/`<iframe>` and as a link. Viewing is open to everyone for published items. "Download PDF" is a login-only action in the UI; the server decides whether to enforce that (for example a separate `GET /api/announcements/{id}/pdf?download=1` that requires a session and answers `401`). The mock returns `pdfUrl` only from `getAnnouncement` (a temporary object URL); a real server should return it in list results too. A draft's file must not be reachable by anyone but admins (`404`).

### Admin (role `admin` required on every request)

Every endpoint below answers `401` without a session and `403 FORBIDDEN` for a signed-in non-admin. (The mock answers both with `FORBIDDEN`; the UI treats them alike.)

| Function | Endpoint | Request | Success | Errors |
|---|---|---|---|---|
| `listAllAnnouncements({status, service, q, page, pageSize})` | `GET /api/admin/announcements?status=&service=&q=&page=&pageSize=` | none | `200` list including drafts, newest `updatedAt` first | `401`, `403` |
| `createAnnouncement(input, pdfFile?)` | `POST /api/admin/announcements` | `multipart/form-data`: part `data` = JSON `{ title, summary, issuer, services, type, date, sourceUrl, status }`, optional file part `pdf`, optional repeated file part `attachments` | `201` `Announcement` | `401`, `403`, `413` PDF too large, `415` not a PDF, `422 VALIDATION` |
| `updateAnnouncement(id, patch, pdfFile?, {removePdf})` | `PUT /api/admin/announcements/{id}` | `multipart/form-data`: `data` = JSON of the fields to change plus optional `removePdf: true`; optional file part `pdf` (replaces the old file and wins over `removePdf`), repeated file part `attachments` (added), `removeAttachmentIds: [..]` inside `data` | `200` `Announcement` | `401`, `403`, `404`, `413`, `415`, `422` |
| `setAnnouncementStatus(id, status)` | `PATCH /api/admin/announcements/{id}/status` | `{ "status": "draft" or "published" }` | `200` `Announcement` | `401`, `403`, `404`, `422` |
| `deleteAnnouncement(id)` | `DELETE /api/admin/announcements/{id}` | none | `204`; also deletes the stored PDF | `401`, `403`, `404` |

`422 VALIDATION` carries field errors so the form can show them inline:

```json
{ "error": { "code": "VALIDATION", "message": "Invalid announcement", "fields": { "titleBn": "required", "services": "min_one", "sourceUrl": "scheme" } } }
```

(The mock returns UI string keys such as `errRequired` in `details.fields`; a real server should return stable machine codes and the frontend maps them.) Rules: `title`, `summary`, `issuer` need both languages (max 200 / 1000 / 200 characters); `services` at least one valid id; `type` one of the five; `date` a real `YYYY-MM-DD`; `sourceUrl` empty or `http:`/`https:` only.

`resetDemoAnnouncements()` exists in the mock only and has **no** endpoint.

### What the server must enforce (the frontend cannot)

- The **role check on every admin request**, from the server-side session. Never trust a role, id or status sent by the client; `updatedBy` comes from the session.
- **PDF validation on the server**: check the real content (first bytes `%PDF-`), not only the extension or the client's `Content-Type`; answer `415` otherwise. Enforce a size limit (the mock uses 5 MB, `VITE_MAX_PDF_MB`) and answer `413`. One PDF per announcement. Attachments: allow only the extensions above, require the first bytes to match (PNG `89 50 4E 47`, JPEG `FF D8 FF`, GIF `GIF87a/GIF89a`, WebP `RIFF....WEBP`, XLSX `PK 03 04`, XLS `D0 CF 11 E0 A1 B1 1A E1`), cap the count at 5 (`422`) and the size per file (`413`/`415`). **Do not accept** `.svg` (scripts), `.xlsm`/`.xlsb` (macros) or `.csv`. For `.xlsx` also open the zip server-side and confirm it is a workbook (the frontend only checks the zip signature), and never serve uploads as HTML; images get `Content-Type` from the detected type with `nosniff`, Excel is served as `attachment` only.
- Store files under **random names** (for example a UUID), never the uploaded name; keep the sanitised display name in the database only (no path parts, control or bidi characters, length-limited).
- Store files **outside the web root**. Serve them through the application with the correct `Content-Type: application/pdf`, `X-Content-Type-Options: nosniff` and a `Content-Disposition` (`inline` for preview, `attachment` for download). Never serve user-supplied HTML or let the browser guess a type.
- **Draft files are not publicly reachable**: no guessable URL; answer `404` unless the caller is an admin.
- Re-validate `sourceUrl` (scheme) and escape all text on output.
- An **audit trail**: who created, edited, published, unpublished or deleted what, and when (user id, action, announcement id, timestamp).

### Future backend work: RAG indexing (not built, document only)

When an announcement is **published** and has a PDF, the backend should extract the PDF text, chunk it, and index the chunks into the RAG store with metadata (announcement id, service ids, published date, source). On **edit**, re-index (remove the old chunks first); on **unpublish** or **delete**, remove the chunks so the assistant stops citing them. Drafts are never indexed.

## Later phases

Reminders and notifications (`/api/reminders`, `/api/notifications/read`) and saved items (`/api/saved`) are documented as each is built.
