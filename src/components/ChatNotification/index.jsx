import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./chatnotification.module.css";
import { UserContext } from "../../context/UserContext";
import supabase from "../../helper/superBaseClient";
import { FaTimes, FaArrowRight } from "react-icons/fa";
import { BiMessageRoundedDetail } from "react-icons/bi";

const STORAGE_KEY = "internalChatNewMessageNotification";

const ChatNotification = () => {
  const { operatorData } = useContext(UserContext);
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const timeoutRef = useRef(null);
  const channelRef = useRef(null);
  const currentOperatorId = operatorData?.operator_code_id;

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotification(parsed);
        setIsVisible(true);
        setIsMinimized(true);
        setHasNewMessage(true);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentOperatorId) return;

    const channel = supabase
      .channel("internal_chat_new_message_notification")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_chat_messages",
        },
        async (payload) => {
          const msg = payload.new;
          if (msg.sender_id === currentOperatorId) return;

          const { data: conv } = await supabase
            .from("internal_chat_conversations")
            .select("participant_1, participant_2")
            .eq("id", msg.conversation_id)
            .single();

          if (!conv) return;
          const isParticipant =
            conv.participant_1 === currentOperatorId || conv.participant_2 === currentOperatorId;
          if (!isParticipant) return;

          const { data: sender } = await supabase
            .from("operator")
            .select("operator_name")
            .eq("operator_code_id", msg.sender_id)
            .single();

          const newNotification = {
            conversationId: msg.conversation_id,
            body: msg.body,
            senderName: sender?.operator_name || "Alguém",
            createdAt: new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };

          localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotification));
          setNotification(newNotification);
          setIsVisible(true);
          setIsMinimized(false);
          setHasNewMessage(true);

          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setIsMinimized(true), 3000);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [currentOperatorId]);

  const handleShow = () => {
    setIsMinimized(false);
    setHasNewMessage(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsMinimized(true), 3000);
  };

  const handleClose = () => setIsMinimized(true);

  const handleViewChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsVisible(false);
    setIsMinimized(true);
    setHasNewMessage(false);
    setNotification(null);
    navigate("/chat");
  };

  if (!isVisible) return null;

  return (
    <div className={styles.notificationContainer}>
      {isMinimized && (
        <button
          type="button"
          className={`${styles.minimizedBtn} ${hasNewMessage ? styles.hasNew : ""}`}
          onClick={handleShow}
          title="Nova mensagem no chat"
        >
          <BiMessageRoundedDetail size={22} />
          {hasNewMessage && <span className={styles.dot} />}
        </button>
      )}

      {!isMinimized && notification && (
        <div className={styles.notification}>
          <div className={styles.notificationHeader}>
            <div className={styles.notificationTitle}>
              <BiMessageRoundedDetail className={styles.icon} />
              <span>Nova mensagem</span>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={handleClose}
              title="Fechar"
            >
              <FaTimes />
            </button>
          </div>
          <div className={styles.notificationBody}>
            <p className={styles.taskReason}>
              {notification.body?.length > 50
                ? notification.body.substring(0, 50) + "..."
                : notification.body}
            </p>
            <div className={styles.taskMeta}>
              <span className={styles.operatorName}>{notification.senderName}</span>
              <span className={styles.time}>{notification.createdAt}</span>
            </div>
          </div>
          <div className={styles.notificationFooter}>
            <button type="button" className={styles.viewChatBtn} onClick={handleViewChat}>
              Ver Chat <FaArrowRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatNotification;
