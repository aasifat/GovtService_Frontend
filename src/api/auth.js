// The only auth surface the UI sees. Mock mode (default) runs against
// localStorage; a real backend implements the same signatures over HTTP
// (see docs/API_CONTRACT.md) and is selected with VITE_USE_MOCK_API=false.
import { USE_MOCK_API } from "./config.js";
import { ApiError } from "./errors.js";
import { mockAuth, mockReady } from "./mock/index.js";

const notImplemented = async () => {
  throw new ApiError("NOT_IMPLEMENTED", "Real backend is not connected yet", 501);
};

// Every mock call waits for the one-time demo seeding first.
const ready = (fn) => async (...args) => (await mockReady(), fn(...args));

const impl = USE_MOCK_API
  ? {
      getSession: ready(mockAuth.getSession),
      register: ready(mockAuth.register),
      login: ready(mockAuth.login),
      logout: ready(mockAuth.logout),
      updateProfile: ready(mockAuth.updateProfile),
      deleteAccount: ready(mockAuth.deleteAccount),
    }
  : {
      getSession: async () => null, // no real session endpoint yet: behave as a guest
      register: notImplemented,
      login: notImplemented,
      logout: notImplemented,
      updateProfile: notImplemented,
      deleteAccount: notImplemented,
    };

export const getSession = () => impl.getSession();
export const register = (data) => impl.register(data);
export const login = (data) => impl.login(data);
export const logout = () => impl.logout();
export const updateProfile = (data) => impl.updateProfile(data);
export const deleteAccount = () => impl.deleteAccount();
