import React from "react";
import styles from "./workhistory.module.css";

const WorkHistoryTable = ({ title, donations, lastDonationsMap, showWorklist }) => {
  return (
    <div className={styles.workHistoryTableSection}>
      <h4>
        {title} ({donations.length})
      </h4>
      <div className={styles.workHistoryTableWrapper}>
        <div className={styles.workHistoryTableScroll}>
          <table className={styles.workHistoryTable}>
            <thead>
              <tr className={styles.workHistoryHeadRow}>
                <th className={styles.workHistoryHead}>Recibo</th>
                <th className={styles.workHistoryHead}>Valor</th>
                <th className={styles.workHistoryHead}>Extra</th>
                <th className={styles.workHistoryHead}>Ult. Doação</th>
                {showWorklist && <th className={styles.workHistoryHead}>Work List</th>}
                <th className={styles.workHistoryHead}>Doador</th>
                <th className={styles.workHistoryHead}>Contato</th>
                <th className={styles.workHistoryHead}>Status</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((item) => (
                <tr key={item.receipt_donation_id} className={styles.workHistoryRow}>
                  <td className={styles.workHistoryCell}>
                    <span className={styles.receiptNumber}>{item.receipt_donation_id}</span>
                  </td>
                  <td className={styles.workHistoryCell}>
                    <span className={styles.valueAmount}>
                      {item.donation_value?.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </td>
                  <td className={styles.workHistoryCell}>
                    <span className={styles.extraAmount}>
                      {item.donation_extra?.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }) || "R$ 0,00"}
                    </span>
                  </td>
                  <td className={styles.workHistoryCell}>
                    <span className={styles.lastDonationInfo}>
                      {lastDonationsMap[item.receipt_donation_id] ? (
                        <>
                          <span className={styles.lastDonationDate}>
                            {new Date(
                              lastDonationsMap[item.receipt_donation_id].donation_day_received
                            ).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                          </span>
                          <span className={styles.lastDonationValue}>
                            {lastDonationsMap[item.receipt_donation_id].donation_value?.toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              }
                            )}
                          </span>
                        </>
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </td>
                  {showWorklist && (
                    <td className={styles.workHistoryCell}>
                      <span className={styles.worklistInfo}>{item.donation_worklist || "N/A"}</span>
                    </td>
                  )}
                  <td className={styles.workHistoryCell}>
                    <span className={styles.donorName}>{item.donor?.donor_name || "N/A"}</span>
                  </td>
                  <td className={styles.workHistoryCell}>
                    <span className={styles.contactInfo}>{item.donor?.donor_tel_1 || "N/A"}</span>
                  </td>
                  <td className={styles.workHistoryCell}>
                    <div className={styles.statusGroup}>
                      <span
                        className={`${styles.statusBadge} ${
                          item.donation_print === "Sim" ? styles.statusSuccess : styles.statusPending
                        }`}
                      >
                        {item.donation_print === "Sim" ? "✓ Impresso" : "○ Não impresso"}
                      </span>
                      <span
                        className={`${styles.statusBadge} ${
                          item.donation_received === "Sim"
                            ? styles.statusSuccess
                            : styles.statusPending
                        }`}
                      >
                        {item.donation_received === "Sim" ? "✓ Recebido" : "○ Em Aberto"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkHistoryTable;
