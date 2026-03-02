import React, { useState } from "react";
import styles from "./tableinopen.module.css";
import { DataSelect } from "../DataTime";

const TableInOpen = ({
  fullNotReceivedDonations,
  setDonationOpen,
  setModalOpen,
  donationFilterPerId,
  filterType = "operator",
}) => {
  let dataToShow = [];
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleClick = (donation) => {
    setDonationOpen(donation);
    setModalOpen(true);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filterFullNotReceiverDonations = fullNotReceivedDonations.filter(
    (filter) => {
      if (filterType === "operator") {
        return filter.operator_code_id === donationFilterPerId;
      } else if (filterType === "collector") {
        return filter.collector_code_id === donationFilterPerId;
      }
      return true;
    }
  );

  const getFilteredAndSortedData = () => {
    const filtered =
      donationFilterPerId !== undefined
        ? filterFullNotReceiverDonations
        : fullNotReceivedDonations;

    if (!sortConfig.key) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === "date") {
        aValue = new Date(a.donation_day_to_receive || 0).getTime();
        bValue = new Date(b.donation_day_to_receive || 0).getTime();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  if (donationFilterPerId === "") {
    dataToShow = fullNotReceivedDonations;
    console.log(dataToShow)
  } else {
    dataToShow = getFilteredAndSortedData();
  }

  return (
    <div className={styles.tableInopenContainer}>
      <div className={styles.tableInopenContent}>
        {dataToShow.length > 0 ? (
          <div className={styles.tableInopenWrapper}>
            <div className={styles.tableInopenHeader}>
              <div className={styles.tableInopenStats}>
                <span className={styles.statsItem}>
                  <strong>{dataToShow.length}</strong>{" "}
                  {dataToShow.length === 1 ? "ficha" : "fichas"} em aberto
                </span>
                <span className={styles.statsItem}>
                  Total:{" "}
                  <strong>
                    {dataToShow
                      .reduce(
                        (acc, item) =>
                          acc + (parseFloat(item.donation_value) || 0),
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

            <div className={styles.tableInopenScroll}>
              <table className={styles.tableInopen}>
                <thead>
                  <tr className={styles.tableInopenHeadRow}>
                    <th
                      className={`${styles.tableInopenHead} ${styles.sortable}`}
                      onClick={() => handleSort("date")}
                      style={{ cursor: "pointer" }}
                    >
                      A receber
                      <span className={styles.sortArrow}>
                        {sortConfig.key === "date"
                          ? sortConfig.direction === "asc"
                            ? " ↑"
                            : " ↓"
                          : " ↕"}
                      </span>
                    </th>
                    <th className={styles.tableInopenHead}>Recibo</th>
                    <th className={styles.tableInopenHead}>Nome</th>
                    <th className={styles.tableInopenHead}>Valor</th>
                    <th className={styles.tableInopenHead}>
                      {filterType === "operator" ? "Operador" : "Coletador"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dataToShow.map((donation) => (
                    <tr
                      className={styles.tableInopenRow}
                      key={donation.receipt_donation_id}
                      onClick={() => handleClick(donation)}
                    >
                      <td className={styles.tableInopenCell}>
                        <span className={styles.dateInfo}>
                          {DataSelect(donation.donation_day_to_receive)}
                        </span>
                      </td>
                      <td className={styles.tableInopenCell}>
                        <span className={styles.receiptNumber}>
                          {donation.receipt_donation_id}
                        </span>
                      </td>
                      <td className={styles.tableInopenCell}>
                        <span className={styles.donorName}>
                          {donation.donor_name}
                        </span>
                      </td>
                      <td className={styles.tableInopenCell}>
                        <span className={styles.valueAmount}>
                          {parseFloat(
                            donation.donation_value || 0
                          ).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </td>
                      <td className={styles.tableInopenCell}>
                        <div className={styles.collectorInfo}>
                          <span className={styles.collectorId}>
                            {filterType === "operator"
                              ? donation.operator_code_id || "—"
                              : donation.collector_code_id || "—"}
                          </span>

                          <span className={styles.collectorName}>
                            {filterType === "operator"
                              ? donation.operator_name
                              : donation.collector_name}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.tableInopenEmpty}>
            <div className={styles.emptyIcon}>📋</div>
            <h4>Nenhuma ficha em aberto</h4>
            <p>Não há fichas pendentes para recebimento no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableInOpen;
