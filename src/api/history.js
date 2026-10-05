// Chat history for signed-in users. Guests never reach this module: the chat
// session hook only calls it when there is a user. Mock mode (default) stores
// per-user data in localStorage; see docs/API_CONTRACT.md for the real endpoints.
import { USE_MOCK_API } from "./config.js";
import { ApiError } from "./errors.js";
import { mockHistory, mockReady } from "./mock/index.js";

const notImplemented = async () => {
  throw new ApiError("NOT_IMPLEMENTED", "Real backend is not connected yet", 501);
};
const ready = (fn) => async (...args) => (await mockReady(), fn(...args));
const impl = USE_MOCK_API
  ? {
      listConversations: ready(mockHistory.listConversations),
      getConversation: ready(mockHistory.getConversation),
      saveConversation: ready(mockHistory.saveConversation),
      renameConversation: ready(mockHistory.renameConversation),
      deleteConversation: ready(mockHistory.deleteConversation),
    }
  : { listConversations: notImplemented, getConversation: notImplemented, saveConversation: notImplemented, renameConversation: notImplemented, deleteConversation: notImplemented };

export const listConversations = () => impl.listConversations();
export const getConversation = (id) => impl.getConversation(id);
export const saveConversation = (conv) => impl.saveConversation(conv);
export const renameConversation = (id, title) => impl.renameConversation(id, title);
export const deleteConversation = (id) => impl.deleteConversation(id);
