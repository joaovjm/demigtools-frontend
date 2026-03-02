import React, { useState, useEffect, useContext } from "react";
import styles from "./modaltaskdetails.module.css";
import supabase from "../../helper/superBaseClient";
import { toast } from "react-toastify";
import { UserContext } from "../../context/UserContext";
import {
  FaTasks,
  FaUser,
  FaReceipt,
  FaSpinner,
  FaSave,
  FaTimes,
  FaTrash,
  FaBan,
  FaPersonBooth,
} from "react-icons/fa";
import { getInfoDonor } from "../../helper/getDonor";
import { editDonor } from "../../helper/editDonor";
import { getCollector } from "../../helper/getCollector";
import { getOperators } from "../../helper/getOperators";
import { useNavigate } from "react-router";
import { navigateWithNewTab } from "../../utils/navigationUtils";

const ModalTaskDetails = ({ task, onClose, onUpdate, statusOptions }) => {
  const navigate = useNavigate();
  const { operatorData } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(task?.status || "pendente");

  // Donor states
  const [donorData, setDonorData] = useState(null);
  const [donorLoading, setDonorLoading] = useState(false);
  const [donorForm, setDonorForm] = useState({
    nome: "",
    tipo: "",
    cpf: "",
    email: "",
    endereco: "",
    cidade: "",
    bairro: "",
    telefone1: "",
    telefone2: "",
    telefone3: "",
    dia: "",
    mensalidade: "",
    observacao: "",
    referencia: "",
    admin_reason: "",
  });

  // Donation states
  const [donationData, setDonationData] = useState(null);
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationForm, setDonationForm] = useState({
    value: "",
    date: "",
    observation: "",
    collector: "",
    operator: "",
  });
  const [collectors, setCollectors] = useState([]);
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    if (task?.donor_id) {
      fetchDonorData();
    }
    if (task?.receipt_donation_id) {
      fetchDonationData();
      fetchCollectors();
      fetchOperators();
    }
  }, [task]);

  const fetchDonorData = async () => {
    try {
      setDonorLoading(true);
      const data = await getInfoDonor(task.donor_id);
      if (data && data[0]) {
        const donor = data[0];
        setDonorData(donor);
        setDonorForm({
          nome: donor.donor_name || "",
          tipo: donor.donor_type || "",
          cpf: donor.donor_cpf?.donor_cpf || "",
          email: donor.donor_email?.donor_email || "",
          endereco: donor.donor_address || "",
          cidade: donor.donor_city || "",
          bairro: donor.donor_neighborhood || "",
          telefone1: donor.donor_tel_1 || "",
          telefone2: donor.donor_tel_2?.donor_tel_2 || "",
          telefone3: donor.donor_tel_3?.donor_tel_3 || "",
          dia: donor.donor_mensal?.donor_mensal_day || "",
          mensalidade: donor.donor_mensal?.donor_mensal_monthly_fee || "",
          observacao: donor.donor_observation?.donor_observation || "",
          referencia: donor.donor_reference?.donor_reference || "",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar doador:", error);
      toast.error("Erro ao carregar dados do doador");
    } finally {
      setDonorLoading(false);
    }
  };

  const fetchDonationData = async () => {
    try {
      setDonationLoading(true);
      const { data, error } = await supabase
        .from("donation")
        .select(
          `
          *,
          donor:donor_id(donor_id, donor_name),
          collector:collector_code_id(collector_name),
          operator:operator_code_id(operator_name)
        `
        )
        .eq("receipt_donation_id", task.receipt_donation_id)
        .single();

      if (error) throw error;

      setDonationData(data);
      setDonationForm({
        value: data.donation_value || "",
        date: data.donation_day_to_receive || "",
        observation: data.donation_description || "",
        collector: data.collector_code_id || "",
        operator: data.operator_code_id || "",
      });
    } catch (error) {
      console.error("Erro ao buscar doação:", error);
      toast.error("Erro ao carregar dados da doação");
    } finally {
      setDonationLoading(false);
    }
  };

  const fetchCollectors = async () => {
    try {
      const data = await getCollector();
      setCollectors(data || []);
    } catch (error) {
      console.error("Erro ao buscar coletadores:", error);
    }
  };

  const fetchOperators = async () => {
    try {
      const data = await getOperators({
        active: true,
        item: "operator_code_id, operator_name",
      });
      setOperators(data || []);
    } catch (error) {
      console.error("Erro ao buscar operadores:", error);
    }
  };

  const handleDonorInputChange = (field, value) => {
    setDonorForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDonationInputChange = (field, value) => {
    setDonationForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDonor = async () => {
    try {
      setSaving(true);
      const success = await editDonor(
        task.donor_id,
        donorForm.nome,
        donorForm.tipo,
        donorForm.cpf,
        donorForm.email,
        donorForm.endereco,
        donorForm.cidade,
        donorForm.bairro,
        donorForm.telefone1,
        donorForm.telefone2,
        donorForm.telefone3,
        donorForm.dia,
        donorForm.mensalidade,
        donorForm.observacao,
        donorForm.referencia
      );

      if (success) {
        toast.success("Doador atualizado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar doador:", error);
      toast.error("Erro ao salvar doador");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDonation = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("donation")
        .update({
          donation_value: donationForm.value,
          donation_day_to_receive: donationForm.date,
          donation_description: donationForm.observation,
          collector_code_id: donationForm.collector,
          operator_code_id: donationForm.operator,
        })
        .eq("receipt_donation_id", task.receipt_donation_id);

      if (error) throw error;

      toast.success("Doação atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar doação:", error);
      toast.error("Erro ao salvar doação");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelReceipt = async () => {
    if (
      !window.confirm(
        "Deseja realmente cancelar esta ficha? O coletador será alterado para 11."
      )
    )
      return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("donation")
        .update({ collector_code_id: 11 })
        .eq("receipt_donation_id", task.receipt_donation_id);

      if (error) throw error;

      toast.success("Ficha cancelada com sucesso!");
      fetchDonationData();
    } catch (error) {
      console.error("Erro ao cancelar ficha:", error);
      toast.error("Erro ao cancelar ficha");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReceipt = async () => {
    if (
      !window.confirm(
        "Deseja realmente EXCLUIR esta ficha? Esta ação não pode ser desfeita!"
      )
    )
      return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("donation")
        .delete()
        .eq("receipt_donation_id", task.receipt_donation_id);

      if (error) throw error;

      toast.success("Ficha excluída com sucesso!");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Erro ao excluir ficha:", error);
      toast.error("Erro ao excluir ficha");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStatus = async () => {
    console.log(donorForm.admin_reason);
    if (
      donorForm.admin_reason === "" ||
      donorForm.admin_reason === null ||
      donorForm.admin_reason === undefined
    ) {
      toast.error("Por favor, informe o resultado da tarefa");
      return;
    }
    try {
      setSaving(true);
      const updateData = {
        status: "concluido",
        admin_reason: donorForm.admin_reason,
        updated_at: new Date().toISOString(),
      };

      if (status === "em_andamento" || status === "concluido") {
        updateData.operator_activity_conclude = operatorData?.operator_code_id;
      }

      const { error } = await supabase
        .from("task_manager")
        .update(updateData)
        .eq("id", task.id);

      if (error) throw error;

      toast.success("Tarefa atualizada com sucesso!");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
      toast.error("Erro ao salvar tarefa");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className={styles.modalContainer}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <div className={styles.modalTitleSection}>
              <h2 className={styles.modalTitle}>
                <FaTasks /> Detalhes da Tarefa
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

          <div className={styles.modalBody}>
            {/* Task Info Section */}
            <div className={styles.formSection}>
              <h3>Informações da Tarefa</h3>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Tarefa</label>
                  <textarea
                    value={task?.reason || ""}
                    readOnly
                    rows={3}
                    className={styles.readOnly}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Solicitante</label>
                  <input
                    type="text"
                    value={task?.operator_required_info?.operator_name || "-"}
                    readOnly
                    className={styles.readOnly}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Responsável</label>
                  <input
                    type="text"
                    value={
                      task?.operator_conclude_info?.operator_name ||
                      "Não atribuído"
                    }
                    readOnly
                    className={styles.readOnly}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Criado em</label>
                  <input
                    type="text"
                    value={formatDate(task?.created_at)}
                    readOnly
                    className={styles.readOnly}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Atualizado em</label>
                  <input
                    type="text"
                    value={formatDate(task?.updated_at)}
                    readOnly
                    className={styles.readOnly}
                  />
                </div>
              </div>
            </div>

            {/* Donor Section */}
            {task?.donor_id && (
              <div className={styles.formSection}>
                <h3>
                  <FaUser /> Dados do Doador
                </h3>
                {donorLoading ? (
                  <div className={styles.loadingSection}>
                    <FaSpinner className={styles.spinner} />
                    <span>Carregando dados do doador...</span>
                  </div>
                ) : (
                  <>
                    <div className={styles.formGrid}>
                      <div className={styles.inputGroup}>
                        <label>Nome</label>
                        <input
                          type="text"
                          value={donorForm.nome}
                          onChange={(e) =>
                            handleDonorInputChange("nome", e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Tipo</label>
                        <select
                          value={donorForm.tipo}
                          onChange={(e) =>
                            handleDonorInputChange("tipo", e.target.value)
                          }
                        >
                          <option value="Avulso">Avulso</option>
                          <option value="Mensal">Mensal</option>
                          <option value="Lista">Lista</option>
                          <option value="Excluso">Excluso</option>
                        </select>
                      </div>
                      <div className={styles.inputGroup}>
                        <label>CPF</label>
                        <input
                          type="text"
                          value={donorForm.cpf}
                          onChange={(e) =>
                            handleDonorInputChange("cpf", e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Email</label>
                        <input
                          type="email"
                          value={donorForm.email}
                          onChange={(e) =>
                            handleDonorInputChange("email", e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Endereço</label>
                        <input
                          type="text"
                          value={donorForm.endereco}
                          onChange={(e) =>
                            handleDonorInputChange("endereco", e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Cidade</label>
                        <input
                          type="text"
                          value={donorForm.cidade}
                          onChange={(e) =>
                            handleDonorInputChange("cidade", e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Bairro</label>
                        <input
                          type="text"
                          value={donorForm.bairro}
                          onChange={(e) =>
                            handleDonorInputChange("bairro", e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Telefone 1</label>
                        <input
                          type="text"
                          value={donorForm.telefone1}
                          onChange={(e) =>
                            handleDonorInputChange("telefone1", e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Telefone 2</label>
                        <input
                          type="text"
                          value={donorForm.telefone2}
                          onChange={(e) =>
                            handleDonorInputChange("telefone2", e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Telefone 3</label>
                        <input
                          type="text"
                          value={donorForm.telefone3}
                          onChange={(e) =>
                            handleDonorInputChange("telefone3", e.target.value)
                          }
                        />
                      </div>
                      {donorForm.tipo === "Mensal" && (
                        <>
                          <div className={styles.inputGroup}>
                            <label>Dia</label>
                            <input
                              type="number"
                              value={donorForm.dia}
                              onChange={(e) =>
                                handleDonorInputChange("dia", e.target.value)
                              }
                              min="1"
                              max="31"
                            />
                          </div>
                          <div className={styles.inputGroup}>
                            <label>Mensalidade (R$)</label>
                            <input
                              type="number"
                              value={donorForm.mensalidade}
                              onChange={(e) =>
                                handleDonorInputChange(
                                  "mensalidade",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                        </>
                      )}
                      <div
                        className={`${styles.inputGroup} ${styles.fullWidth}`}
                      >
                        <label>Observação</label>
                        <textarea
                          value={donorForm.observacao}
                          onChange={(e) =>
                            handleDonorInputChange("observacao", e.target.value)
                          }
                          rows={2}
                        />
                      </div>
                      <div
                        className={`${styles.inputGroup} ${styles.fullWidth}`}
                      >
                        <label>Referência</label>
                        <textarea
                          value={donorForm.referencia}
                          onChange={(e) =>
                            handleDonorInputChange("referencia", e.target.value)
                          }
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className={styles.sectionActions}>
                      <button
                        onClick={handleSaveDonor}
                        disabled={saving}
                        className={styles.btnSave}
                      >
                        {saving ? (
                          <FaSpinner className={styles.spinner} />
                        ) : (
                          <FaSave />
                        )}
                        Salvar Doador
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Donation Section */}
            {/*
            {task?.receipt_donation_id && (
              <div className={styles.formSection}>
                <h3>
                  <FaReceipt /> Dados do Recibo
                </h3>
                {donationLoading ? (
                  <div className={styles.loadingSection}>
                    <FaSpinner className={styles.spinner} />
                    <span>Carregando dados do recibo...</span>
                  </div>
                ) : donationData ? (
                  <>
                    <div className={styles.formGrid}>
                      <div className={styles.inputGroup}>
                        <label>Nº Recibo</label>
                        <input
                          type="text"
                          value={task.receipt_donation_id}
                          readOnly
                          className={styles.readOnly}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Doador</label>
                        <input
                          type="text"
                          value={donationData?.donor?.donor_name || "-"}
                          readOnly
                          className={styles.readOnly}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Valor (R$)</label>
                        <input
                          type="number"
                          value={donationForm.value}
                          onChange={(e) =>
                            handleDonationInputChange("value", e.target.value)
                          }
                          step="0.01"
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Data para Receber</label>
                        <input
                          type="date"
                          value={donationForm.date}
                          onChange={(e) =>
                            handleDonationInputChange("date", e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Coletador</label>
                        <select
                          value={donationForm.collector}
                          onChange={(e) =>
                            handleDonationInputChange(
                              "collector",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Selecione...</option>
                          {collectors.map((c) => (
                            <option
                              key={c.collector_code_id}
                              value={c.collector_code_id}
                            >
                              {c.collector_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Operador</label>
                        <select
                          value={donationForm.operator}
                          onChange={(e) =>
                            handleDonationInputChange(
                              "operator",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Selecione...</option>
                          {operators.map((op) => (
                            <option
                              key={op.operator_code_id}
                              value={op.operator_code_id}
                            >
                              {op.operator_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Impresso</label>
                        <input
                          type="text"
                          value={donationData?.donation_print || "Não"}
                          readOnly
                          className={styles.readOnly}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Recebido</label>
                        <input
                          type="text"
                          value={donationData?.donation_received || "Não"}
                          readOnly
                          className={styles.readOnly}
                        />
                      </div>
                      <div
                        className={`${styles.inputGroup} ${styles.fullWidth}`}
                      >
                        <label>Observação</label>
                        <textarea
                          value={donationForm.observation}
                          onChange={(e) =>
                            handleDonationInputChange(
                              "observation",
                              e.target.value
                            )
                          }
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className={styles.sectionActions}>
                      <button
                        onClick={handleCancelReceipt}
                        disabled={saving}
                        className={styles.btnCancel}
                      >
                        <FaBan /> Cancelar Ficha
                      </button>
                      <button
                        onClick={handleDeleteReceipt}
                        disabled={saving}
                        className={styles.btnDelete}
                      >
                        <FaTrash /> Excluir Ficha
                      </button>
                      <button
                        onClick={handleSaveDonation}
                        disabled={saving}
                        className={styles.btnSave}
                      >
                        {saving ? (
                          <FaSpinner className={styles.spinner} />
                        ) : (
                          <FaSave />
                        )}
                        Salvar Recibo
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={styles.emptySection}>
                    <p>Recibo não encontrado</p>
                  </div>
                )}
              </div>
            )}
              */}
          </div>

          <div
            className={`${styles.inputGroup} ${styles.fullWidth}`}
            style={{
              marginTop: "10px",
              borderTop: "1px solid #383838",
              paddingTop: "10px",
              paddingBottom: "10px",
            }}
          >
            <label>Resultado da Tarefa</label>
            <input
              value={donorForm.admin_reason}
              onChange={(e) =>
                handleDonorInputChange("admin_reason", e.target.value)
              }
            />
          </div>

          <div className={styles.modalFooter}>
            <button
              onClick={(e) => navigateWithNewTab(e, `/donor/${task.donor_id}`, navigate)}
              className={styles.btnOpenDonor}
              title="Ctrl+Click para abrir em nova aba"
            >
              <FaPersonBooth /> Abrir Doador
            </button>
            <button onClick={onClose} className={styles.btnClose}>
              <FaTimes /> Fechar
            </button>
            <button
              onClick={handleSaveStatus}
              disabled={saving}
              className={styles.btnConfirm}
            >
              {saving ? (
                <>
                  <FaSpinner className={styles.spinner} /> Salvando...
                </>
              ) : (
                <>
                  <FaSave /> Salvar Tarefa
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ModalTaskDetails;
