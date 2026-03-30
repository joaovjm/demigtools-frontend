import React, { useEffect, useState, useContext } from "react";
import styles from "./modalscheduled.module.css";
import { DataNow } from "../DataTime";
import { toast } from "react-toastify";
import { fetchActiveCampains } from "../../api/campainsApi";
import { fetchDonorDonationStats } from "../../api/donationsApi";
import { useNavigate } from "react-router";
import { UserContext } from "../../context/UserContext";
import { registerOperatorActivity, ACTIVITY_TYPES } from "../../services/operatorActivityService";
import { navigateWithNewTab } from "../../utils/navigationUtils";
import {
  clearDonationConfirmationSchedule,
  createDonorAndDonationFromScheduledLead,
  createDonation,
  scheduledDonationCannotHelp,
  scheduledDonationComplete,
  updateLeadStatus,
  updateRequestStatus,
} from "../../api/modalScheduledApi";
import {
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaDollarSign,
  FaCalendarAlt,
  FaBullhorn,
  FaEdit,
  FaTimes,
  FaCheck,
  FaArrowLeft,
  FaUserCircle,
} from "react-icons/fa";

const ModalScheduled = ({
  scheduledOpen,
  onClose,
  setStatus,
  nowScheduled,
}) => {
  const navigate = useNavigate();
  const { operatorData } = useContext(UserContext);
  const [isScheduling, setIsScheduling] = useState(false);
  const [dateScheduling, setDateScheduling] = useState("");
  const [observation, setObservation] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [telSuccess, setTelSuccess] = useState("");
  const [tel1, setTel1] = useState("");
  const [tel2, setTel2] = useState("");
  const [tel3, setTel3] = useState("");
  const [tel4, setTel4] = useState("");
  const [tel5, setTel5] = useState("");
  const [tel6, setTel6] = useState("");
  const [campain, setCampain] = useState("");
  const [valueDonation, setValueDonation] = useState("");
  const [name, setName] = useState("");
  const [campains, setCampains] = useState([]);
  const [lastThreeDonations, setLastThreeDonations] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetchActiveCampains();
        if (!cancelled) setCampains(response || []);
      } catch {
        if (!cancelled) setCampains([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (scheduledOpen?.typeScheduled === "lead" || !scheduledOpen?.donor_id) {
      setLastThreeDonations([]);
      return undefined;
    }
    (async () => {
      try {
        const stats = await fetchDonorDonationStats(scheduledOpen.donor_id, null);
        if (!cancelled) setLastThreeDonations(stats?.lastThreeDonations || []);
      } catch {
        if (!cancelled) setLastThreeDonations([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scheduledOpen?.donor_id, scheduledOpen?.typeScheduled]);

  const handleNewDonation = () => {
    setName(scheduledOpen.name);
    setAddress(scheduledOpen.address);
    setNeighborhood(scheduledOpen.neighborhood);
    setCity(scheduledOpen.city || "RIO DE JANEIRO");
    setTel1(scheduledOpen.phone);
    setTel2(scheduledOpen.phone2);
    setTel3(scheduledOpen.phone3);
    setTel4(scheduledOpen.phone4);
    setTel5(scheduledOpen.phone5);
    setTel6(scheduledOpen.phone6);
    setIsScheduling(true);
  };

  const handleCancel = async () => {
    if (window.confirm("Você tem certeza que deseja cancelar a ficha?")) {
      if (scheduledOpen.typeScheduled === "lead") {
        const response = await updateLeadStatus({
          leads_id: scheduledOpen.id,
          leads_status: "Não pode Ajudar",
          operator_code_id: scheduledOpen.operator_code_id,
        });
        if (response) {
          // Registra atividade de lead agendado que não pode ajudar
          await registerOperatorActivity({
            operatorId: operatorData?.operator_code_id || scheduledOpen.operator_code_id,
            operatorName: operatorData?.operator_name,
            activityType: ACTIVITY_TYPES.LEAD_CANNOT_HELP,
            donorName: scheduledOpen.name,
            metadata: { 
              leadId: scheduledOpen.id, 
              source: "leads_scheduled_cancelled",
            },
          });
          toast.success("Processo concluído com sucesso");
          onClose();
        }
      } else if (scheduledOpen.typeScheduled === "scheduled_donation") {
        // Processar cancelamento de agendamento da nova tabela
        const response = await scheduledDonationCannotHelp({ id: scheduledOpen.id });
        if (response) {
          toast.success("Agendamento marcado como 'Não pode ajudar'");
          onClose();
        }
      } else if (scheduledOpen.typeScheduled === "donation_agendada") {
        // Processar cancelamento de doação agendada da tabela donation
        try {
          await clearDonationConfirmationSchedule({
            receiptDonationId: scheduledOpen.donationId || scheduledOpen.id,
          });
          
          toast.success("Agendamento cancelado com sucesso");
          if (setStatus) setStatus("Update OK");
          onClose();
        } catch (error) {
          console.error("Error canceling scheduled donation:", error);
          toast.error("Erro ao cancelar agendamento");
        }
      } else {
        const response = await updateRequestStatus({
          id: scheduledOpen.donor_id,
          status: "NP",
        });
        if (response) {
          toast.success("Processo concluído com sucesso");
          onClose();
        }
      }
    }
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    const currentDate = DataNow("noformated");
    setDateScheduling(
      selectedDate < currentDate ? DataNow("noformated") : selectedDate
    );
  };

  const handleNewDonorAndDonation = async () => {
    if (
      [
        address,
        neighborhood,
        city,
        tel1,
        tel2,
        tel3,
        valueDonation,
        dateScheduling,
      ].some((v) => v === "")
    ) {
      toast.warning("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const out = await createDonorAndDonationFromScheduledLead({
        lead_id: scheduledOpen.id,
        lead_cpf: scheduledOpen.leads_icpf || "",
        name: scheduledOpen.name,
        address,
        neighborhood: neighborhood || "",
        city: city || "RIO DE JANEIRO",
        tel1: tel1,
        tel2: tel2 || "",
        tel3: tel3 || "",
        valor: valueDonation || "",
        data_receber: dateScheduling || "",
        campain: campain || "",
        descricao: observation || "",
        operator_code_id: scheduledOpen.operator_code_id,
      });

      if (out?.status === "OK") {
        await registerOperatorActivity({
          operatorId: scheduledOpen.operator_code_id,
          operatorName: operatorData?.operator_name,
          activityType: ACTIVITY_TYPES.LEAD_DONATION_FROM_SCHEDULED,
          donorId: out?.donor_id,
          donorName: scheduledOpen.name,
          metadata: {
            leadId: scheduledOpen.id,
            source: "leads_from_scheduled",
            donationValue: valueDonation,
          },
        });
        toast.success("Operação completada com sucesso!");
        onClose();
      }
    } catch (e) {
      toast.error(e.message || "Erro ao criar doador/doação");
    }
  };

  const handleNewRequestDonation = async () => {
    if (
      [valueDonation, dateScheduling, campain, observation].some(
        (v) => v === ""
      )
    ) {
      toast.warning("Preencha todos os campos");
      return;
    }
    const response = await createDonation({
      donor_id: scheduledOpen.donor_id,
      operator_code_id: scheduledOpen.operator_code_id,
      valor: valueDonation,
      comissao: null,
      data_receber: dateScheduling,
      descricao: observation,
      mesref: null,
      campain,
      collector_code_id: null,
      request_name: null,
      requestRowId: null,
    });
    if (response && scheduledOpen.entity_type !== "doação") {
      const response = await updateRequestStatus({ id: scheduledOpen.id, status: "Sucesso" });
      if (response) {
        onClose();
      }
    }
  };

  const handleNewScheduledDonation = async () => {
    if (
      [valueDonation, dateScheduling, campain].some((v) => v === "")
    ) {
      toast.warning("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      // Se for doação agendada da tabela donation, atualizar a doação existente

      if (scheduledOpen.typeScheduled === "donation_agendada") {
        await createDonation({
          donor_id: scheduledOpen.donor_id,
          operator_code_id: scheduledOpen.operator_code_id,
          valor: valueDonation,
          comissao: null,
          data_receber: dateScheduling,
          descricao: observation,
          mesref: null,
          campain,
          collector_code_id: null,
          request_name: null,
          requestRowId: null,
        });

        // Conclui o agendamento da doação existente (limpa marcação)
        await clearDonationConfirmationSchedule({
          receiptDonationId: scheduledOpen.donationId || scheduledOpen.id,
        });
        
        toast.success("Criação de doação concluído com sucesso!");
        if (setStatus) setStatus("Update OK");
        onClose();
      } else {

        // Criar a doação (para scheduled_donations)
        const donationResponse = await createDonation({
          donor_id: scheduledOpen.donor_id,
          operator_code_id: scheduledOpen.operator_code_id,
          valor: valueDonation,
          comissao: null,
          data_receber: dateScheduling,
          descricao: observation,
          mesref: null,
          campain,
          collector_code_id: null,
          request_name: null,
          requestRowId: null,
        });


        const created = donationResponse?.donation?.[0];
        if (created?.receipt_donation_id) {
          // Marcar agendamento como concluído e vincular à doação criada
          await scheduledDonationComplete({
            id: scheduledOpen.id,
            donation_id: created.receipt_donation_id,
          });
          toast.success("Doação criada e agendamento concluído com sucesso!");
          onClose();
        }
      }
    } catch (error) {
      toast.error("Erro ao processar doação: " + error.message);
    }
  };

  const handleOpenDonor = (event) => {
    navigateWithNewTab(event, `/donor/${scheduledOpen.donor_id}`, navigate);
  };

  return (
    <main className={styles.modalScheduledContainer}>
      <div className={styles.modalScheduled}>
        <div className={styles.modalScheduledContent}>
          <div className={styles.modalScheduledHeader}>
            <div className={styles.modalTitleSection}>
              <h2 className={styles.modalTitle}>
                <FaCalendarAlt />
                Agendamento
              </h2>
              <span className={styles.personName}>{scheduledOpen.name}</span>
            </div>
            <button
              onClick={onClose}
              className={styles.btnCloseModal}
              title="Fechar"
            >
              ✕
            </button>
          </div>

          <div className={styles.modalScheduledBody}>
            <div className={styles.personInfoSection}>
              <h3>Informações do Contato</h3>
              
              {/* Address */}
              <div className={styles.infoGrid}>
                <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                  <div className={styles.infoLabel}>
                    <FaMapMarkerAlt />
                    Endereço
                  </div>
                  <div className={styles.infoValue}>{scheduledOpen.address}</div>
                </div>
              </div>

              {/* Compact Phone Display */}
              <div className={styles.contactGrid}>
                <div className={styles.contactItem}>
                  <div className={styles.contactLabel}>
                    <FaPhone />
                    Tel. 1
                  </div>
                  <div className={styles.contactValue}>{scheduledOpen.phone}</div>
                </div>
                <div className={styles.contactItem}>
                  <div className={styles.contactLabel}>
                    <FaPhone />
                    Tel. 2
                  </div>
                  <div className={styles.contactValue}>
                    {scheduledOpen.phone2 || "N/D"}
                  </div>
                </div>
                <div className={styles.contactItem}>
                  <div className={styles.contactLabel}>
                    <FaPhone />
                    Tel. 3
                  </div>
                  <div className={styles.contactValue}>
                    {scheduledOpen.phone3 || "N/D"}
                  </div>
                </div>
                <div className={styles.contactItem}>
                  <div className={styles.contactLabel}>
                    <FaPhone />
                    Tel. 4
                  </div>
                  <div className={styles.contactValue}>
                    {scheduledOpen.phone4 || "N/D"}
                  </div>
                </div>
                <div className={styles.contactItem}>
                  <div className={styles.contactLabel}>
                    <FaPhone />
                    Tel. 5
                  </div>
                  <div className={styles.contactValue}>
                    {scheduledOpen.phone5 || "N/D"}
                  </div>
                </div>
                <div className={styles.contactItem}>
                  <div className={styles.contactLabel}>
                    <FaPhone />
                    Tel. 6
                  </div>
                  <div className={styles.contactValue}>
                    {scheduledOpen.phone6 || "N/D"}
                  </div>
                </div>
              </div>

              {/* Observation */}
              <div className={styles.infoGrid}>
                <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                  <div className={styles.infoLabel}>
                    <FaEdit />
                    Observação
                  </div>
                  <div className={styles.infoValue}>{scheduledOpen.observation}</div>
                </div>
              </div>
            </div>

            {/* Last Donations Section - Only show if not a lead */}
            {scheduledOpen.typeScheduled !== "lead" && (
              <div className={styles.donationsSection}>
                <h3>📋 Últimas 3 Doações Recebidas</h3>
                <div className={styles.lastDonationsGrid}>
                  {lastThreeDonations && lastThreeDonations.length > 0 ? (
                    lastThreeDonations.map((donation, index) => (
                      <div key={index} className={styles.donationCard}>
                        <div className={styles.donationCardHeader}>
                          <span className={styles.donationNumber}>#{index + 1}</span>
                          <span className={styles.donationValue}>
                            {donation.value.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                        <div className={styles.donationCardBody}>
                          <div className={styles.donationInfo}>
                            <span className={styles.donationLabel}>📅 Data:</span>
                            <span className={styles.donationText}>
                              {new Date(donation.day).toLocaleDateString("pt-BR", {
                                timeZone: "UTC",
                              })}
                            </span>
                          </div>
                          <div className={styles.donationInfo}>
                            <span className={styles.donationLabel}>📝 Observação:</span>
                            <span className={styles.donationText}>
                              {donation.description || "Sem observação"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noDonationsMessage}>
                      <span className={styles.noDonationsIcon}>📭</span>
                      <span className={styles.noDonationsText}>
                        Nenhuma doação registrada
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isScheduling && (
              <div className={styles.modalScheduledFooter}>
                <button
                  onClick={handleNewDonation}
                  className={styles.btnCreateDonation}
                >
                  <FaCheck />
                  Criar Doação
                </button>
                <button onClick={handleCancel} className={styles.btnCancel}>
                  <FaTimes />
                  Não pode ajudar
                </button>
                {scheduledOpen.typeScheduled !== "lead" && scheduledOpen.donor_id && (
                  <button onClick={(e) => handleOpenDonor(e)} className={styles.btnOpenDonor} title="Ctrl+Click para abrir em nova aba">
                    <FaUserCircle />
                    Abrir Doador
                  </button>
                )}
              </div>
            )}

            {isScheduling && (
              <div className={styles.donationFormSection}>
                <h3>Dados da Doação</h3>
                <div className={styles.formGrid}>
                  {scheduledOpen.typeScheduled === "lead" && (
                    <>
                      <div className={styles.inputGroup}>
                        <label>
                          <FaUser />
                          Nome
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>
                          <FaMapMarkerAlt />
                          Endereço
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Endereço completo"
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>
                          <FaMapMarkerAlt />
                          Bairro
                        </label>
                        <input
                          type="text"
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          placeholder="Bairro"
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>
                          <FaMapMarkerAlt />
                          Cidade
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Cidade"
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>
                          <FaPhone />
                          Qual contactado?
                        </label>
                        <select
                          value={telSuccess}
                          onChange={(e) => setTelSuccess(e.target.value)}
                        >
                          <option value="" disabled>
                            Selecione o telefone contactado
                          </option>
                          {scheduledOpen.phone && (
                            <option value={scheduledOpen.phone}>
                              {scheduledOpen.phone}
                            </option>
                          )}
                          {scheduledOpen.phone2 && (
                            <option value={scheduledOpen.phone2}>
                              {scheduledOpen.phone2}
                            </option>
                          )}
                          {scheduledOpen.phone3 && (
                            <option value={scheduledOpen.phone3}>
                              {scheduledOpen.phone3}
                            </option>
                          )}
                          {scheduledOpen.phone4 && (
                            <option value={scheduledOpen.phone4}>
                              {scheduledOpen.phone4}
                            </option>
                          )}
                          {scheduledOpen.phone5 && (
                            <option value={scheduledOpen.phone5}>
                              {scheduledOpen.phone5}
                            </option>
                          )}
                          {scheduledOpen.phone6 && (
                            <option value={scheduledOpen.phone6}>
                              {scheduledOpen.phone6}
                            </option>
                          )}
                        </select>
                      </div>
                      <div className={styles.inputGroup}>
                        <label>
                          <FaPhone />
                          Tel. 2
                        </label>
                        <input
                          type="text"
                          value={tel2}
                          onChange={(e) => setTel2(e.target.value)}
                          placeholder="Telefone 2"
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>
                          <FaPhone />
                          Tel. 3
                        </label>
                        <input
                          type="text"
                          value={tel3}
                          onChange={(e) => setTel3(e.target.value)}
                          placeholder="Telefone 3"
                        />
                      </div>
                    </>
                  )}

                  <div className={styles.inputGroup}>
                    <label>
                      <FaDollarSign />
                      Valor
                    </label>
                    <input
                      type="text"
                      value={valueDonation}
                      onChange={(e) => setValueDonation(e.target.value)}
                      placeholder="Valor da doação"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>
                      <FaCalendarAlt />
                      Data
                    </label>
                    <input
                      type="date"
                      value={dateScheduling}
                      onChange={handleDateChange}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>
                      <FaBullhorn />
                      Campanha
                    </label>
                    <select
                      value={campain}
                      onChange={(e) => setCampain(e.target.value)}
                    >
                      <option value="" disabled>
                        Selecione uma campanha...
                      </option>
                      {campains?.map((campain) => (
                        <option key={campain.id} value={campain.campain_name}>
                          {campain.campain_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label>
                      <FaEdit />
                      Observação
                    </label>
                    <textarea
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      placeholder="Observações sobre a doação..."
                      rows="3"
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    onClick={() => setIsScheduling(false)}
                    className={styles.btnBack}
                  >
                    <FaArrowLeft />
                    Voltar
                  </button>
                  <button
                    onClick={
                      scheduledOpen.typeScheduled === "lead"
                        ? handleNewDonorAndDonation
                        : scheduledOpen.typeScheduled === "scheduled_donation" || scheduledOpen.typeScheduled === "donation_agendada"
                        ? handleNewScheduledDonation
                        : handleNewRequestDonation
                    }
                    className={styles.btnConfirm}
                  >
                    <FaCheck />
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ModalScheduled;
