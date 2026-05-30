import React from "react";
import styles from "./tablereceived.module.css";
import { DataSelect } from "../DataTime";

const TableReceived = ({ donationsOperator, operatorType }) => {
  console.log(donationsOperator)
  let typeOperator;
  if (operatorType === "Operador Extra") {
    typeOperator = "donation_extra"
  } else {
    typeOperator = "donation_value"
  }
  
  const dataToShow = donationsOperator || [];

  return (
    <div className={styles.tableReceivedContainer}>
      <div className={styles.tableReceivedContent}>
        {dataToShow.length > 0 ? (
          <div className={styles.tableReceivedWrapper}>
            <div className={styles.tableReceivedHeader}>
              <div className={styles.tableReceivedStats}>
                <span className={styles.statsItem}>
                  <strong>{dataToShow.length}</strong>{" "}
                  {dataToShow.length === 1 ? "doação" : "doações"} recebida
                  {dataToShow.length === 1 ? "" : "s"}
                </span>
                <span className={styles.statsItem}>
                  Total:{" "}
                  <strong>
                    {dataToShow
                      .reduce(
                        (acc, item) =>
                          acc + (parseFloat(item[typeOperator]) || 0),
                        0
                      )
                      .toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                  </strong>
                </span>
              </div>
            </div>

            <div className={styles.tableReceivedScroll}>
              <table className={styles.tableReceived}>
                <thead>
                  <tr className={styles.tableReceivedHeadRow}>
                    <th className={styles.tableReceivedHead}>Nome</th>
                    <th className={styles.tableReceivedHead}>{operatorType === "Operador Extra" ? "Valor Extra" : "Valor"}</th>
                    <th className={styles.tableReceivedHead}>Data Recebida</th>
                    <th className={styles.tableReceivedHead}>Operador</th>
                  </tr>
                </thead>
                <tbody>
                  {dataToShow.map((item, index) => (
                    <tr key={index} className={styles.tableReceivedRow}>
                      <td className={styles.tableReceivedCell}>
                        <span className={styles.donorName}>
                          {item.donor.donor_name}
                        </span>
                      </td>
                      <td className={styles.tableReceivedCell}>
                        <span className={styles.valueAmount}>
                          {item[typeOperator]?.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </td>
                      <td className={styles.tableReceivedCell}>
                        <span className={styles.dateInfo}>
                          {DataSelect(item.donation_day_received)}
                        </span>
                      </td>
                      <td className={styles.tableReceivedCell}>
                        <span className={styles.operatorText}>
                          {item.operator_name?.operator_name}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.tableReceivedEmpty}>
            <div className={styles.emptyIcon}>💰</div>
            <h4>Nenhuma doação recebida</h4>
            <p>Não há doações recebidas para exibir no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableReceived;
