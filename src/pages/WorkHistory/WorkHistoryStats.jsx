import React from "react";
import styles from "./workhistory.module.css";

const WorkHistoryStats = ({
  comparisonStatus,
  comparisonText,
  totalValue,
  totalExtra,
  receivedCount,
  printedCount,
}) => {
  return (
    <div className={styles.workHistoryStats}>
      <div className={styles.statsGrid}>
        <div
          className={`${styles.statItem} ${styles.statItemComparison} ${
            comparisonStatus === "greater"
              ? styles.statItemGreater
              : comparisonStatus === "lesser"
              ? styles.statItemLesser
              : ""
          }`}
        >
          <span className={styles.statValue}>{comparisonText}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Valor Total</span>
          <span className={styles.statValue}>
            {totalValue.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total do Extra</span>
          <span className={styles.statValue}>
            {totalExtra.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Recebidos</span>
          <span className={styles.statValue}>{receivedCount}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Impressos</span>
          <span className={styles.statValue}>{printedCount}</span>
        </div>
      </div>
    </div>
  );
};

export default WorkHistoryStats;
