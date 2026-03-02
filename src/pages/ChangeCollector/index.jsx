import React, { useEffect, useState } from "react";
import styles from "./changecollector.module.css";

import { getCollector } from "../../helper/getCollector";
import { changeCollector, handleReasonButtonPressed } from "../../helper/changeCollector";
import { DataNow, DataSelect } from "../../components/DataTime";
import { ALERT_TYPES, ICONS, MESSAGES } from "../../constants/constants";
import FormSelect from "../../components/forms/FormSelect";
import FormInput from "../../components/forms/FormInput";
import MessageStatus from "../../components/MessageStatus";
import supabase from "../../helper/superBaseClient";

const ChangeCollector = () => {
  const [formData, setFormData] = useState({
    collector: "",
    date: DataNow("noformated"),
    search: "",
  });
  const [collectors, setCollectors] = useState([]);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [openReason, setOpenReason] = useState(false);
  const [reason, setReason] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donationCount, setDonationCount] = useState(0);

  useEffect(() => {
    const fetchCollectors = async () => {
      try {
        const data = await getCollector();
        setCollectors(data);
      } catch (error) {
        console.error("Falha ao buscar colecadores: ", error.message);
        setAlert({
          message: "Erro ao carregar coletadores",
          type: ALERT_TYPES.ERROR,
        });
      }
    };
    fetchCollectors();
  }, []);

  useEffect(() => {
    const fetchDonorName = async () => {
      if (openReason && formData.search) {
        try {
          const { data, error } = await supabase
            .from("donation")
            .select("donor:donor_id (donor_name)")
            .eq("receipt_donation_id", formData.search)
            .single();

          if (error) throw error;

          if (data && data.donor) {
            setDonorName(data.donor.donor_name || "");
          }
        } catch (error) {
          console.error("Erro ao buscar nome do doador: ", error.message);
          setDonorName("");
        }
      }
    };
    fetchDonorName();
  }, [openReason, formData.search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Zera o contador ao trocar de coletador
    if (name === "collector") {
      setDonationCount(0);
    }
  };

  const handleChangeCollector = async (e) => {
    e.preventDefault();

    if (!formData.collector || !formData.date || !formData.search) {
      setAlert({
        message: "Preencah todos os campos",
        type: ALERT_TYPES.ERROR,
      });
      return;
    }

    try {
      const dateFormat = formData.date;
      const result = await changeCollector(
        Number(formData.collector),
        formData.search,
        dateFormat,
        setOpenReason,
      );

      let message, type;

      if (result === "Ok") {
        message = MESSAGES.COLLECTOR_SUCCESS;
        type = ALERT_TYPES.SUCCESS;
        setDonationCount((prev) => prev + 1);
      } else if (result === "Yes") {
        (message = MESSAGES.DONATION_RECEIVED), (type = ALERT_TYPES.ERROR);
      } else {
        (message = MESSAGES.RECEIPT_NOT_FOUND), (type = ALERT_TYPES.ERROR);
      }

      setAlert({ message, type });
      setFormData((prev) => ({ ...prev, search: "" }));
    } catch (error) {
      setAlert({
        message: "Erro ao alterar o coletador",
        type: ALERT_TYPES.ERROR,
      });
    }

    {
      setTimeout(() => {
        setAlert({ message: "", type: "" });
      }, 1000);
    }

    setFormData((prev) => ({ ...prev, search: "" }));
  };

  return (
    <div className={styles.changeCollectorContainer}>
      <div className={styles.changeCollectorContent}>
        <h3 className={styles.changeCollectorTitle}>
          {ICONS.EXCHANGE} Mudar Coletador
        </h3>
        
        {formData.collector && (
          <div className={styles.donationCounter}>
            <span className={styles.counterLabel}>Doações transferidas:</span>
            <span className={styles.counterValue}>{donationCount}</span>
          </div>
        )}
        
        <form className={styles.changeCollectorForm} onSubmit={handleChangeCollector}>
          <div className={styles.formInlineContainer}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {ICONS.MOTORCYCLE} Coletador
              </label>
              <select
                name="collector"
                value={formData.collector}
                onChange={handleInputChange}
                className={styles.changeCollectorSelect}
              >
                <option value="">Selecione...</option>
                {collectors.map((collector) => (
                  <option
                    key={collector.collector_code_id}
                    value={collector.collector_code_id}
                  >
                    {collector.collector_name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {ICONS.CALENDAR} Data
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={styles.changeCollectorInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {ICONS.SEARCH} Buscar Recibo
              </label>
              <input
                type="text"
                name="search"
                value={formData.search}
                onChange={handleInputChange}
                className={styles.changeCollectorInput}
                placeholder="Digite o código..."
              />
            </div>

            <div className={styles.formGroupBtn}>
              <button 
                type="submit"
                className={`${styles.changeCollectorBtn} ${styles.primary}`}
              >
                {ICONS.EXCHANGE} Alterar
              </button>
            </div>
          </div>
        </form>

        {alert && (
          <div className={styles.changeCollectorAlert}>
            <MessageStatus
              message={alert.message}
              type={alert.type}
              icon={
                alert.type === ALERT_TYPES.SUCCESS
                  ? ICONS.CONFIRMED
                  : alert.type === ALERT_TYPES.ERROR
                  ? ICONS.ALERT
                  : null
              }
            />
          </div>
        )}

        {openReason && (
          <div className={styles.changeCollectorReason}>
            <div className={styles.reasonSection}>
              <h4>Motivo da Alteração</h4>
              {donorName && (
                <div className={styles.formGroup}>
                  <label>Doador</label>
                  <p className={styles.donorName}>{donorName}</p>
                </div>
              )}
              <div className={styles.formGroup}>
                <label>Descreva o motivo da alteração</label>
                <input 
                  value={reason} 
                  autoFocus={true} 
                  type="text" 
                  onChange={(e) => setReason(e.target.value)}
                  className={styles.changeCollectorInput}
                  placeholder="Digite o motivo..."
                />
              </div>
              <div className={styles.reasonActions}>
                <button 
                  onClick={() => {
                    setOpenReason(false);
                    setReason("");
                    setDonorName("");
                  }}
                  className={`${styles.changeCollectorBtn} ${styles.secondary}`}
                >
                  {ICONS.CANCEL} Fechar
                </button>
                <button 
                  onClick={() => handleReasonButtonPressed(reason)} 
                  className={`${styles.changeCollectorBtn} ${styles.primary}`}
                >
                  {ICONS.CONFIRMED} Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeCollector;
