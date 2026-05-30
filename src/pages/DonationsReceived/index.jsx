import React, { useState } from "react";
import styles from "./donationsreceived.module.css";
import { DataSelect } from "../../components/DataTime";
import Loader from "../../components/Loader";
import { fetchDonationsReceivedDaily } from "../../api/dashboardApi.js";
import { toast } from "react-toastify";

const DonationsReceived = () => {
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [donationReceived, setDonationReceived] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  const handleDonationReceived = async () => {
    if (!startDate || !endDate) {
      toast.warning("Selecione data de início e fim.");
      return;
    }
    if (endDate < startDate) {
      toast.warning("A data final não pode ser menor que a inicial.");
      return;
    }

    setIsLoading(true);
    setDonationReceived([]);

    try {
      const payload = await fetchDonationsReceivedDaily({
        startDate,
        endDate,
      });

      const rows = (payload.days || []).map((row) => ({
        valueDonation: row.valueDonation ?? 0,
        count: row.count ?? 0,
        dateAdd: row.dateAdd,
      }));

      setDonationReceived(rows);
      setTotalCount(payload.totalCount ?? 0);
      setTotalValue(payload.totalValue ?? 0);

      if (rows.length === 0 || (payload.totalCount ?? 0) === 0) {
        toast.info("Nenhuma doação encontrada no período.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Erro ao carregar relatório");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.donationsReceivedContainer}>
      <div className={styles.donationsReceivedContent}>
        <header className={styles.donationsReceivedHeader}>
          <h2 className={styles.donationsReceivedTitle}>💰 Doações Recebidas</h2>
          <div className={styles.donationsReceivedActions}>
            <button
              type="button"
              onClick={() => window.history.back()}
              className={`${styles.donationsReceivedBtn} ${styles.secondary}`}
            >
              ← Voltar
            </button>
          </div>
        </header>

        <div className={styles.donationsReceivedFilters}>
          <h3>Filtros de Período</h3>
          <div className={styles.filtersForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Data Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.donationsReceivedInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Data Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.donationsReceivedInput}
                />
              </div>
              <div className={styles.formGroup}>
                <button
                  type="button"
                  onClick={handleDonationReceived}
                  disabled={isLoading || !startDate || !endDate}
                  className={`${styles.donationsReceivedBtn} ${styles.primary}`}
                >
                  {isLoading ? <Loader /> : "Gerar Relatório"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {donationReceived.length > 0 && (
          <div className={styles.donationsReceivedSummary}>
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryCardIcon}>📊</div>
                <div className={styles.summaryCardContent}>
                  <h4>Total de Fichas</h4>
                  <span className={styles.summaryCardValue}>{totalCount}</span>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryCardIcon}>💰</div>
                <div className={styles.summaryCardContent}>
                  <h4>Valor Total</h4>
                  <span className={styles.summaryCardValue}>
                    {totalValue?.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryCardIcon}>📅</div>
                <div className={styles.summaryCardContent}>
                  <h4>Período</h4>
                  <span className={styles.summaryCardValue}>
                    {donationReceived.length}{" "}
                    {donationReceived.length === 1 ? "dia" : "dias"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.donationsReceivedTableSection}>
          {donationReceived.length > 0 ? (
            <div className={styles.donationsReceivedTableWrapper}>
              <h3>Relatório Diário</h3>
              <div className={styles.tableContainer}>
                <table className={styles.donationsReceivedTable}>
                  <thead>
                    <tr className={styles.donationsReceivedTableHeader}>
                      <th>Data</th>
                      <th>Quantidade de Fichas</th>
                      <th>Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donationReceived?.map((item, index) => (
                      <tr
                        key={`${item.dateAdd}-${index}`}
                        className={styles.donationsReceivedTableRow}
                      >
                        <td className={styles.dateCell}>
                          <span className={styles.dateValue}>
                            {item.dateAdd ? DataSelect(item.dateAdd) : "—"}
                          </span>
                        </td>
                        <td className={styles.countCell}>
                          <span className={styles.countValue}>
                            {item.count || 0}
                          </span>
                        </td>
                        <td className={styles.valueCell}>
                          <span className={styles.valueAmount}>
                            {(item.valueDonation ?? 0)?.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className={styles.donationsReceivedEmpty}>
              <div className={styles.emptyIcon}>📊</div>
              <h4>Nenhum dado encontrado</h4>
              <p>
                Selecione um período e clique em &quot;Gerar Relatório&quot; para
                visualizar as doações recebidas.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default DonationsReceived;
