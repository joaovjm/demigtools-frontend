import { useEffect, useState, useRef, useContext } from "react";
import { getInternalConversations } from "../helper/getInternalConversations";
import { getInternalMessages } from "../helper/getInternalMessages";
import { markInternalMessagesRead } from "../helper/markInternalMessagesRead";
import supabase from "../helper/superBaseClient";
import { UserContext } from "../context/UserContext";

export function useInternalChat() {
  const { operatorData } = useContext(UserContext);
  const operatorCodeId = operatorData?.operator_code_id;
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const loadedRef = useRef(false);

  const loadConversations = async () => {
    if (!operatorCodeId) return [];
    const data = await getInternalConversations(operatorCodeId);
    setConversations(data);
    return data;
  };

  const loadMessages = async (convId) => {
    if (!convId) {
      setMessages([]);
      return [];
    }
    const data = await getInternalMessages(convId);
    setMessages(data);
    return data;
  };

  useEffect(() => {
    if (!operatorCodeId) return;
    loadConversations();
  }, [operatorCodeId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!operatorCodeId) return;

    const channel = supabase
      .channel("internal_chat_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "internal_chat_messages" },
        (payload) => {
          const msg = payload.new;
          setMessages((prev) => {
            if (msg.conversation_id !== selectedConversationId) return prev;
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === msg.conversation_id);
            if (idx < 0) {
              loadConversations();
              return prev;
            }
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              last_message: msg.body,
              last_message_time: msg.created_at,
            };
            const reordered = [updated[idx], ...updated.filter((_, i) => i !== idx)];
            return reordered;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "internal_chat_messages" },
        (payload) => {
          const msg = payload.new;
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [operatorCodeId, selectedConversationId]);

  const markAsRead = async (convId) => {
    if (!convId || !operatorCodeId) return;
    await markInternalMessagesRead(convId, operatorCodeId);
    setMessages((prev) =>
      prev.map((m) =>
        m.sender_id !== operatorCodeId ? { ...m, read_at: new Date().toISOString() } : m
      )
    );
    loadConversations();
  };

  const sendMessage = async (conversationId, body) => {
    if (!conversationId || !body?.trim() || !operatorCodeId) return null;
    const { data, error } = await supabase
      .from("internal_chat_messages")
      .insert([
        {
          conversation_id: conversationId,
          sender_id: operatorCodeId,
          body: body.trim(),
        },
      ])
      .select()
      .single();
    if (error) {
      console.error("Erro ao enviar mensagem interna:", error);
      return null;
    }
    setMessages((prev) => [...prev, data]);
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === conversationId);
      if (idx < 0) return prev;
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        last_message: data.body,
        last_message_time: data.created_at,
      };
      return [updated[idx], ...updated.filter((_, i) => i !== idx)];
    });
    return data;
  };

  return {
    conversations,
    messages,
    selectedConversationId,
    setSelectedConversationId,
    loadConversations,
    loadMessages,
    markAsRead,
    sendMessage,
    operatorCodeId,
  };
}
