import React, { useState } from "react";
import { ICONS } from "../../constants/constants";
import FormInput from "../forms/FormInput";
import { DataNow } from "../DataTime";
import styles from "./modalscheduling.module.css";

const ModalScheduling = ({ 
  isOpen, 
  onClose, 
  currentLead, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    dateScheduling: "",
    telScheduling: "",
    observationScheduling: ""
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSchedulingDateChange = (e) => {
    var value = e.target.value;
    const now = DataNow("noformated");
    if (value < now) {
      value = now;
    }
    handleInputChange("dateScheduling", value);
  };

  const handleSave = () => {
    onSave(formData);
    // Reset form
    setFormData({
      dateScheduling: "",
      telScheduling: "",
      observationScheduling: ""
    });
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setFormData({
      dateScheduling: "",
      telScheduling: "",
      observationScheduling: ""
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalSchedulingOverlay}>
      <div className={styles.modalScheduling}>
        <div className={styles.modalSchedulingContent}>
          {/* Header */}
          <div className={styles.modalSchedulingHeader}>
            <div className={styles.modalTitleSection}>
              <h3 className={styles.modalSchedulingTitle}>
                {ICONS.CALENDAR} Agendamento
              </h3>
              <p className={styles.modalSubtitle}>Agendar novo contato com {currentLead?.leads_name}</p>
            </div>
            <button 
              className={styles.btnCloseModal}
              onClick={handleClose}
              title="Fechar modal"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className={styles.modalSchedulingBody}>
            <form className={styles.modalSchedulingForm}>
              <div className={styles.modalFormSection}>
                <h4>Informações do Agendamento</h4>
                <div className={styles.modalFormRow}>
                  <FormInput
                    label="Data *"
                    value={formData.dateScheduling}
                    onChange={handleSchedulingDateChange}
                    type="date"
                  />
                  <div className={styles.modalFormGroup}>
                    <label>Telefone para contato *</label>
                    <select
                      value={formData.telScheduling}
                      onChange={(e) => handleInputChange("telScheduling", e.target.value)}
                      className={styles.modalSelect}
                    >
                      <option value="" disabled>Selecione...</option>
                      {currentLead?.leads_tel_1 && <option value={currentLead.leads_tel_1}>{currentLead.leads_tel_1}</option>}
                      {currentLead?.leads_tel_2 && <option value={currentLead.leads_tel_2}>{currentLead.leads_tel_2}</option>}
                      {currentLead?.leads_tel_3 && <option value={currentLead.leads_tel_3}>{currentLead.leads_tel_3}</option>}
                      {currentLead?.leads_tel_4 && <option value={currentLead.leads_tel_4}>{currentLead.leads_tel_4}</option>}
                      {currentLead?.leads_tel_5 && <option value={currentLead.leads_tel_5}>{currentLead.leads_tel_5}</option>}
                      {currentLead?.leads_tel_6 && <option value={currentLead.leads_tel_6}>{currentLead.leads_tel_6}</option>}
                    </select>
                  </div>
                </div>
                
                <div className={styles.modalFormRow}>
                  <div className={`${styles.modalFormGroup} ${styles.fullWidth}`}>
                    <label>Observação</label>
                    <textarea
                      className={styles.modalTextarea}
                      value={formData.observationScheduling}
                      onChange={(e) => handleInputChange("observationScheduling", e.target.value)}
                      placeholder="Digite observações sobre o agendamento..."
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className={styles.modalSchedulingFooter}>
            <button
              onClick={handleClose}
              className={`${styles.modalBtn} ${styles.secondary}`}
            >
              {ICONS.BACK} Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`${styles.modalBtn} ${styles.primary}`}
            >
              Concluir Agendamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalScheduling;
