// Maps an ApiError `code` to the key of the UI string that explains it.
const KEYS = {
  INVALID_CREDENTIALS: "errInvalidCreds",
  EMAIL_TAKEN: "errEmailTaken",
  NOT_IMPLEMENTED: "errNotConnected",
  FORBIDDEN: "errForbidden",
  NOT_FOUND: "errNotFound",
  PAYLOAD_TOO_LARGE: "errPdfTooLarge",
  UNSUPPORTED_MEDIA: "errPdfNotPdf",
  STORAGE_UNAVAILABLE: "errStorage",
};

export function errorKey(err) {
  return KEYS[err && err.code] || "errGeneric";
}
