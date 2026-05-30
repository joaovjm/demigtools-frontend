import React, { useState, useContext } from "react";
import styles from "./modalscheduledonor.module.css";
import { FaCalendarAlt, FaEdit, FaTimes } from "react-icons/fa";
import { postScheduledForDonorRequest } from "../../api/donorApi";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";

const ModalScheduleDonor = ({ isOpen, onClose, donorId }) => {
  const { operatorData } = useContext(UserContext);
  const [scheduledDate, setScheduledDate] = useState("");
  const [observation, setObservation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      // Obter data atual no formato YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      // Garantir que a data selecionada não seja no passado
      if (selectedDate < today) {
        setScheduledDate(today);
      } else {
        setScheduledDate(selectedDate);
      }
    } else {
      setScheduledDate("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!scheduledDate) {
      toast.warning("Por favor, selecione uma data para o agendamento");
      return;
    }

    setIsSubmitting(true);

    try {
      // Enviar apenas a data no formato YYYY-MM-DD
      const result = await postScheduledForDonorRequest({
        scheduled_date: scheduledDate,
        observation: observation.trim() || null,
        entity_type: "doação",
        entity_id: Number(donorId),
        operator_code_id: operatorData?.operator_code_id || null,
      });

      if (result?.status === "OK") {
        toast.success("Agendamento criado com sucesso!");
        setScheduledDate("");
        setObservation("");
        onClose();
      }
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setScheduledDate("");
    setObservation("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <FaCalendarAlt /> Agendar Doação
          </h2>
          <button
            onClick={handleClose}
            className={styles.btnClose}
            title="Fechar"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label htmlFor="scheduledDate">
              <FaCalendarAlt /> Data do Agendamento *
            </label>
            <input
              id="scheduledDate"
              type="date"
              value={scheduledDate}
              onChange={handleDateChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="observation">
              <FaEdit /> Observação
            </label>
            <textarea
              id="observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Observações ou motivos pelo qual foi agendado..."
              rows="4"
              className={styles.formTextarea}
            />
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={handleClose}
              className={`${styles.btn} ${styles.btnCancel}`}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnSubmit}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar Agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalScheduleDonor;

