import React, { useState, useEffect } from "react";
import styles from "./workhistory.module.css";
import supabase from "../../helper/superBaseClient";
import { toast } from "react-toastify";

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
      const { data, error } = await supabase
        .from("operator")
        .select()
        .eq("operator_active", true);
      if (error) throw error;
      if (data) setOperatorList(data);
    } catch (error) {
      console.log(error.message);
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
      let query = supabase
        .from("donation")
        .select("*, donor: donor_id(donor_name, donor_tel_1)")
        .eq("operator_code_id", operatorSelected);
      if (receivedSelected === "Sim") {
        query = query
          .eq("donation_received", "Sim")
          .gte("donation_day_received", startDate)
          .lte("donation_day_received", endDate);
      } else {
        query = query
          .eq("donation_received", "Não")
          .gte("donation_day_to_receive", startDate)
          .lte("donation_day_to_receive", endDate);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        setDonationList(data);
        
        // Buscar doação anterior a cada doação pesquisada
        const donationsWithDonors = data.filter(item => item.donor_id);
        if (donationsWithDonors.length > 0) {
          const previousDonationsPromises = donationsWithDonors.map(async (donation) => {
            const donationDate = donation.donation_day_received || donation.donation_day_to_receive;
            const { data: previousDonation } = await supabase
              .from("donation")
              .select("donation_day_received, donation_value")
              .eq("donor_id", donation.donor_id)
              .eq("donation_received", "Sim")
              .neq("receipt_donation_id", donation.receipt_donation_id)
              .lt("donation_day_received", donationDate)
              .order("donation_day_received", { ascending: false })
              .limit(1)
              .single();
            return { donationId: donation.receipt_donation_id, previousDonation };
          });
          
          const results = await Promise.all(previousDonationsPromises);
          const donationsMap = {};
          results.forEach(({ donationId, previousDonation }) => {
            donationsMap[donationId] = previousDonation;
          });
          setLastDonationsMap(donationsMap);
        }
      }
    } catch (error) {
      console.log(error.message);
      toast.error("Erro ao carregar dados");
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

  console.log({ receivedSelected, operatorSelected, startDate, endDate });
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
            {/* Statistics Header */}
            <div className={styles.workHistoryStats}>
              <div className={styles.statsGrid}>
                <div className={`${styles.statItem} ${styles.statItemComparison} ${
                  comparisonStatus === "greater" 
                    ? styles.statItemGreater 
                    : comparisonStatus === "lesser" 
                      ? styles.statItemLesser 
                      : ""
                }`}>
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

            {/* Worklist Donations Table */}
            {worklistDonations.length > 0 && (
              <div className={styles.workHistoryTableSection}>
                <h4>📋 Doações com Work List ({worklistDonations.length})</h4>
                <div className={styles.workHistoryTableWrapper}>
                  <div className={styles.workHistoryTableScroll}>
                    <table className={styles.workHistoryTable}>
                      <thead>
                        <tr className={styles.workHistoryHeadRow}>
                          <th className={styles.workHistoryHead}>Recibo</th>
                          <th className={styles.workHistoryHead}>Valor</th>
                          <th className={styles.workHistoryHead}>Extra</th>
                          <th className={styles.workHistoryHead}>Ult. Doação</th>
                          <th className={styles.workHistoryHead}>Work List</th>
                          <th className={styles.workHistoryHead}>Doador</th>
                          <th className={styles.workHistoryHead}>Contato</th>
                          <th className={styles.workHistoryHead}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {worklistDonations.map((item) => (
                          <tr
                            key={item.receipt_donation_id}
                            className={styles.workHistoryRow}
                          >
                            <td className={styles.workHistoryCell}>
                              <span className={styles.receiptNumber}>
                                {item.receipt_donation_id}
                              </span>
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
                                      {new Date(lastDonationsMap[item.receipt_donation_id].donation_day_received).toLocaleDateString("pt-BR", {timeZone: "UTC"})}
                                    </span>
                                    <span className={styles.lastDonationValue}>
                                      {lastDonationsMap[item.receipt_donation_id].donation_value?.toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      })}
                                    </span>
                                  </>
                                ) : "N/A"}
                              </span>
                            </td>
                            <td className={styles.workHistoryCell}>
                              <span className={styles.worklistInfo}>
                                {item.donation_worklist || "N/A"}
                              </span>
                            </td>
                            <td className={styles.workHistoryCell}>
                              <span className={styles.donorName}>
                                {item.donor?.donor_name || "N/A"}
                              </span>
                            </td>
                            <td className={styles.workHistoryCell}>
                              <span className={styles.contactInfo}>
                                {item.donor?.donor_tel_1 || "N/A"}
                              </span>
                            </td>
                            <td className={styles.workHistoryCell}>
                              <div className={styles.statusGroup}>
                                <span
                                  className={`${styles.statusBadge} ${
                                    item.donation_print === "Sim"
                                      ? styles.statusSuccess
                                      : styles.statusPending
                                  }`}
                                >
                                  {item.donation_print === "Sim"
                                    ? "✓ Impresso"
                                    : "○ Não impresso"}
                                </span>
                                <span
                                  className={`${styles.statusBadge} ${
                                    item.donation_received === "Sim"
                                      ? styles.statusSuccess
                                      : styles.statusPending
                                  }`}
                                >
                                  {item.donation_received === "Sim"
                                    ? "✓ Recebido"
                                    : "○ Em Aberto"}
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
            )}

            {/* New Donations Table */}
            {newDonations.length > 0 && (
              <div className={styles.workHistoryTableSection}>
                <h4>🆕 Novas Doações ({newDonations.length})</h4>
                <div className={styles.workHistoryTableWrapper}>
                  <div className={styles.workHistoryTableScroll}>
                    <table className={styles.workHistoryTable}>
                      <thead>
                        <tr className={styles.workHistoryHeadRow}>
                          <th className={styles.workHistoryHead}>Recibo</th>
                          <th className={styles.workHistoryHead}>Valor</th>
                          <th className={styles.workHistoryHead}>Extra</th>
                          <th className={styles.workHistoryHead}>Ult. Doação</th>
                          <th className={styles.workHistoryHead}>Doador</th>
                          <th className={styles.workHistoryHead}>Contato</th>
                          <th className={styles.workHistoryHead}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newDonations.map((item) => (
                          <tr
                            key={item.receipt_donation_id}
                            className={styles.workHistoryRow}
                          >
                            <td className={styles.workHistoryCell}>
                              <span className={styles.receiptNumber}>
                                {item.receipt_donation_id}
                              </span>
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
                                      {new Date(lastDonationsMap[item.receipt_donation_id].donation_day_received).toLocaleDateString("pt-BR", {timeZone: "UTC"})}
                                    </span>
                                    <span className={styles.lastDonationValue}>
                                      {lastDonationsMap[item.receipt_donation_id].donation_value?.toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      })}
                                    </span>
                                  </>
                                ) : "N/A"}
                              </span>
                            </td>
                            <td className={styles.workHistoryCell}>
                              <span className={styles.donorName}>
                                {item.donor?.donor_name || "N/A"}
                              </span>
                            </td>
                            <td className={styles.workHistoryCell}>
                              <span className={styles.contactInfo}>
                                {item.donor?.donor_tel_1 || "N/A"}
                              </span>
                            </td>
                            <td className={styles.workHistoryCell}>
                              <div className={styles.statusGroup}>
                                <span
                                  className={`${styles.statusBadge} ${
                                    item.donation_print === "Sim"
                                      ? styles.statusSuccess
                                      : styles.statusPending
                                  }`}
                                >
                                  {item.donation_print === "Sim"
                                    ? "✓ Impresso"
                                    : "○ Não impresso"}
                                </span>
                                <span
                                  className={`${styles.statusBadge} ${
                                    item.donation_received === "Sim"
                                      ? styles.statusSuccess
                                      : styles.statusPending
                                  }`}
                                >
                                  {item.donation_received === "Sim"
                                    ? "✓ Recebido"
                                    : "○ Em Aberto"}
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
