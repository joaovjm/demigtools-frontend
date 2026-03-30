import React, { useState, useEffect } from "react";
import styles from "./workhistory.module.css";
import { toast } from "react-toastify";
import { getOperators } from "../../helper/getOperators";
import { fetchWorkHistory } from "../../api/dashboardApi";
import WorkHistoryStats from "./WorkHistoryStats";
import WorkHistoryTable from "./WorkHistoryTable";

const WorkHistory = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [operatorList, setOperatorList] = useState([]);
  const [operatorSelected, setOperatorSelected] = useState("");
  const [receivedSelected, setReceivedSelected] = useState("");
  const [donationList, setDonationList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDonationsMap, setLastDonationsMap] = useState({});

  const fetchOperatorIndividualWork = async () => {
    try {
      const data = await getOperators({ active: true });
      setOperatorList(data || []);
    } catch (error) {
      toast.error(error?.message || "Erro ao carregar operadores");
    }
  };

  useEffect(() => {
    fetchOperatorIndividualWork();
  }, []);

  const handleGenerate = async () => {
    if (
      [startDate, endDate, operatorSelected, receivedSelected].some(
        (v) => v === ""
      )
    ) {
      toast.warning("Selecione todas as opções!");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchWorkHistory({
        operatorCodeId: operatorSelected,
        donationReceived: receivedSelected,
        startDate,
        endDate,
      });

      setDonationList(data || []);
      const donationsMap = {};
      (data || []).forEach((item) => {
        if (item.previous_donation) {
          donationsMap[item.receipt_donation_id] = item.previous_donation;
        }
      });
      setLastDonationsMap(donationsMap);
    } catch (error) {
      toast.error(error?.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const worklistDonations = donationList.filter(
    (item) => item.donation_worklist !== null
  );
  const newDonations = donationList.filter(
    (item) => item.donation_worklist === null
  );
  const totalValue = donationList.reduce(
    (acc, item) =>
      acc + (item.donation_value || 0),
    0
  );
  const totalExtra = donationList.reduce(
    (acc, item) =>
      acc + (item.donation_extra || 0),
    0
  );
  const receivedCount = donationList.filter(
    (item) => item.donation_received === "Sim"
  ).length;
  const printedCount = donationList.filter(
    (item) => item.donation_print === "Sim"
  ).length;

  // Calculate total of last donations for comparison
  const lastDonationsTotalValue = Object.values(lastDonationsMap).reduce(
    (acc, item) => acc + (item?.donation_value || 0),
    0
  );
  
  // Calculate difference between current total and last donations total
  const valueDifference = totalValue - lastDonationsTotalValue;
  const comparisonStatus = valueDifference > 0 ? "greater" : valueDifference < 0 ? "lesser" : "equal";
  const comparisonText = valueDifference > 0 
    ? `Este período foi ${Math.abs(valueDifference).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} maior que a anterior`
    : valueDifference < 0 
      ? `Este período foi ${Math.abs(valueDifference).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} menor que a anterior`
      : "Este período foi igual à última doação";

  return (
    <div className={styles.workHistoryContainer}>
      <div className={styles.workHistoryContent}>
        <h3 className={styles.workHistoryTitle}>📊 Histórico de Trabalho</h3>

        {/* Filter Form Section */}
        <div className={styles.workHistoryFormSection}>
          <h4>Filtros de Relatório</h4>
          <div className={styles.workHistoryForm}>
            <div className={styles.formRowSingle}>
              <div className={styles.formGroup}>
                <label>Data de Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.workHistoryInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Data de Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.workHistoryInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Operador</label>
                <select
                  value={operatorSelected}
                  onChange={(e) => setOperatorSelected(e.target.value)}
                  className={styles.workHistorySelect}
                >
                  <option value="" disabled>
                    Selecione o operador
                  </option>
                  {operatorList.map((item) => (
                    <option
                      value={item.operator_code_id}
                      key={item.operator_code_id}
                    >
                      {item.operator_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Status de Recebimento</label>
                <select
                  value={receivedSelected}
                  onChange={(e) => setReceivedSelected(e.target.value)}
                  className={styles.workHistorySelect}
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  <option value="Sim">Recebido</option>
                  <option value="Não">Não Recebido</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>&nbsp;</label>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`${styles.workHistoryBtn} ${styles.primary}`}
                >
                  {loading ? "Gerando..." : "Gerar Relatório"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {donationList.length > 0 && (
          <div className={styles.workHistoryResults}>
            <WorkHistoryStats
              comparisonStatus={comparisonStatus}
              comparisonText={comparisonText}
              totalValue={totalValue}
              totalExtra={totalExtra}
              receivedCount={receivedCount}
              printedCount={printedCount}
            />

            {/* Worklist Donations Table */}
            {worklistDonations.length > 0 && (
              <WorkHistoryTable
                title="📋 Doações com Work List"
                donations={worklistDonations}
                lastDonationsMap={lastDonationsMap}
                showWorklist
              />
            )}

            {/* New Donations Table */}
            {newDonations.length > 0 && (
              <WorkHistoryTable
                title="🆕 Novas Doações"
                donations={newDonations}
                lastDonationsMap={lastDonationsMap}
                showWorklist={false}
              />
            )}
          </div>
        )}

        {/* Empty State */}
        {donationList.length === 0 && !loading && (
          <div className={styles.workHistoryEmpty}>
            <div className={styles.emptyIcon}>📊</div>
            <h4>Nenhum registro encontrado</h4>
            <p>
              Selecione os filtros e gere um relatório para visualizar os dados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkHistory;
