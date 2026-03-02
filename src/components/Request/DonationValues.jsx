import React, { useEffect, useState } from "react";
import { ICONS } from "../../constants/constants";
import Loader from "../Loader";
import styles from "./requestComponents.module.css";

const DonationValues = ({ createPackage, onComplete, onCancel }) => {
  const [packageCount, setPackageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const countPackage = () => {
      const count = createPackage?.reduce((acc, item) => {
        return acc + item.donation_value;
      }, 0);

      setPackageCount(count);
    };
    countPackage();
  }, [createPackage]);

  const handleContinue = () => {
    setLoading(true);
    onComplete();
    setLoading(false);
  };

  return (
    <div className={styles.requestStepContainer}>
      <div className={styles.requestStepHeader}>
        <h3>Etapa 3: Valores e Quantidade do Pacote</h3>
        <p>Visualize os valores e quantidade de doações encontradas</p>
      </div>
      
      <div className={styles.requestStepContent}>
        <div className={styles.packageSummary}>
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.cardIcon}>{ICONS.MONEY}</div>
              <div className={styles.cardContent}>
                <h4>Quantidade de Doações</h4>
                <span className={styles.cardValue}>{createPackage.length}</span>
                <span className={styles.cardLabel}>registros encontrados</span>
              </div>
            </div>
            
            <div className={styles.summaryCard}>
              <div className={styles.cardIcon}>{ICONS.CONFIRMED}</div>
              <div className={styles.cardContent}>
                <h4>Valor Total</h4>
                <span className={styles.cardValue}>
                  {packageCount.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
                <span className={styles.cardLabel}>valor total arrecadado</span>
              </div>
            </div>
          </div>

          <div className={styles.packageDetails}>
            <h4>Detalhes do Pacote</h4>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <label>Status</label>
                <div className={`${styles.statusBadge} ${styles.success}`}>
                  <span className={styles.statusIcon}>{ICONS.CONFIRMED}</span>
                  <span>Pacote Processado</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button 
              onClick={onCancel}
              className={`${styles.requestBtn} ${styles.secondary}`}
            >
              Cancelar
            </button>
            <button 
              onClick={handleContinue}
              disabled={loading}
              className={`${styles.requestBtn} ${styles.primary}`}
            >
              {loading ? <Loader /> : "Continuar para Distribuição"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationValues;
