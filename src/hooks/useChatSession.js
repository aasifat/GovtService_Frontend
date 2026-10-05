import { useCallback, useEffect, useRef, useState } from "react";
import * as historyApi from "../api/history.js";
import { blankChat, hasUserMessage, persistIfAuthed, upsertSorted } from "../utils/chatSession.js";

// Owns the one current conversation plus the saved list. Rules:
//  - Guests: the conversation lives in memory only; historyApi is never called.
//  - Signed in: after each completed bot reply the conversation is upserted.
//  - Logging in or out starts a fresh chat. A guest conversation is never
//    silently moved into an account.
export default function useChatSession(user) {
  const userId = user ? user.id : null;
  const [chat, setChat] = useState(() => blankChat());
  const [conversations, setConversations] = useState([]);
  const [listState, setListState] = useState("idle"); // idle | loading | ready | error
  const savedMessages = useRef(null); // messages array last saved/loaded, to avoid re-saving on open
  const prevUser = useRef(userId);
  const chatId = useRef(chat.id);
  chatId.current = chat.id;
  const latestMessages = useRef(chat.messages);
  latestMessages.current = chat.messages;

  // Login / logout boundary.
  useEffect(() => {
    if (prevUser.current === userId) return;
    prevUser.current = userId;
    // The save effect below runs in this same commit with the old chat still in
    // hand. Mark those messages as already handled so a guest conversation is
    // never written into the account that just logged in.
    savedMessages.current = latestMessages.current;
    setChat(blankChat());
  }, [userId]);

  const load = useCallback(() => {
    if (!userId) {
      setConversations([]);
      setListState("idle");
      return () => {};
    }
    let live = true;
    setListState("loading");
    historyApi
      .listConversations()
      .then((list) => {
        if (!live) return;
        setConversations(list);
        setListState("ready");
      })
      .catch(() => live && setListState("error"));
    return () => {
      live = false;
    };
  }, [userId]);
  useEffect(() => load(), [load]);

  // Save after each completed bot reply (and after a rating change).
  useEffect(() => {
    const msgs = chat.messages;
    const last = msgs[msgs.length - 1];
    if (!userId || !last || last.from !== "bot" || !hasUserMessage(msgs) || msgs === savedMessages.current) return;
    const saving = persistIfAuthed({ user, chat, save: historyApi.saveConversation });
    if (!saving) return;
    saving
      .then((saved) => {
        savedMessages.current = msgs;
        setConversations((l) => upsertSorted(l, saved));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.messages, userId]);

  const newChat = useCallback((messages = []) => {
    savedMessages.current = null;
    setChat(blankChat(messages));
  }, []);

  const openConversation = useCallback(
    async (id) => {
      let c = conversations.find((x) => x.id === id);
      if (!c) c = await historyApi.getConversation(id);
      savedMessages.current = c.messages;
      setChat({ id: c.id, createdAt: c.createdAt, title: c.title, messages: c.messages, memo: c.memo || {}, pending: null });
    },
    [conversations]
  );

  const renameConversation = useCallback(async (id, title) => {
    const saved = await historyApi.renameConversation(id, title);
    setConversations((l) => upsertSorted(l, saved));
    if (chatId.current === id) setChat((c) => ({ ...c, title: saved.title }));
  }, []);

  const removeConversation = useCallback(
    async (id) => {
      await historyApi.deleteConversation(id);
      setConversations((l) => l.filter((c) => c.id !== id));
      if (chatId.current === id) newChat();
    },
    [newChat]
  );

  return { chat, setChat, newChat, openConversation, renameConversation, removeConversation, conversations, listState, reload: load, authed: !!userId };
}
