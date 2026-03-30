import { useState, useEffect } from "react";
import styles from "./modalmergedonators.module.css";
import { FaExchangeAlt, FaTimes, FaCheckCircle, FaExclamationTriangle, FaCalendarAlt, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  fetchDonorMergePreview,
  postDonorMergeTransfer,
  patchDonorMergeRequest,
} from "../../../api/donorApi";

export const ModalMergeDonators = ({ isOpen, onClose, donors = [] }) => {
  const [donorsData, setDonorsData] = useState([]);
  const [donationsData, setDonationsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [newerDonorId, setNewerDonorId] = useState(null);
  const [olderDonorId, setOlderDonorId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [donationsToTransfer, setDonationsToTransfer] = useState([]);
  const [transferCompleted, setTransferCompleted] = useState(false);
  const [transferring, setTransferring] = useState(false);
  
  // Estado para edições do doador mais recente
  const [editedFields, setEditedFields] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && donors.length >= 2) {
      fetchDonorsData();
      setEditedFields({});
      setHasChanges(false);
    }
  }, [isOpen, donors]);

  const fetchDonorsData = async () => {
    setLoading(true);
    setTransferCompleted(false);
    try {
      const donorIds = donors.map((d) => d.donor_id);
      const preview = await fetchDonorMergePreview(donorIds);
      setDonorsData(preview?.donors || []);
      setDonationsData(preview?.donationsByDonor || {});
      setNewerDonorId(preview?.newerDonorId ?? null);
      setOlderDonorId(preview?.olderDonorId ?? null);
    } catch (error) {
      console.error("Erro ao buscar dados dos doadores:", error);
      toast.error(error?.message || "Erro ao carregar dados dos doadores");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferClick = () => {
    if (!olderDonorId || !newerDonorId) return;
    
    const donations = donationsData[olderDonorId] || [];
    setDonationsToTransfer(donations);
    setShowConfirmModal(true);
  };

  const handleConfirmTransfer = async () => {
    setTransferring(true);
    try {
      await postDonorMergeTransfer({ olderDonorId, newerDonorId });

      toast.success("Doações transferidas com sucesso! Doador antigo marcado como Excluso.");
      setShowConfirmModal(false);
      setTransferCompleted(true);
      
      // Atualizar dados locais
      setDonationsData(prev => ({
        ...prev,
        [newerDonorId]: [...(prev[newerDonorId] || []), ...(prev[olderDonorId] || [])],
        [olderDonorId]: []
      }));

      // Atualizar o tipo do doador antigo localmente
      setDonorsData(prev => prev.map(d => 
        d.donor_id === olderDonorId 
          ? { ...d, donor_type: "Excluso" }
          : d
      ));
    } catch (error) {
      console.error("Erro ao transferir doações:", error);
      toast.error("Erro ao transferir doações");
    } finally {
      setTransferring(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedFields(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!hasChanges || !newerDonorId) return;
    
    setSaving(true);
    try {
      await patchDonorMergeRequest(newerDonorId, editedFields);

      toast.success("Alterações salvas com sucesso!");
      setHasChanges(false);
      
      // Atualizar dados locais
      setDonorsData(prev => prev.map(d => {
        if (d.donor_id === newerDonorId) {
          return {
            ...d,
            donor_name: editedFields.donor_name ?? d.donor_name,
            donor_tel_1: editedFields.donor_tel_1 ?? d.donor_tel_1,
            donor_cpf: editedFields.donor_cpf !== undefined 
              ? { donor_cpf: editedFields.donor_cpf } 
              : d.donor_cpf,
            donor_email: editedFields.donor_email !== undefined 
              ? { donor_email: editedFields.donor_email } 
              : d.donor_email,
            donor_tel_2: editedFields.donor_tel_2 !== undefined 
              ? { donor_tel_2: editedFields.donor_tel_2 } 
              : d.donor_tel_2,
            donor_tel_3: editedFields.donor_tel_3 !== undefined 
              ? { donor_tel_3: editedFields.donor_tel_3 } 
              : d.donor_tel_3,
            donor_observation: editedFields.donor_observation !== undefined 
              ? { donor_observation: editedFields.donor_observation } 
              : d.donor_observation,
            donor_reference: editedFields.donor_reference !== undefined 
              ? { donor_reference: editedFields.donor_reference } 
              : d.donor_reference,
          };
        }
        return d;
      }));
      
      setEditedFields({});
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const getDonorField = (donor, field) => {
    if (!donor) return "";
    
    switch (field) {
      case "donor_cpf":
        return donor.donor_cpf?.donor_cpf || "";
      case "donor_email":
        return donor.donor_email?.donor_email || "";
      case "donor_tel_2":
        return donor.donor_tel_2?.donor_tel_2 || "";
      case "donor_tel_3":
        return donor.donor_tel_3?.donor_tel_3 || "";
      case "donor_observation":
        return donor.donor_observation?.donor_observation || "";
      case "donor_reference":
        return donor.donor_reference?.donor_reference || "";
      default:
        return donor[field] || "";
    }
  };

  const getEditedOrOriginalValue = (donor, field) => {
    if (donor.donor_id === newerDonorId && editedFields[field] !== undefined) {
      return editedFields[field];
    }
    return getDonorField(donor, field);
  };

  const renderField = (donor, field, label, isNewer) => {
    const originalValue = getDonorField(donor, field);
    const displayValue = isNewer ? getEditedOrOriginalValue(donor, field) : originalValue;
    
    return (
      <div className={styles.fieldRow}>
        <label>{label}:</label>
        <div className={styles.fieldContent}>
          {isNewer ? (
            <input
              type="text"
              className={`${styles.fieldInput} ${editedFields[field] !== undefined ? styles.fieldEdited : ""}`}
              value={displayValue}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={`Digite ${label.toLowerCase()}`}
            />
          ) : (
            <span className={field === "donor_email" ? styles.emailField : ""}>
              {originalValue || "N/A"}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalMergeDonators}>
        <div className={styles.modalMergeDonatorsContainer}>
          <div className={styles.modalMergeDonatorsHeader}>
            <h3 className={styles.modalMergeDonatorsHeaderTitle}>
              <FaExchangeAlt /> Mesclar Dados de Doadores
            </h3>
            <button className={styles.modalMergeDonatorsHeaderButtonExit} onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className={styles.modalMergeDonatorsBody}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Carregando dados dos doadores...</p>
              </div>
            ) : (
              <>
                {transferCompleted && (
                  <div className={styles.successMessage}>
                    <FaCheckCircle />
                    <span>Transferência de doações concluída com sucesso! Doador antigo marcado como Excluso.</span>
                  </div>
                )}

                <div className={styles.donorsComparison}>
                  {donorsData.map((donor) => {
                    const isNewer = donor.donor_id === newerDonorId;
                    const donations = donationsData[donor.donor_id] || [];
                    const mostRecentDonation = donations[0];

                    return (
                      <div 
                        key={donor.donor_id} 
                        className={`${styles.donorCard} ${isNewer ? styles.newerDonor : styles.olderDonor}`}
                      >
                        <div className={styles.donorCardHeader}>
                          <div className={styles.headerLeft}>
                            <span className={`${styles.badge} ${isNewer ? styles.badgeNewer : styles.badgeOlder}`}>
                              {isNewer ? "📅 Doações Mais Recentes" : "📦 Doador Antigo"}
                            </span>
                            {donor.donor_type === "Excluso" && (
                              <span className={styles.badgeExcluso}>Excluso</span>
                            )}
                          </div>
                          <span className={styles.donorId}>ID: {donor.donor_id}</span>
                        </div>

                        <div className={styles.donorCardBody}>
                          {renderField(donor, "donor_name", "Nome", isNewer)}
                          {renderField(donor, "donor_cpf", "CPF", isNewer)}
                          {renderField(donor, "donor_email", "Email", isNewer)}
                          {renderField(donor, "donor_tel_1", "Telefone 1", isNewer)}
                          {renderField(donor, "donor_tel_2", "Telefone 2", isNewer)}
                          {renderField(donor, "donor_tel_3", "Telefone 3", isNewer)}
                          {renderField(donor, "donor_observation", "Observação", isNewer)}
                          {renderField(donor, "donor_reference", "Referência", isNewer)}

                          <div className={styles.donationsInfo}>
                            <div className={styles.donationsCount}>
                              <strong>Total de Doações:</strong> {donations.length}
                            </div>
                            {mostRecentDonation && (
                              <div className={styles.lastDonation}>
                                <FaCalendarAlt />
                                <span>Última: {formatDate(mostRecentDonation.donation_day_contact)}</span>
                                <span className={styles.donationValue}>
                                  {formatCurrency(mostRecentDonation.donation_value)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Botão de salvar alterações para o doador mais recente */}
                          {isNewer && hasChanges && (
                            <div className={styles.saveSection}>
                              <button 
                                className={styles.saveButton}
                                onClick={handleSaveChanges}
                                disabled={saving}
                              >
                                {saving ? (
                                  <>
                                    <span className={styles.spinnerSmall}></span>
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    <FaSave />
                                    Salvar Alterações
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!transferCompleted && olderDonorId && (donationsData[olderDonorId]?.length > 0) && (
                  <div className={styles.transferSection}>
                    <button 
                      className={styles.transferButton}
                      onClick={handleTransferClick}
                      disabled={transferring}
                    >
                      <FaExchangeAlt />
                      Transferir Doações do Doador Antigo para o Mais Recente
                    </button>
                    <p className={styles.transferHint}>
                      {donationsData[olderDonorId]?.length} doação(ões) serão transferidas
                    </p>
                  </div>
                )}

                {!transferCompleted && (!olderDonorId || donationsData[olderDonorId]?.length === 0) && (
                  <div className={styles.noTransferMessage}>
                    <FaCheckCircle />
                    <span>O doador antigo não possui doações para transferir.</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Transferência */}
      {showConfirmModal && (
        <div className={styles.confirmModal}>
          <div className={styles.confirmModalContainer}>
            <div className={styles.confirmModalHeader}>
              <h3>
                <FaExclamationTriangle /> Confirmar Transferência
              </h3>
              <button 
                className={styles.confirmModalClose}
                onClick={() => setShowConfirmModal(false)}
                disabled={transferring}
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.confirmModalBody}>
              <p className={styles.confirmText}>
                As seguintes doações serão transferidas do doador <strong>ID {olderDonorId}</strong> para o doador <strong>ID {newerDonorId}</strong>:
              </p>
              <p className={styles.confirmWarning}>
                <FaExclamationTriangle /> O doador antigo será marcado como <strong>Excluso</strong> após a transferência.
              </p>

              <div className={styles.donationsList}>
                <div className={styles.donationsListHeader}>
                  <span>Data</span>
                  <span>Valor</span>
                  <span>Descrição</span>
                  <span>Status</span>
                </div>
                {donationsToTransfer.map((donation) => (
                  <div key={donation.receipt_donation_id} className={styles.donationItem}>
                    <span>{formatDate(donation.donation_day_contact)}</span>
                    <span className={styles.donationValue}>{formatCurrency(donation.donation_value)}</span>
                    <span className={styles.donationDesc}>{donation.donation_description || "-"}</span>
                    <span className={`${styles.donationStatus} ${donation.donation_received === "Sim" ? styles.received : styles.pending}`}>
                      {donation.donation_received === "Sim" ? "Recebido" : "Pendente"}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.totalTransfer}>
                <span>Total a transferir:</span>
                <strong>{donationsToTransfer.length} doação(ões)</strong>
              </div>
            </div>

            <div className={styles.confirmModalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowConfirmModal(false)}
                disabled={transferring}
              >
                Cancelar
              </button>
              <button 
                className={styles.confirmButton}
                onClick={handleConfirmTransfer}
                disabled={transferring}
              >
                {transferring ? (
                  <>
                    <span className={styles.spinnerSmall}></span>
                    Transferindo...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    Confirmar Transferência
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
