import React, { useState, useContext } from "react";
import styles from "./modalcreatetask.module.css";
import supabase from "../../helper/superBaseClient";
import { toast } from "react-toastify";
import { UserContext } from "../../context/UserContext";
import {
  FaTasks,
  FaUser,
  FaReceipt,
  FaSpinner,
  FaPaperPlane,
  FaTimes,
} from "react-icons/fa";

const ModalCreateTask = ({ isOpen, onClose, donorId, donorName }) => {
  const { operatorData } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [taskType, setTaskType] = useState("doador"); // 'doador' or 'recibo'
  const [reason, setReason] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const [priority, setPriority] = useState("media");


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.warning("Por favor, descreva a tarefa");
      return;
    }


    try {
      setLoading(true);

      const taskData = {
        reason: reason.trim(),
        priority: priority,
        operator_required: operatorData?.operator_code_id,
        status: "pendente",
        donor_id: donorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("task_manager").insert([taskData]);

      if (error) throw error;

      toast.success("Tarefa criada com sucesso!");
      setReason("");
      setReceiptId("");
      setTaskType("doador");
      onClose();
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      toast.error("Erro ao criar tarefa");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <main className={styles.modalContainer}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <div className={styles.modalTitleSection}>
              <h2 className={styles.modalTitle}>
                <FaTasks /> Nova Tarefa
              </h2>
            </div>
            <button
              onClick={onClose}
              className={styles.btnCloseModal}
              title="Fechar"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.formContainer}>
            <div className={styles.modalBody}>
              <div className={styles.formSection}>
                <h3>Informações da Tarefa</h3>

                <div className={styles.formGrid}>
                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label>Descrição da Tarefa *</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Descreva o que precisa ser feito..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Nível de Prioridade *</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="media">Normal</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Doador</label>
                    <div className={styles.referenceInfo}>
                      <FaUser className={styles.referenceIcon} />
                      <span>{donorName || `ID: ${donorId}`}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.infoboxPriority}>
                <p style={{ color: "#385bad" }}>
                  <strong>Niveis de prioridade</strong> 
                </p>
                <p style={{ color: "#28a745", fontWeight: "bold" }}><strong>Normal: </strong> A tarefa será considerada normal.</p>
                <p style={{ color: "#c70000", fontWeight: "bold" }}><strong>Alta: </strong> Use caso a tarefa seja urgente.</p>
              </div>

              <div className={styles.infoBox}>
                <p>
                  <strong>Atenção:</strong> Após criar a tarefa, o administrador
                  será notificado e poderá visualizar todos os detalhes. Você
                  poderá acompanhar o status da sua solicitação na página
                  "Minhas Tarefas".
                </p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={onClose}
                className={styles.btnClose}
              >
                <FaTimes /> Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={styles.btnConfirm}
              >
                {loading ? (
                  <>
                    <FaSpinner className={styles.spinner} /> Criando...
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Criar Tarefa
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ModalCreateTask;
