// Every API module throws this, never a bare Error, so the UI can branch on a
// stable `code` (and show a translated message) instead of parsing text.
// Codes in use: EMAIL_TAKEN, INVALID_CREDENTIALS, UNAUTHENTICATED, FORBIDDEN,
// NOT_FOUND, VALIDATION, PAYLOAD_TOO_LARGE, UNSUPPORTED_MEDIA, STORAGE_UNAVAILABLE,
// NOT_IMPLEMENTED, NETWORK.
// `details` is optional extra data, e.g. { fields: { titleBn: "errRequired" } }
// for a VALIDATION error.
export class ApiError extends Error {
  constructor(code, message, status, details) {
    super(message || code);
    this.name = "ApiError";
    this.code = code;
    this.status = status || 0;
    this.details = details || null;
  }
}
