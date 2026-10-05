// Role helpers. The role lives on the user record. In mock mode that record is
// in browser storage, so this check is a UI convenience, NOT security: the real
// server must enforce the role on every admin request (docs/API_CONTRACT.md).
export const isAdmin = (user) => !!user && user.role === "admin";
