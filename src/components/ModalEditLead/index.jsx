import React, { useState, useEffect, useContext } from "react";
import { ICONS } from "../../constants/constants";
import styles from "./modaleditlead.module.css";
import getLeadById from "../../helper/getLeadById";
import editLead from "../../helper/editLead";
import ModalNewDonation from "../ModalNewDonation";
import ModalScheduling from "../ModalScheduling";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import supabase from "../../helper/superBaseClient";
import { DataNow } from "../../components/DataTime";
import {
  insertDonor,
  insertDonor_cpf,
  insertDonor_reference,
  insertDonor_tel_2,
  insertDonor_tel_3,
} from "../../helper/insertDonor";
import { registerOperatorActivity, ACTIVITY_TYPES } from "../../services/operatorActivityService";

const ModalEditLead = ({ 
  isOpen, 
  onClose, 
  leadId,
  initialEditMode = false,
  onSave
}) => {
  const { operatorData } = useContext(UserContext);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [loading, setLoading] = useState(false);
  const [fullLeadData, setFullLeadData] = useState(null);
  const [isModalNewDonationOpen, setIsModalNewDonationOpen] = useState(false);
  const [isModalSchedulingOpen, setIsModalSchedulingOpen] = useState(false);
  const [leadData, setLeadData] = useState({
    name: "",
    address: "",
    neighborhood: "",
    city: "",
    icpf: "",
    tel1: "",
    tel2: "",
    tel3: "",
    tel4: "",
    tel5: "",
    tel6: "",
    email: "",
    observation: "",
  });

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadData();
    }
  }, [isOpen, leadId]);

  const fetchLeadData = async () => {
    try {
      setLoading(true);
      const lead = await getLeadById(leadId);
      if (lead) {
        setFullLeadData(lead);
        setLeadData({
          name: lead.leads_name || "",
          address: lead.leads_address || "",
          neighborhood: lead.leads_neighborhood || "",
          city: lead.leads_city || "",
          icpf: lead.leads_icpf || "",
          tel1: lead.leads_tel_1 || "",
          tel2: lead.leads_tel_2 || "",
          tel3: lead.leads_tel_3 || "",
          tel4: lead.leads_tel_4 || "",
          tel5: lead.leads_tel_5 || "",
          tel6: lead.leads_tel_6 || "",
          email: lead.leads_email || "",
          observation: lead.leads_observation || "",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar dados do lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setLeadData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (initialEditMode) {
      // Se estava em modo de edição inicial, apenas fecha
      onClose();
    } else {
      // Se entrou em modo de edição, volta para visualização
      setIsEditMode(false);
      fetchLeadData(); // Recarrega os dados originais
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedLead = await editLead(leadId, leadData);
      if (updatedLead) {
        setFullLeadData(updatedLead);
        setIsEditMode(false);
        if (onSave) {
          onSave(updatedLead);
        }
        if (initialEditMode) {
          onClose();
        }
      }
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduling = () => {
    setIsModalNewDonationOpen(false);
    setIsModalSchedulingOpen(true);
  };

  const handleNewDonation = () => {
    setIsModalSchedulingOpen(false);
    setIsModalNewDonationOpen(true);
  };

  const handleSchedulingSave = async (formData) => {
    if(!formData.dateScheduling || !formData.telScheduling) {
      toast.warning("Preencha data e telefone usado para contato...")
      return;
    }
    try {
      const { data, error } = await supabase
        .from("leads")
        .update([
          {
            leads_date_accessed: DataNow("noformated"),
            leads_scheduling_date: formData.dateScheduling,
            leads_status: "agendado",
            leads_observation: formData.observationScheduling,
            leads_tel_success: formData.telScheduling
          },
        ])
        .eq("leads_id", leadId)
        .select();

      if (error) throw error;

      if (!error) {
        // Registra atividade de lead agendado
        await registerOperatorActivity({
          operatorId: operatorData?.operator_code_id,
          operatorName: operatorData?.operator_name,
          activityType: ACTIVITY_TYPES.LEAD_SCHEDULED,
          donorName: fullLeadData?.leads_name || leadData.name,
          metadata: { 
            leadId: leadId, 
            source: "leads_scheduled",
            scheduledDate: formData.dateScheduling,
          },
        });
        toast.success("Agendado com sucesso!");
        setIsModalSchedulingOpen(false);
        if (onSave && data && data.length > 0) {
          setFullLeadData(data[0]);
          onSave(data[0]);
        }
      }
    } catch (error) {
      console.error("Erro: ", error.message);
      toast.error("Erro ao agendar: " + error.message);
    }
  };

  const handleNewDonationSave = async (formData) => {
    if (
      formData.address === "" ||
      formData.city === "" ||
      formData.neighborhood === "" ||
      formData.telSuccess === "" ||
      formData.valueDonation === "" ||
      formData.dateDonation === "" ||
      formData.campain === ""
    ) {
      toast.warning("Preencha todos os campos obrigatórios!");
    } else {
      toast.promise(
        (async () => {
          try {
            const leadName = fullLeadData?.leads_name || leadData.name;
            const wasScheduled = fullLeadData?.leads_status === "agendado";
            
            const data = await insertDonor(
              leadName,
              "Lista",
              formData.address,
              formData.city,
              formData.neighborhood,
              formData.telSuccess
            );

            if (data.length > 0) {
              console.log("Doador Criado com Sucesso");
            }

            const cpf = await insertDonor_cpf(
              data[0].donor_id,
              fullLeadData?.leads_icpf || leadData.icpf
            );

            if (formData.newTel2 !== "") {
              await insertDonor_tel_2(data[0].donor_id, formData.newTel2);
            }
            if (formData.newTel3 !== "") {
              await insertDonor_tel_3(data[0].donor_id, formData.newTel3);
            }
            if (formData.reference !== "") {
              await insertDonor_reference(data[0].donor_id, formData.reference);
            }

            if (formData.valueDonation !== "" && formData.dateDonation !== "") {
              const { data: donation, error: donationError } = await supabase
                .from("donation")
                .insert([
                  {
                    donor_id: data[0].donor_id,
                    operator_code_id: operatorData?.operator_code_id,
                    donation_value: formData.valueDonation,
                    donation_day_contact: DataNow("noformated"),
                    donation_day_to_receive: formData.dateDonation,
                    donation_print: "Não",
                    donation_received: "Não",
                    donation_description: formData.observation,
                    donation_campain: formData.campain,
                  },
                ])
                .select();

              if (donationError) throw donationError;
            }

            const { data: update, error } = await supabase
              .from("leads")
              .update({ leads_status: "Sucesso" })
              .eq("leads_id", leadId)
              .select();
            if (error) throw error;

            // Verificar se o lead estava agendado e marcar na tabela scheduled como concluído
            if (wasScheduled) {
              // Buscar e atualizar agendamentos pendentes relacionados a este lead
              const { error: scheduledError } = await supabase
                .from("scheduled")
                .update({ status: "concluído" })
                .eq("entity_type", "lead")
                .eq("entity_id", leadId)
                .eq("status", "pendente");

              if (scheduledError) {
                console.log("Erro ao atualizar agendamento:", scheduledError.message);
              }
            }

            // Verificar se existe doação agendada (confirmation_status = "Agendado") para o novo doador
            // e marcar como Concluído
            const { error: updateScheduledDonationsError } = await supabase
              .from("donation")
              .update({ confirmation_status: "Concluído" })
              .eq("donor_id", data[0].donor_id)
              .eq("confirmation_status", "Agendado");

            if (updateScheduledDonationsError) {
              console.log("Erro ao atualizar doações agendadas:", updateScheduledDonationsError.message);
            }

            // Registra atividade - usa tipo diferente se veio de agendado
            await registerOperatorActivity({
              operatorId: operatorData?.operator_code_id,
              operatorName: operatorData?.operator_name,
              activityType: wasScheduled 
                ? ACTIVITY_TYPES.LEAD_DONATION_FROM_SCHEDULED 
                : ACTIVITY_TYPES.LEAD_SUCCESS,
              donorId: data[0].donor_id,
              donorName: leadName,
              metadata: { 
                leadId: leadId, 
                source: wasScheduled ? "leads_from_scheduled" : "leads",
                donationValue: formData.valueDonation,
                wasScheduled: wasScheduled,
              },
            });

            setIsModalNewDonationOpen(false);
            
            if (onSave && update && update.length > 0) {
              setFullLeadData(update[0]);
              onSave(update[0]);
            }

            return "Processo concluido com sucesso!";
          } catch (error) {
            console.error("Erro na operação:", error.message);
            throw error;
          }
        })(),
        {
          pending: "Processando doação...",
          success: (message) => message,
          error: "Erro ao processar a operação",
        }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalEditLeadOverlay}>
      <div className={styles.modalEditLead}>
        <div className={styles.modalEditLeadContent}>
          {/* Header */}
          <div className={styles.modalEditLeadHeader}>
            <div className={styles.modalTitleSection}>
              <h3 className={styles.modalEditLeadTitle}>
                {ICONS.CIRCLEOUTLINE} {isEditMode ? "Editar Lead" : "Detalhes do Lead"}
              </h3>
              <p className={styles.modalSubtitle}>
                {isEditMode ? "Edite as informações do lead" : leadData.name}
              </p>
            </div>
            <button 
              className={styles.btnCloseModal}
              onClick={onClose}
              title="Fechar modal"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className={styles.modalEditLeadBody}>
            {loading && !leadData.name ? (
              <div className={styles.loadingContainer}>
                <p>Carregando dados do lead...</p>
              </div>
            ) : (
              <form className={styles.modalEditLeadForm}>
                <div className={styles.modalFormSection}>
                  <h4>Informações Pessoais</h4>
                  <div className={styles.modalFormRow}>
                    <div className={`${styles.modalFormGroup} ${styles.fullWidth}`}>
                      <label>Nome *</label>
                      <input
                        type="text"
                        value={leadData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalInput}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.modalFormRow}>
                    <div className={styles.modalFormGroup}>
                      <label>CPF/CNPJ</label>
                      <input
                        type="text"
                        value={leadData.icpf}
                        onChange={(e) => handleInputChange("icpf", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalInput}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.modalFormSection}>
                  <h4>Localização</h4>
                  <div className={styles.modalFormRow}>
                    <div className={`${styles.modalFormGroup} ${styles.fullWidth}`}>
                      <label>Endereço</label>
                      <input
                        type="text"
                        value={leadData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalInput}
                      />
                    </div>
                  </div>
                  <div className={styles.modalFormRow}>
                    <div className={styles.modalFormGroup}>
                      <label>Bairro</label>
                      <input
                        type="text"
                        value={leadData.neighborhood}
                        onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalInput}
                      />
                    </div>
                    <div className={styles.modalFormGroup}>
                      <label>Cidade</label>
                      <input
                        type="text"
                        value={leadData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalInput}
                      />
                    </div>
                  </div>
                  {!isEditMode && fullLeadData?.leads_value && (
                    <div className={styles.modalFormRow}>
                      <div className={styles.modalFormGroup}>
                        <label>Valor da doação</label>
                        <div className={styles.modalValueDisplay}>
                          {Number(fullLeadData.leads_value).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.modalFormSection}>
                  <h4>Contatos</h4>
                  <div className={styles.modalFormRow}>
                    <div className={styles.modalFormGroup}>
                      <label>Telefone 1 *</label>
                      <input
                        type="text"
                        value={leadData.tel1}
                        onChange={(e) => handleInputChange("tel1", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalInput}
                        required
                      />
                    </div>
                    <div className={styles.modalFormGroup}>
                      <label>Telefone 2</label>
                      <input
                        type="text"
                        value={leadData.tel2}
                        onChange={(e) => handleInputChange("tel2", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalInput}
                      />
                    </div>
                  </div>
                  <div className={styles.modalFormRow}>
                    <div className={styles.modalFormGroup}>
                      <label>Telefone 3</label>
                      <input
                        type="text"
                        value={leadData.tel3}
                        onChange={(e) => handleInputChange("tel3", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalInput}
                      />
                    </div>
                    <div className={styles.modalFormGroup}>
                      <label>Telefone 4</label>
                      <input
                        type="text"
                        value={leadData.tel4}
                        onChange={(e) => handleInputChange("tel4", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalInput}
                      />
                    </div>
                  </div>
                  <div className={styles.modalFormRow}>
                    <div className={styles.modalFormGroup}>
                      <label>Telefone 5</label>
                      <input
                        type="text"
                        value={leadData.tel5}
                        onChange={(e) => handleInputChange("tel5", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalInput}
                      />
                    </div>
                    <div className={styles.modalFormGroup}>
                      <label>Telefone 6</label>
                      <input
                        type="text"
                        value={leadData.tel6}
                        onChange={(e) => handleInputChange("tel6", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalInput}
                      />
                    </div>
                  </div>
                  <div className={styles.modalFormRow}>
                    <div className={`${styles.modalFormGroup} ${styles.fullWidth}`}>
                      <label>Email</label>
                      <input
                        type="email"
                        value={leadData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalInput}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.modalFormSection}>
                  <h4>Observações</h4>
                  <div className={styles.modalFormRow}>
                    <div className={`${styles.modalFormGroup} ${styles.fullWidth}`}>
                      <label>Observação</label>
                      <textarea
                        value={leadData.observation}
                        onChange={(e) => handleInputChange("observation", e.target.value)}
                        disabled={!isEditMode}
                        className={styles.modalTextarea}
                        rows={4}
                        placeholder="Digite observações sobre o lead..."
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className={styles.modalEditLeadFooter}>
            {!isEditMode ? (
              <>
                <div className={styles.modalFooterActions}>
                  <button
                    onClick={handleScheduling}
                    className={`${styles.modalBtn} ${styles.warning}`}
                    disabled={!fullLeadData}
                  >
                    {ICONS.CALENDAR} Agendar
                  </button>
                  <button
                    onClick={handleNewDonation}
                    className={`${styles.modalBtn} ${styles.primary}`}
                    disabled={!fullLeadData}
                  >
                    {ICONS.CIRCLEOUTLINE} Nova doação
                  </button>
                  <button
                    onClick={handleEdit}
                    className={`${styles.modalBtn} ${styles.secondary}`}
                  >
                    {ICONS.EDIT} Editar
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className={`${styles.modalBtn} ${styles.secondary}`}
                  disabled={loading}
                >
                  {ICONS.BACK} Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={`${styles.modalBtn} ${styles.primary}`}
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModalNewDonation
        isOpen={isModalNewDonationOpen}
        onClose={() => setIsModalNewDonationOpen(false)}
        currentLead={fullLeadData}
        onSave={handleNewDonationSave}
        operatorID={operatorData?.operator_code_id}
      />

      <ModalScheduling
        isOpen={isModalSchedulingOpen}
        onClose={() => setIsModalSchedulingOpen(false)}
        currentLead={fullLeadData}
        onSave={handleSchedulingSave}
      />
    </div>
  );
};

export default ModalEditLead;

