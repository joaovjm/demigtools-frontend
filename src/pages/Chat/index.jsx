import { useEffect, useState, useRef, useContext } from "react";
import { FiSearch, FiSend, FiX, FiCheck } from "react-icons/fi";
import { BiMessageRoundedDetail } from "react-icons/bi";
import { HiMenu } from "react-icons/hi";

import "./index.css";
import Avatar from "../../components/forms/Avatar";
import { useInternalChat } from "../../hooks/useInternalChat";
import { getOrCreateInternalConversation } from "../../helper/getOrCreateInternalConversation";
import { getOperators } from "../../helper/getOperators";
import { UserContext } from "../../context/UserContext";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [operatorsList, setOperatorsList] = useState([]);
  const [searchOperator, setSearchOperator] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messageListRef = useRef(null);
  const newChatRef = useRef(null);

  const {
    conversations,
    messages,
    selectedConversationId,
    setSelectedConversationId,
    loadConversations,
    markAsRead,
    sendMessage,
    operatorCodeId,
  } = useInternalChat();
  const { operatorData } = useContext(UserContext);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  useEffect(() => {
    const el = messageListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (selectedConversationId) {
      markAsRead(selectedConversationId);
    }
  }, [selectedConversationId]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversationId || sendingMessage) return;
    setSendingMessage(true);
    try {
      await sendMessage(selectedConversationId, message.trim());
      setMessage("");
    } catch (e) {
      console.error(e);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenNewChat = async () => {
    setIsNewChatOpen(true);
    const list = await getOperators({active: "true"});
    setOperatorsList(Array.isArray(list) ? list : []);
  };

  const handleStartConversation = async (otherOperator) => {
    if (!operatorCodeId || otherOperator.operator_code_id === operatorCodeId) return;
    const conv = await getOrCreateInternalConversation(operatorCodeId, otherOperator.operator_code_id);
    if (conv) {
      await loadConversations();
      setSelectedConversationId(conv.id);
      setIsNewChatOpen(false);
      setSearchOperator("");
    }
  };

  const filteredOperators = operatorsList.filter(
    (op) =>
      op.operator_code_id !== operatorCodeId &&
      (op.operator_name || "")
        .toLowerCase()
        .includes((searchOperator || "").toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isNewChatOpen && newChatRef.current && !newChatRef.current.contains(e.target)) {
        setIsNewChatOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isNewChatOpen]);

  return (
    <main className="containerChat">
      <div className="chat-content">
        <div className="chat-main-container">
          <div className={`chat-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
            <div className="sidebar-header">
              <h2>Chat interno</h2>
              <div className="sidebar-actions">
                <button
                  type="button"
                  className="icon-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenNewChat();
                  }}
                  title="Nova conversa"
                >
                  <BiMessageRoundedDetail />
                </button>
              </div>
            </div>

            <div className="search-container">
              <div className="search-input-wrapper">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Pesquisar conversas..."
                  className="search-input"
                  readOnly
                  style={{ cursor: "default" }}
                />
              </div>
            </div>

            <div className="contacts-list">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`contact-item ${selectedConversationId === conv.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedConversationId(conv.id);
                    setIsMobileMenuOpen(false);
                    markAsRead(conv.id);
                  }}
                >
                  <div className="contact-avatar">
                    <div className="avatar">
                      <Avatar name={conv.other_participant_name} />
                    </div>
                  </div>
                  <div className="contact-info">
                    <div className="contact-header">
                      <h3 className="contact-name">{conv.other_participant_name}</h3>
                      <span className="contact-time">
                        {new Date(conv.last_message_time).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="contact-footer">
                      <p className="contact-message">{conv.last_message || "Sem mensagens"}</p>
                      {conv.unread_count > 0 && (
                        <span className="unread-badge">{conv.unread_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isNewChatOpen && (
              <div className="modal-overlay" style={{ position: "absolute", inset: 0 }}>
                <div className="modal-content add-contact-modal" ref={newChatRef} style={{ maxHeight: "80%" }}>
                  <div className="modal-header">
                    <h3>Nova conversa</h3>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => setIsNewChatOpen(false)}
                    >
                      <FiX />
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <input
                        type="text"
                        value={searchOperator}
                        onChange={(e) => setSearchOperator(e.target.value)}
                        placeholder="Buscar por nome..."
                        className="modal-input"
                      />
                    </div>
                    <div className="contacts-search-list" style={{ maxHeight: 300, overflowY: "auto" }}>
                      {filteredOperators.length === 0 ? (
                        <div className="no-contacts">Nenhum operador encontrado</div>
                      ) : (
                        filteredOperators.map((op) => (
                          <div
                            key={op.operator_code_id}
                            className="contact-search-item"
                            onClick={() => handleStartConversation(op)}
                          >
                            <div className="contact-search-avatar">
                              <Avatar name={op.operator_name} />
                            </div>
                            <div className="contact-search-info">
                              <h4>{op.operator_name}</h4>
                              <p>{op.operator_type || ""}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chat-main">
            {selectedConversation ? (
              <>
                <div className="chat-header">
                  <button
                    type="button"
                    className="mobile-menu-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Menu"
                  >
                    <HiMenu />
                  </button>
                  <div className="chat-contact-info">
                    <div className="chat-avatar">
                      <Avatar name={selectedConversation.other_participant_name} />
                    </div>
                    <div className="chat-contact-details">
                      <h3 className="chat-contact-name">
                        {selectedConversation.other_participant_name}
                      </h3>
                      <p className="chat-contact-status">Chat interno</p>
                    </div>
                  </div>
                </div>

                <div className="chat-messages" ref={messageListRef}>
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === operatorCodeId;
                    const wasRead = Boolean(msg.read_at);
                    return (
                      <div
                        key={msg.id}
                        className={`message ${
                          isMine ? "delivered" : "received"
                        }`}
                      >
                        <div className="message-content">
                          <p className="message-text">{msg.body}</p>
                          <div className="message-meta">
                            <span className="message-time">
                              {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMine && (
                              <span
                                className={`message-read-status ${wasRead ? "read" : "sent"}`}
                                title={wasRead ? `Lido às ${new Date(msg.read_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Enviado"}
                              >
                                {wasRead ? (
                                  <>
                                    <FiCheck className="check-icon check-1" aria-hidden />
                                    <FiCheck className="check-icon check-2" aria-hidden />
                                    <span className="read-label">Lido</span>
                                  </>
                                ) : (
                                  <>
                                    <FiCheck className="check-icon" aria-hidden />
                                    <span className="read-label">Enviado</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="chat-input-container">
                  <div className="message-input-wrapper">
                    <input
                      type="text"
                      placeholder="Digite uma mensagem..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="message-input"
                    />
                  </div>
                  <button
                    type="button"
                    className="send-button"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendingMessage}
                    aria-label="Enviar"
                  >
                    <FiSend />
                  </button>
                </div>
              </>
            ) : (
              <div className="no-chat-selected">
                <div className="no-chat-content">
                  <h2>Chat interno</h2>
                  <p>Selecione uma conversa ou inicie uma nova para falar com administradores e operadores.</p>
                </div>
              </div>
            )}
          </div>

          {isMobileMenuOpen && (
            <div
              className="mobile-overlay"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default Chat;
