import { useEffect, useState, useRef, useContext } from "react";
import { getConversations } from "../helper/getConversations.jsx";
import { getMessages } from "../helper/getMessages.jsx";
import { markMessagesAsRead } from "../helper/unreadMessages.jsx";
import supabase from "../helper/superBaseClient";
import { UserContext } from "../context/UserContext";

// Singleton para evitar múltiplas instâncias do hook
let globalConversations = [];
let globalMessages = [];
let isGlobalInitialized = false;
let globalSubscriptions = null;

export function useConversations() {
  const [conversations, setConversations] = useState(globalConversations);
  const [messages, setMessages] = useState(globalMessages);
  const isInitialized = useRef(false);
  const  {operatorData} = useContext(UserContext);

  useEffect(() => {
    // Evita múltiplas inicializações
    if (isInitialized.current || isGlobalInitialized) return;
    isInitialized.current = true;
    isGlobalInitialized = true;

    (async () => {
      try {
        const data = await getConversations(operatorData.operator_code_id);
        globalConversations = data;
        setConversations(data);
      } catch (error) {
        console.error("❌ Erro ao carregar conversas:", error);
      }
    })();
    (async () => {
      try {
        
        const data = await getMessages();
        globalMessages = data;
        setMessages(data);
      } catch (error) {
        console.error("❌ Erro ao carregar mensagens:", error);
      }
    })();

    const msgChannel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          setConversations((prev) => {
            const idx = prev.findIndex(
              (c) => c.conversation_id === msg.conversation_id
            );
            if (idx >= 0) {
              const updated = {
                ...prev[idx],
                last_message: msg.body,
                last_message_time: msg.received_at,
                last_message_status: msg.status,
              };
              const newList = [...prev];
              newList.splice(idx, 1);
              globalConversations = [updated, ...newList];
              return globalConversations;
            } else {
              getConversations(operatorData.operator_code_id).then((data) => {
                globalConversations = data;
                setConversations(data);
              });
              return prev;
            }
          });
          setMessages((prev) => {
            // Primeiro procura por mensagem otimística correspondente
            const optimisticIndex = prev.findIndex(existingMsg => 
              existingMsg.isOptimistic && 
              existingMsg.body === msg.body && 
              existingMsg.conversation_id === msg.conversation_id
            );

            // Se encontrou mensagem otimística, substitui pela real
            if (optimisticIndex >= 0) {
              const optimisticMsg = prev[optimisticIndex];
              const updated = [...prev];
              updated[optimisticIndex] = msg;
              globalMessages = updated;
              return globalMessages;
            }

            // Verifica se a mensagem já existe (duplicação real)
            const messageExists = prev.some(existingMsg => 
              existingMsg.message_id === msg.message_id && !existingMsg.isOptimistic
            );
            
            if (messageExists) {
              return prev;
            }

            // Adiciona nova mensagem (mensagem de outro usuário ou primeira vez)
            const updated = [...prev, msg];
            globalMessages = updated;
            return globalMessages;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          setConversations((prev) => {
            const updated = prev.map((c) =>
              c.conversation_id === msg.conversation_id
                ? {
                    ...c,
                    last_message_status: msg.status,
                  }
                : c
            );
            globalConversations = updated;
            return updated;
          });
          setMessages((prev) => {
            const messageExists = prev.some(existingMsg => existingMsg.message_id === msg.message_id);
            if (messageExists) {
              // Atualiza a mensagem existente apenas se houver mudanças significativas
              const updated = prev.map((existingMsg) => {
                if (existingMsg.message_id === msg.message_id) {
                  // Só atualiza se o status mudou ou se há outras mudanças significativas
                  if (existingMsg.status !== msg.status || 
                      existingMsg.body !== msg.body ||
                      existingMsg.received_at !== msg.received_at) {
                    return msg;
                  }
                }
                return existingMsg;
              });
              globalMessages = updated;
              return updated;
            } else {
              // Se a mensagem não existe, adiciona (caso raro, mas pode acontecer)
              globalMessages = [...prev, msg];
              return globalMessages;
            }
          });
        }
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CHANNEL_ERROR') {
          console.error("❌ Erro na conexão realtime (messages):", error);
        }
      });

    const convChannel = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        async (payload) => {
          const conv = payload.new;
          // Garante que a conversa inserida pertence ao operador atual
          if (conv.operator_code_id !== operatorData.operator_code_id) return;

          try {
            const data = await getConversations(operatorData.operator_code_id);
            globalConversations = data;
            setConversations(data);
          } catch (e) {
            console.error("❌ Erro ao atualizar conversas após INSERT:", e);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const conv = payload.new;
          setConversations((prev) => {
            const updated = prev.map((c) =>
              c.conversation_id === conv.conversation_id
                ? { ...c, title: conv.title, avatar_url: conv.avatar_url }
                : c
            );
            globalConversations = updated;
            return updated;
          });
        }
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CHANNEL_ERROR') {
          console.error("❌ Erro na conexão realtime (conversations):", error);
        }
      });

    globalSubscriptions = { msgChannel, convChannel };

    return () => {
      if (globalSubscriptions) {
        globalSubscriptions.msgChannel.unsubscribe();
        globalSubscriptions.convChannel.unsubscribe();
        globalSubscriptions = null;
      }
      isInitialized.current = false;
      isGlobalInitialized = false;
    };
  }, []);

  // Função para marcar mensagens como lidas
  const markAsRead = async (conversationId) => {
    // Atualiza o estado local imediatamente para melhor UX
    setMessages((prev) => {
      const updatedMessages = markMessagesAsRead(prev, conversationId);
      globalMessages = updatedMessages;
      return updatedMessages;
    });

    // Persiste no banco de dados
    try {
      const response = await fetch("/api/mark-messages-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversationId }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Erro ao marcar mensagens como lidas no servidor:", result);
        console.error("📋 Detalhes:", result.details);
        if (result.suggestion) {
          console.warn("💡 Sugestão:", result.suggestion);
        }
        // Em caso de erro, poderíamos reverter o estado local aqui
      } else {
        if (result.method) {
        }
        if (result.warning) {
          console.warn("⚠️ Aviso:", result.warning);
        }
      }
    } catch (error) {
      console.error("❌ Erro de rede ao marcar mensagens como lidas:", error);
      // Em caso de erro, poderíamos reverter o estado local aqui
    }
  };

  // Função para adicionar mensagem otimista (aparece imediatamente)
  const addOptimisticMessage = (message) => {
    const timestamp = Date.now();
    const optimisticMessage = {
      ...message,
      message_id: `temp_${timestamp}_${Math.random().toString(36).substr(2, 9)}`, // ID temporário único
      received_at: new Date().toISOString(),
      status: "sending", // Status especial para mensagens sendo enviadas
      isOptimistic: true, // Flag para identificar mensagens otimistas
      optimisticTimestamp: timestamp // Para debug e identificação
    };

    setMessages((prev) => {
      const updated = [...prev, optimisticMessage];
      globalMessages = updated;
      return updated;
    });

    // Atualiza também a conversa para mostrar a última mensagem
    setConversations((prev) => {
      const idx = prev.findIndex(
        (c) => c.conversation_id === message.conversation_id
      );
      if (idx >= 0) {
        const updated = {
          ...prev[idx],
          last_message: message.body,
          last_message_time: optimisticMessage.received_at,
          last_message_status: "sending",
        };
        const newList = [...prev];
        newList[idx] = updated;
        globalConversations = newList;
        return globalConversations;
      }
      return prev;
    });

    return optimisticMessage.message_id; // Retorna o ID temporário
  };

  // Função para remover mensagem otimista em caso de erro
  const removeOptimisticMessage = (tempId) => {
    setMessages((prev) => {
      const messageToRemove = prev.find(msg => msg.message_id === tempId);
      const updated = prev.filter(msg => msg.message_id !== tempId);
      if (messageToRemove) {
      }
      globalMessages = updated;
      return updated;
    });
  };

  // Função para substituir mensagem otimista pela real
  const replaceOptimisticMessage = (tempId, realMessage) => {
    setMessages((prev) => {
      const updated = prev.map(msg => 
        msg.message_id === tempId ? realMessage : msg
      );
      globalMessages = updated;
      return updated;
    });
  };

  // Função para recarregar conversas
  const reloadConversations = async () => {
    try {
      const data = await getConversations(operatorData.operator_code_id);
      globalConversations = data;
      setConversations(data);
      return data;
      console.log(data)
    } catch (error) {
      console.error("❌ Erro ao recarregar conversas:", error);
      return [];
    }
  };

  return {conversations, messages, markAsRead, addOptimisticMessage, removeOptimisticMessage, replaceOptimisticMessage, reloadConversations};
}
