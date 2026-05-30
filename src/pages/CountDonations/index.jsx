import React, { useState, useEffect } from "react";
import "./index.css";
import { ICONS, ALERT_TYPES } from "../../constants/constants";
import FormInput from "../../components/forms/FormInput";
import FormSelect from "../../components/forms/FormSelect";
import MessageStatus from "../../components/MessageStatus";

const CountDonations = () => {
  const [filterData, setFilterData] = useState({
    startDate: "",
    endDate: "",
    collector: "",
    donationType: "",
  });
  const [donations, setDonations] = useState([]);
  const [summary, setSummary] = useState({
    totalDonations: 0,
    totalAmount: 0,
    totalCollectors: 0,
    averagePerCollector: 0,
  });
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });

  // Dados fictícios para demonstração
  const mockCollectors = [
    { id: 1, name: "João Silva" },
    { id: 2, name: "Maria Santos" },
    { id: 3, name: "Carlos Oliveira" },
  ];

  const mockDonations = [
    {
      id: 1,
      donorName: "Ana Costa",
      amount: 50.0,
      date: "2024-01-15",
      collector: "João Silva",
      type: "Dinheiro",
      receipt: "REC001",
    },
    {
      id: 2,
      donorName: "Pedro Lima",
      amount: 75.5,
      date: "2024-01-16",
      collector: "Maria Santos",
      type: "PIX",
      receipt: "REC002",
    },
    {
      id: 3,
      donorName: "Lucia Ferreira",
      amount: 100.0,
      date: "2024-01-17",
      collector: "Carlos Oliveira",
      type: "Cartão",
      receipt: "REC003",
    },
  ];

  useEffect(() => {
    // Simular carregamento de coletadores
    setCollectors(mockCollectors);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular busca de doações
      setTimeout(() => {
        const filteredDonations = mockDonations.filter((donation) => {
          let matches = true;

          if (filterData.startDate) {
            matches = matches && new Date(donation.date) >= new Date(filterData.startDate);
          }
          if (filterData.endDate) {
            matches = matches && new Date(donation.date) <= new Date(filterData.endDate);
          }
          if (filterData.collector) {
            matches = matches && donation.collector === filterData.collector;
          }
          if (filterData.donationType) {
            matches = matches && donation.type === filterData.donationType;
          }

          return matches;
        });

        setDonations(filteredDonations);

        // Calcular resumo
        const totalAmount = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0);
        const uniqueCollectors = [...new Set(filteredDonations.map(d => d.collector))];
        
        setSummary({
          totalDonations: filteredDonations.length,
          totalAmount: totalAmount,
          totalCollectors: uniqueCollectors.length,
          averagePerCollector: uniqueCollectors.length > 0 ? totalAmount / uniqueCollectors.length : 0,
        });

        setAlert({
          message: `${filteredDonations.length} doações encontradas`,
          type: ALERT_TYPES.SUCCESS,
        });

        setLoading(false);
      }, 1000);
    } catch (error) {
      setAlert({
        message: "Erro ao buscar doações",
        type: ALERT_TYPES.ERROR,
      });
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterData({
      startDate: "",
      endDate: "",
      collector: "",
      donationType: "",
    });
    setDonations([]);
    setSummary({
      totalDonations: 0,
      totalAmount: 0,
      totalCollectors: 0,
      averagePerCollector: 0,
    });
    setAlert({ message: "", type: "" });
  };

  const exportData = () => {
    if (donations.length === 0) {
      setAlert({
        message: "Nenhuma doação para exportar",
        type: ALERT_TYPES.ERROR,
      });
      return;
    }

    // Simular exportação
    setAlert({
      message: "Dados exportados com sucesso!",
      type: ALERT_TYPES.SUCCESS,
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="count-donations-container">
      <div className="count-donations-content">
        <h3 className="count-donations-title">
          {ICONS.CHART} Contador de Doações
        </h3>

        {/* Filtros */}
        <form className="count-donations-form" onSubmit={handleSearch}>
          <div className="count-donations-section">
            <h4>Filtros de Busca</h4>
            
            <div className="form-row">
              <div className="form-group">
                <FormInput
                  label="Data Inicial"
                  icon={ICONS.CALENDAR}
                  name="startDate"
                  type="date"
                  value={filterData.startDate}
                  onChange={handleFilterChange}
                  classinput="count-donations-input"
                />
              </div>
              
              <div className="form-group">
                <FormInput
                  label="Data Final"
                  icon={ICONS.CALENDAR}
                  name="endDate"
                  type="date"
                  value={filterData.endDate}
                  onChange={handleFilterChange}
                  classinput="count-donations-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <FormSelect
                  label="Coletador"
                  icon={ICONS.MOTORCYCLE}
                  name="collector"
                  value={filterData.collector}
                  options={collectors.map(c => ({ id: c.name, name: c.name }))}
                  onChange={handleFilterChange}
                  disableOption="Todos os coletadores"
                />
              </div>
              
              <div className="form-group">
                <FormSelect
                  label="Tipo de Doação"
                  icon={ICONS.MONEY}
                  name="donationType"
                  value={filterData.donationType}
                  options={[
                    { id: "Dinheiro", name: "Dinheiro" },
                    { id: "PIX", name: "PIX" },
                    { id: "Cartão", name: "Cartão" },
                    { id: "Transferência", name: "Transferência" },
                  ]}
                  onChange={handleFilterChange}
                  disableOption="Todos os tipos"
                />
              </div>
            </div>
          </div>

          <div className="count-donations-actions">
            <button 
              type="button"
              onClick={clearFilters}
              className="count-donations-btn secondary"
            >
              {ICONS.CLEAR} Limpar Filtros
            </button>
            <button 
              type="submit"
              className="count-donations-btn primary"
              disabled={loading}
            >
              {loading ? "Buscando..." : `${ICONS.SEARCH} Buscar Doações`}
            </button>
          </div>
        </form>

        {/* Resumo */}
        {donations.length > 0 && (
          <div className="count-donations-section">
            <h4>Resumo das Doações</h4>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon">{ICONS.DONATE}</div>
                <div className="summary-content">
                  <span className="summary-label">Total de Doações</span>
                  <span className="summary-value">{summary.totalDonations}</span>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">{ICONS.MONEY}</div>
                <div className="summary-content">
                  <span className="summary-label">Valor Total</span>
                  <span className="summary-value">{formatCurrency(summary.totalAmount)}</span>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">{ICONS.MOTORCYCLE}</div>
                <div className="summary-content">
                  <span className="summary-label">Coletadores Ativos</span>
                  <span className="summary-value">{summary.totalCollectors}</span>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">{ICONS.CHART}</div>
                <div className="summary-content">
                  <span className="summary-label">Média por Coletador</span>
                  <span className="summary-value">{formatCurrency(summary.averagePerCollector)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Doações */}
        {donations.length > 0 && (
          <div className="count-donations-section">
            <div className="donations-header">
              <h4>Doações Encontradas ({donations.length})</h4>
              <button 
                onClick={exportData}
                className="count-donations-btn secondary small"
              >
                {ICONS.DOWNLOAD} Exportar
              </button>
            </div>
            
            <div className="donations-table-container">
              <table className="donations-table">
                <thead>
                  <tr>
                    <th>Recibo</th>
                    <th>Doador</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Coletador</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id}>
                      <td className="receipt-cell">{donation.receipt}</td>
                      <td>{donation.donorName}</td>
                      <td className="amount-cell">{formatCurrency(donation.amount)}</td>
                      <td>{formatDate(donation.date)}</td>
                      <td>{donation.collector}</td>
                      <td>
                        <span className={`type-badge type-${donation.type.toLowerCase()}`}>
                          {donation.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mensagem de Status */}
        {alert.message && (
          <div className="count-donations-alert">
            <MessageStatus
              message={alert.message}
              type={alert.type}
              icon={
                alert.type === ALERT_TYPES.SUCCESS
                  ? ICONS.CONFIRMED
                  : alert.type === ALERT_TYPES.ERROR
                  ? ICONS.ALERT
                  : null
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CountDonations;