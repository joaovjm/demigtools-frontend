import React, { useState, useRef, useEffect } from "react";
import styles from "./actiondropdown.module.css";
import { FaCog, FaEnvelope, FaEdit, FaPlus, FaCalendarAlt, FaSave, FaTasks } from "react-icons/fa";

const ActionDropdown = ({
  onCriarMovimento,
  onEditar,
  onEnviarEmail,
  onAgendar,
  onCriarTarefa,
  showBtnCriarMovimento = true,
  showBtnCriarTarefa = true,
  isLoading = false,
  isEditMode = false,
  editButtonText = "Salvar",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleActionClick = (action) => {
    setIsOpen(false);
    if (action === "criarMovimento" && onCriarMovimento) {
      onCriarMovimento();
    } else if (action === "editar" && onEditar) {
      onEditar();
    } else if (action === "enviarEmail" && onEnviarEmail) {
      onEnviarEmail();
    } else if (action === "agendar" && onAgendar) {
      onAgendar();
    } else if (action === "criarTarefa" && onCriarTarefa) {
      onCriarTarefa();
    }
  };

  // Se estiver em modo de edição, mostrar botão Salvar diretamente
  if (isEditMode) {
    return (
      <div className={styles.dropdownContainer} ref={dropdownRef}>
        <button
          className={`${styles.actionButton} ${styles.primary}`}
          onClick={() => onEditar && onEditar()}
          disabled={isLoading}
        >
          <FaSave /> {editButtonText}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button
        className={`${styles.actionButton} ${styles.primary}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <FaCog /> Ação
      </button>

      {isOpen && (
        <>
          <div
            className={styles.dropdownOverlay}
            onClick={() => setIsOpen(false)}
          />
          <div className={styles.dropdownMenu}>
            {showBtnCriarMovimento && (
              <button
                className={styles.dropdownItem}
                onClick={() => handleActionClick("criarMovimento")}
              >
                <FaPlus /> Criar Movimento
              </button>
            )}
            <button
              className={styles.dropdownItem}
              onClick={() => handleActionClick("editar")}
            >
              <FaEdit /> Editar
            </button>
            <button
              className={styles.dropdownItem}
              onClick={() => handleActionClick("enviarEmail")}
            >
              <FaEnvelope /> Enviar Email
            </button>
            <button
              className={styles.dropdownItem}
              onClick={() => handleActionClick("agendar")}
            >
              <FaCalendarAlt /> Agendar
            </button>
            {showBtnCriarTarefa && onCriarTarefa && (
              <button
                className={styles.dropdownItem}
                onClick={() => handleActionClick("criarTarefa")}
              >
                <FaTasks /> Criar Tarefa
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ActionDropdown;
