import React, { useState, useContext } from "react";
import styles from "./operatorreport.module.css";
import { UserContext } from "../../context/UserContext";
import { fetchOperatorReportDonations } from "../../api/operatorReportApi.js";
import { toast } from "react-toastify";
import { FaSearch, FaDownload } from "react-icons/fa";

const OperatorReport = () => {
  const { operatorData } = useContext(UserContext);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchType, setSearchType] = useState("received");
  const [donations, setDonations] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!operatorData?.operator_code_id) {
      toast.warning("Operador não identificado. Faça login novamente.");
      return;
    }
    // Validações
    if (!startDate || !endDate) {
      toast.warning("Selecione as datas de início e fim!");
      return;
    }
    
    if (endDate < startDate) {
      toast.warning("A data final não pode ser menor que a data inicial");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const result = await fetchOperatorReportDonations({
        startDate,
        endDate,
        operatorCodeId: operatorData.operator_code_id,
        operatorType: operatorData.operator_type,
        searchType,
      });
      
      setDonations(result.donation);
      setTotalValue(result.totalValue);
      
      if (result.donation.length === 0) {
        toast.info("Nenhuma doação encontrada para os filtros selecionados");
      }
    } catch (error) {
      console.error("Erro ao buscar doações:", error);
      toast.error("Erro ao buscar doações recebidas");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchType("received");
    setDonations([]);
    setTotalValue(0);
    setHasSearched(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const lineValue = (donation) =>
    operatorData?.operator_type === "Operador Extra"
      ? Number(donation.donation_extra) || 0
      : Number(donation.donation_value) || 0;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const raw = String(dateString).trim();
    const d = /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(`${raw}T12:00:00`)
      : new Date(raw);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR");
  };

  const getDateField = (donation) => {
    switch (searchType) {
      case "received":
        return donation.donation_day_received;
      case "open":
        return donation.donation_day_to_receive;
      case "created":
        return donation.donation_day_contact;
      default:
        return donation.donation_day_received;
    }
  };

  const getDateLabel = () => {
    switch (searchType) {
      case "received":
        return "Data Recebimento";
      case "open":
        return "Data a Receber";
      case "created":
        return "Data Criada";
      default:
        return "Data Recebimento";
    }
  };

  const handleExport = () => {
    if (donations.length === 0) {
      toast.warning("Não há dados para exportar");
      return;
    }

    // Criar CSV
    const headers = [
      getDateLabel(),
      "Doador",
      operatorData?.operator_type === "Operador Extra" ? "Valor Extra" : "Valor",
      "Operador",
    ];
    const rows = donations.map(donation => [
      formatDate(getDateField(donation)),
      donation.donor?.donor_name || "N/A",
      lineValue(donation),
      donation.operator_name?.operator_name || "N/A"
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";"))
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_doacoes_${startDate}_${endDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h3 className={styles.title}>Relatório de Doações</h3>
        
        {/* Filtros */}
        <div className={styles.filters}>
          <div className={styles.formRow}>
            {/* Data de Início e Fim */}
            <div className={styles.formGroup}>
              <label>Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Data de Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.input}
              />
            </div>
            
            {/* Tipo de Busca */}
            <div className={styles.formGroup}>
              <label>Tipo de Busca</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className={styles.input}
              >
                <option value="received">Recebido</option>
                <option value="open">Em Aberto</option>
                <option value="created">Data Criada</option>
              </select>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button 
              onClick={handleSearch} 
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={loading || !startDate || !endDate}
            >
              <FaSearch /> {loading ? "Buscando..." : "Buscar"}
            </button>
            <button 
              onClick={handleClearFilters} 
              className={`${styles.btn} ${styles.btnSecondary}`}
              disabled={loading}
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Resumo */}
        {hasSearched && donations.length > 0 && (
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total de Doações:</span>
              <span className={styles.summaryValue}>{donations.length}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Valor Total:</span>
              <span className={styles.summaryValue}>{formatCurrency(totalValue)}</span>
            </div>
            <button 
              onClick={handleExport} 
              className={`${styles.btn} ${styles.btnExport}`}
            >
              <FaDownload /> Exportar CSV
            </button>
          </div>
        )}

        {/* Tabela de Resultados */}
        {hasSearched && (
          <div className={styles.resultsContainer}>
            {donations.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{getDateLabel()}</th>
                      <th>Doador</th>
                      <th>
                        {operatorData?.operator_type === "Operador Extra"
                          ? "Valor Extra"
                          : "Valor"}
                      </th>
                      <th>Operador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((donation, index) => (
                      <tr key={index}>
                        <td>{formatDate(getDateField(donation))}</td>
                        <td>{donation.donor?.donor_name || "N/A"}</td>
                        <td className={styles.valueCell}>
                          {formatCurrency(lineValue(donation))}
                        </td>
                        <td>{donation.operator_name?.operator_name || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📊</div>
                <h4>Nenhuma doação encontrada</h4>
                <p>Não há doações para o período e filtros selecionados.</p>
              </div>
            )}
          </div>
        )}

        {/* Estado inicial */}
        {!hasSearched && (
          <div className={styles.initialState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h4>Pronto para buscar</h4>
            <p>Selecione as datas e clique em "Buscar" para visualizar o relatório.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorReport;

