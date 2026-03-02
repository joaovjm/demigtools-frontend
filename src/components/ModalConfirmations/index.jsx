import React, { useEffect, useState, useContext } from "react";
import styles from "./modalconfirmation.module.css";
import { ICONS } from "../../constants/constants";
import cancelDonation from "../../helper/cancelDonation";
import supabase from "../../helper/superBaseClient";
import { DataNow, DataSelect } from "../DataTime";
import {useNavigate} from "react-router"
import { FaUser, FaMapMarkerAlt, FaPhone, FaDollarSign, FaExclamationTriangle, FaCalendarAlt, FaEdit, FaTimes, FaCheck, FaArrowLeft, FaClock, FaEye, FaPhoneSlash, FaCalendarCheck } from "react-icons/fa";
import { UserContext } from "../../context/UserContext";
import { logDonorActivity } from "../../helper/logDonorActivity";
import { getDonorConfirmationData } from "../../helper/getDonorConfirmationData";
import { insertDonation } from "../../helper/insertDonation";
import { updateCollectorForDonor } from "../../helper/updateCollectorForDonor";
import { navigateWithNewTab } from "../../utils/navigationUtils";

const ModalConfirmations = ({ donationConfirmationOpen, onClose, setStatus }) => {
  const [isConfirmation, setIsConfirmation] = useState(false);
  const [dateConfirm, setDateConfirm] = useState("");
  const [observation, setObservation] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleObservation, setScheduleObservation] = useState("");
  const { operatorData } = useContext(UserContext);
  const [donorMensalDay, setDonorMensalDay] = useState(null);
  const [donorMonthlyFee, setDonorMonthlyFee] = useState(null);
  const [countNotReceived, setCountNotReceived] = useState(0);
  const [lastThreeDonations, setLastThreeDonations] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    // Resetar estados quando o modal é aberto com uma nova doação
    setIsConfirmation(false);
    setIsScheduling(false);
    setDateConfirm("");
    setScheduleDate("");
    setObservation("");
    setScheduleObservation("");

    const fetchDonorData = async () => {
      if (operatorData?.operator_code_id === 521 && donationConfirmationOpen?.donor_id) {
        const data = await getDonorConfirmationData(donationConfirmationOpen.donor_id);
        setDonorMensalDay(data.donorMensalDay);
        setDonorMonthlyFee(data.donorMonthlyFee);
        setCountNotReceived(data.countNotReceived);
        setLastThreeDonations(data.lastThreeDonations);
      }
    };
    
    fetchDonorData();
  }, [donationConfirmationOpen, operatorData])

  const handleCancel = async () => {
    if (!window.confirm("Você tem certeza que deseja cancelar a ficha?")) {
      return;
    }
    
    const status = await cancelDonation({
      donation: {
        receipt_donation_id: donationConfirmationOpen.id,
        donor_id: donationConfirmationOpen.donor_id,
        donation_value: donationConfirmationOpen.value,
        donation_extra: donationConfirmationOpen.extra,
        donation_day_contact: donationConfirmationOpen.day_contact,
        donation_day_to_receive: donationConfirmationOpen.day_to_receive,
        donation_print: donationConfirmationOpen.print,
        donation_monthref: donationConfirmationOpen.monthref,
        donation_description: donationConfirmationOpen.description,
        donation_received: "Não",
        operator_code_id: donationConfirmationOpen.operator_code_id,
        collector_code_id: donationConfirmationOpen.collector_code_id,
      },
      operatorCodeId: operatorData?.operator_code_id,
    });

    setStatus(status);
    onClose();
  };

  const handleConfirm = async () => {
    if (!dateConfirm) {
      window.alert("Por favor, selecione uma data para a nova doação.");
      return;
    }
    
    if (!window.confirm("Você deseja recriar a doação?")) {
      return;
    }
    
    try {
      // Criar nova doação
      const newDonation = await insertDonation(
        donationConfirmationOpen.donor_id,
        donationConfirmationOpen.operator_code_id || operatorData?.operator_code_id,
        donationConfirmationOpen.value,
        donationConfirmationOpen.extra || null,
        DataNow("noformated"),
        dateConfirm,
        false,
        false,
        observation || donationConfirmationOpen.description || null,
        donationConfirmationOpen.monthref || null,
        null, // campain
        null, // collector
        null  // request_name
      );

      if (!newDonation || newDonation.length === 0) {
        throw new Error("Erro ao criar nova doação");
      }

      // Atualizar todas as outras doações na confirmação (collector_code_id = 10) para collector_code_id = 11
      const updateResult = await updateCollectorForDonor(
        donationConfirmationOpen.donor_id,
        10,
        11
      );

      if (updateResult.success && updateResult.count > 0) {
        console.log(`${updateResult.count} doação(ões) atualizada(s) do coletor 10 para 11`);
      }

      // Registrar criação de nova doação no histórico
      if (operatorData?.operator_code_id) {
        await logDonorActivity({
          donor_id: donationConfirmationOpen.donor_id,
          operator_code_id: operatorData.operator_code_id,
          action_type: "donation_create",
          action_description: `Recriou doação de R$ ${donationConfirmationOpen.value} para ${dateConfirm}`,
          new_values: {
            donation_value: donationConfirmationOpen.value,
            donation_extra: donationConfirmationOpen.extra || null,
            donation_day_to_receive: dateConfirm,
            donation_description: observation || donationConfirmationOpen.description || null,
            receipt_donation_id: newDonation[0].receipt_donation_id,
          },
          related_donation_id: donationConfirmationOpen.id,
        });
      }
      
      setStatus("Update OK")
      onClose();
      
    } catch (errorConfirm) {
      console.error("Error creating donation:", errorConfirm);
      window.alert("Erro ao criar nova doação. Por favor, tente novamente.");
    }
  };

  const handleNotAttended = async () => {
    if (!window.confirm("Você deseja marcar esta doação como 'Não Atendeu'?")) {
      return;
    }
    
    try {
      const { data: updateConfirm, error: errorConfirm } = await supabase
        .from("donation")
        .update({
          confirmation_status: "Não Atendeu",
          donation_day_contact: DataNow("noformated"),
        })
        .eq("receipt_donation_id", donationConfirmationOpen.id);

      if (errorConfirm) throw errorConfirm;

      // Registrar ação no histórico
      if (operatorData?.operator_code_id) {
        await logDonorActivity({
          donor_id: donationConfirmationOpen.donor_id,
          operator_code_id: operatorData.operator_code_id,
          action_type: "donation_edit",
          action_description: `Marcou doação de R$ ${donationConfirmationOpen.value} como 'Não Atendeu'`,
          old_values: {
            confirmation_status: donationConfirmationOpen.confirmation_status || null,
          },
          new_values: {
            confirmation_status: "Não Atendeu",
          },
          related_donation_id: null,
        });
      }
      
      setStatus("Update OK")
      onClose();
      
    } catch (errorConfirm) {
      console.error("Error updating donation:", errorConfirm);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) {
      window.alert("Por favor, selecione uma data para o agendamento.");
      return;
    }
    
    if (!window.confirm(`Você deseja agendar esta doação para ${scheduleDate}?`)) {
      return;
    }
    
    try {
      const { data: updateConfirm, error: errorConfirm } = await supabase
        .from("donation")
        .update({
          confirmation_scheduled: scheduleDate,
          confirmation_status: "Agendado",
          donation_day_contact: DataNow("noformated"),
          confirmation_observation: scheduleObservation || null,
        })
        .eq("receipt_donation_id", donationConfirmationOpen.id);

      if (errorConfirm) throw errorConfirm;

      // Registrar ação no histórico
      if (operatorData?.operator_code_id) {
        await logDonorActivity({
          donor_id: donationConfirmationOpen.donor_id,
          operator_code_id: operatorData.operator_code_id,
          action_type: "donation_edit",
          action_description: `Agendou doação de R$ ${donationConfirmationOpen.value} para ${scheduleDate}`,
          old_values: {
            confirmation_scheduled: donationConfirmationOpen.confirmation_scheduled || null,
            confirmation_status: donationConfirmationOpen.confirmation_status || null,
          },
          new_values: {
            confirmation_scheduled: scheduleDate,
            confirmation_status: "Agendado",
          },
          related_donation_id: null,
        });
      }
      
      setStatus("Update OK")
      onClose();
      
    } catch (errorConfirm) {
      console.error("Error updating donation:", errorConfirm);
    }
  };
  return (
    <main className={styles.modalConfirmationsContainer}>
      <div className={styles.modalConfirmations}>
        <div className={styles.modalConfirmationsContent}>
          <div className={styles.modalConfirmationsHeader}>
            <div className={styles.modalTitleSection}>
              <h2 className={styles.modalTitle}>
                <FaClock />
                Confirmação de Doação
              </h2>
              <span className={styles.receiptNumber}>
                Recibo: #{donationConfirmationOpen.id}
              </span>
            </div>
            <button
              onClick={() => onClose()}
              className={styles.btnCloseModal}
              title="Fechar"
            >
              ✕
            </button>
          </div>

          <div className={styles.modalConfirmationsBody}>
            <div className={styles.donationInfoSection}>
              <h3>Informações da Doação</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <FaDollarSign />
                    Valor
                  </div>
                  <div className={styles.infoValue}>
                    R$ {donationConfirmationOpen.value},00
                  </div>
                </div>
                <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                  <div className={styles.infoLabel}>
                    <FaExclamationTriangle />
                    Motivo
                  </div>
                  <div className={`${styles.infoValue} ${styles.reason}`}>
                    {donationConfirmationOpen.reason}
                  </div>
                </div>
              </div>
            </div>

            {operatorData?.operator_code_id === 521 && (donorMensalDay || donorMonthlyFee) && (
              <div className={styles.mensalInfoSection}>
                <h3>Informações do Mensal</h3>
                <div className={styles.infoGrid}>
                  {donorMensalDay && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>
                        <FaCalendarAlt />
                        Dia do Mensal
                      </div>
                      <div className={styles.infoValue}>
                        Dia {donorMensalDay}
                      </div>
                    </div>
                  )}
                  {donorMonthlyFee && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>
                        <FaDollarSign />
                        Valor Mensal
                      </div>
                      <div className={styles.infoValue}>
                        {donorMonthlyFee.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {operatorData?.operator_code_id === 521 && countNotReceived > 0 && (
              <div className={styles.notReceivedSection}>
                <h3>Status de Recebimento</h3>
                <div className={styles.infoGrid}>
                  <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                    <div className={styles.infoLabel}>
                      <FaExclamationTriangle />
                      Doações Não Recebidas
                    </div>
                    <div className={`${styles.infoValue} ${styles.warning}`}>
                      {countNotReceived} {countNotReceived === 1 ? "mês" : "meses"} sem receber
                    </div>
                  </div>
                </div>
              </div>
            )}

            {operatorData?.operator_code_id === 521 && lastThreeDonations.length > 0 && (
              <div className={styles.recentDonationsSection}>
                <h3>Últimas 3 Doações Recebidas</h3>
                <div className={styles.donationsCardsGrid}>
                  {lastThreeDonations.map((donation, index) => (
                    <div key={index} className={styles.donationCard}>
                      <div className={styles.donationCardHeader}>
                        <span className={styles.donationNumber}>
                          #{index + 1}
                        </span>
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
                          <span className={styles.donationLabel}>
                            📝 Observação:
                          </span>
                          <span className={styles.donationText}>
                            {donation.description || "Sem observação"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.donorInfoSection}>
              <h3>Dados do Doador</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <FaUser />
                    Nome
                  </div>
                  <div className={styles.infoValue}>
                    {donationConfirmationOpen.name}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <FaPhone />
                    Telefone 1
                  </div>
                  <div className={styles.infoValue}>
                    {donationConfirmationOpen.phone}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <FaPhone />
                    Telefone 2
                  </div>
                  <div className={styles.infoValue}>
                    {donationConfirmationOpen.phone2 || "*****-****"}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <FaPhone />
                    Telefone 3
                  </div>
                  <div className={styles.infoValue}>
                    {donationConfirmationOpen.phone3 || "*****-****"}
                  </div>
                </div>
                <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                  <div className={styles.infoLabel}>
                    <FaMapMarkerAlt />
                    Endereço
                  </div>
                  <div className={styles.infoValue}>
                    {donationConfirmationOpen.address}
                  </div>
                </div>
              </div>
            </div>

            {!isConfirmation && !isScheduling && (
              <div className={styles.modalConfirmationsFooter}>
                <button className={styles.btnOpenDonor} onClick={(e) => navigateWithNewTab(e, `/donor/${donationConfirmationOpen.donor_id}`, navigate)} title="Ctrl+Click para abrir em nova aba">
                  <FaEye />
                  Abrir Doador
                </button>
              
                <button
                  onClick={() => setIsConfirmation(true)}
                  className={styles.btnReschedule}
                >
                  <FaCalendarAlt />
                  Recriar Doação
                </button>
                <button 
                  onClick={() => setIsScheduling(true)}
                  className={styles.btnSchedule}
                >
                  <FaCalendarCheck />
                  Agendar
                </button>
                <button 
                  onClick={handleNotAttended}
                  className={styles.btnNotAttended}
                >
                  <FaPhoneSlash />
                  Não Atendeu
                </button>
                <button onClick={handleCancel} className={styles.btnCancel}>
                  <FaTimes />
                  Cancelar Ficha
                </button>
              </div>
            )}

            {isConfirmation && (
              <div className={styles.rescheduleFormSection}>
                <h3>Recriar Doação</h3>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label>
                      <FaCalendarAlt />
                      Data para Receber
                    </label>
                    <input
                      value={dateConfirm}
                      type="date"
                      onChange={(e) => setDateConfirm(e.target.value)}
                      placeholder="Selecione a data"
                    />
                  </div>
                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label>
                      <FaEdit />
                      Observação
                    </label>
                    <textarea
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      placeholder="Observações sobre a nova doação..."
                      rows="3"
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    onClick={() => setIsConfirmation(false)}
                    className={styles.btnBack}
                  >
                    <FaArrowLeft />
                    Voltar
                  </button>
                  <button onClick={handleConfirm} className={styles.btnConfirm}>
                    <FaCheck />
                    Confirmar Recriação
                  </button>
                </div>
              </div>
            )}

            {isScheduling && (
              <div className={styles.rescheduleFormSection}>
                <h3>Agendar Doação</h3>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label>
                      <FaCalendarCheck />
                      Data do Agendamento
                    </label>
                    <input
                      value={scheduleDate}
                      type="date"
                      onChange={(e) => setScheduleDate(e.target.value)}
                      placeholder="Selecione a data para ligar novamente"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>
                      <FaEdit />
                      Observação
                    </label>
                    <input
                      value={scheduleObservation}
                      type="text"
                      onChange={(e) => setScheduleObservation(e.target.value)}
                      placeholder="Observações sobre o agendamento..."
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    onClick={() => {
                      setIsScheduling(false);
                      setScheduleDate("");
                      setScheduleObservation("");
                    }}
                    className={styles.btnBack}
                  >
                    <FaArrowLeft />
                    Voltar
                  </button>
                  <button onClick={handleSchedule} className={styles.btnConfirm}>
                    <FaCheck />
                    Confirmar Agendamento
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

export default ModalConfirmations;
