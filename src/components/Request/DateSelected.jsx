import React, { useState } from "react";
import { ICONS } from "../../constants/constants";
import Loader from "../Loader";
import styles from "./requestComponents.module.css";

const DateSelected = ({ date, onComplete, onCancel }) => {
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    setLoading(true);
    onComplete();
    setLoading(false);
  };

  return (
    <div className={styles.requestStepContainer}>
      <div className={styles.requestStepHeader}>
        <h3>Etapa 2: Confirmação da Data</h3>
        <p>Confirme as datas do pacote criado</p>
      </div>

      <div className={styles.requestStepContent}>
        <div className={styles.dateConfirmation}>
          <div className={styles.dateConfirmationHeader}>
            <h4>Pacote Criado com Sucesso!</h4>
            <p>As seguintes datas foram configuradas para busca:</p>
          </div>

          <div className={styles.dateList}>
            {date?.map((data, index) => (
              <div key={index} className={styles.dateItem}>
                <div className={styles.dateInfo}>
                  <span className={styles.dateLabel}>Período:</span>
                  <span className={styles.dateRange}>
                    {new Date(data.startDate).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}{" "}
                    até{" "}
                    {new Date(data.endDate).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </span>
                </div>
                <div className={styles.dateStatus}>
                  <span className={styles.statusIcon}>{ICONS.CONFIRMED}</span>
                  <span className={styles.statusText}>Configurado</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.formActions}>
            <button onClick={onCancel} className={`${styles.requestBtn} ${styles.secondary}`}>
              Cancelar
            </button>
            <button
              onClick={handleContinue}
              disabled={loading}
              className={`${styles.requestBtn} ${styles.primary}`}
            >
              {loading ? <Loader /> : "Continuar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateSelected;
