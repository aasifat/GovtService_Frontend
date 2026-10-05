// MOCK chat history, stored per user under amar-sheba:u:<userId>:conversations.
// Every call needs a signed-in session (UNAUTHENTICATED otherwise): guests have
// no history, and the mock never writes anything for them.
import { ApiError } from "../errors.js";

export function createMockHistory(db) {
  function col() {
    const userId = db.getValue("session", null);
    if (!userId) throw new ApiError("UNAUTHENTICATED", "Log in to use chat history", 401);
    return db.user(userId, "conversations");
  }
  const byNewest = (a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0);

  return {
    async listConversations() {
      await db.delay();
      return col().all().sort(byNewest);
    },

    async getConversation(id) {
      await db.delay();
      const c = col().get(id);
      if (!c) throw new ApiError("NOT_FOUND", "Conversation not found", 404);
      return c;
    },

    // Upsert. createdAt is kept from the first save; updatedAt is set here.
    async saveConversation(conv) {
      await db.delay();
      const c = col();
      if (!conv || !conv.id) throw new ApiError("VALIDATION", "Conversation id is required", 422);
      const prev = c.get(conv.id);
      const now = new Date().toISOString();
      return c.put({
        id: conv.id,
        title: String(conv.title || "").trim() || "Untitled",
        createdAt: prev ? prev.createdAt : conv.createdAt || now,
        updatedAt: now,
        memo: conv.memo || {},
        messages: conv.messages || [],
      });
    },

    async renameConversation(id, title) {
      await db.delay();
      const c = col();
      const cur = c.get(id);
      if (!cur) throw new ApiError("NOT_FOUND", "Conversation not found", 404);
      const t = String(title || "").trim();
      if (!t) throw new ApiError("VALIDATION", "Title is required", 422);
      // Renaming is not new activity, so updatedAt (the sort key) is untouched.
      return c.put({ ...cur, title: t });
    },

    async deleteConversation(id) {
      await db.delay();
      if (!col().remove(id)) throw new ApiError("NOT_FOUND", "Conversation not found", 404);
    },
  };
}
