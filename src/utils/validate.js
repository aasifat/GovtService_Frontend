// Form validation for the auth pages. Each function returns null when the
// value is fine, or the key of the UI string to show (see i18n/strings.js).

export const PASSWORD_MIN = 8;

export function validateName(name) {
  return String(name || "").trim() ? null : "errNameRequired";
}

export function validateEmail(email) {
  const v = String(email || "").trim();
  if (!v) return "errEmailRequired";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : "errEmailInvalid";
}

export function validatePassword(password) {
  return String(password || "").length >= PASSWORD_MIN ? null : "errPasswordShort";
}
