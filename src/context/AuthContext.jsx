import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.js";

// Auth state for the whole app. `status` is "loading" until the saved session
// has been checked, then "guest" or "authed". Gating in the UI is a
// convenience only; the real backend enforces access (docs/API_CONTRACT.md).
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let live = true;
    authApi
      .getSession()
      .then((u) => {
        if (!live) return;
        setUser(u);
        setStatus(u ? "authed" : "guest");
      })
      .catch(() => live && setStatus("guest"));
    return () => {
      live = false;
    };
  }, []);

  const login = useCallback(async (creds) => {
    const u = await authApi.login(creds);
    setUser(u);
    setStatus("authed");
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const u = await authApi.register(data);
    setUser(u);
    setStatus("authed");
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus("guest");
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const u = await authApi.updateProfile(patch);
    setUser(u);
    return u;
  }, []);

  const deleteAccount = useCallback(async () => {
    await authApi.deleteAccount();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, updateProfile, deleteAccount }),
    [user, status, login, register, logout, updateProfile, deleteAccount]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
