import React, { useState, useRef, useEffect } from "react";
import supabase from "../../helper/superBaseClient";
import styles from "./monthhistory.module.css";

const MonthHistory = () => {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [allDonors, setAllDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState(null); // null = todos, 'aberto', 'recebida', 'nao_gerado'
  const [collectorFilter, setCollectorFilter] = useState(null); // null = todos ou nome do coletador
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [showCollectorPopup, setShowCollectorPopup] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set()); // Controla quais linhas estão expandidas
  const statusPopupRef = useRef(null);
  const collectorPopupRef = useRef(null);

  const fetchMonthHistory = async () => {
    if (!selectedMonth) {
      alert("Por favor, selecione um mês");
      return;
    }

    setLoading(true);
    try {
      // Buscar todos os doadores mensais com suas informações do donor
      const { data: mensalData, error: mensalError } = await supabase
        .from("donor_mensal")
        .select(`
          donor_id,
          donor_mensal_day,
          donor_mensal_monthly_fee,
          donor:donor_id (
            donor_name,
            donor_tel_1
          )
        `);

      if (mensalError) throw mensalError;

      // Buscar todas as doações do mês de referência
      // Criar datas para o primeiro dia do mês selecionado e o primeiro dia do próximo mês
      const startDate = `${selectedMonth}-01`;
      const [year, month] = selectedMonth.split('-');
      const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      const { data: donationsData, error: donationsError } = await supabase
        .from("donation")
        .select(`
          receipt_donation_id,
          donor_id,
          donation_print,
          donation_received,
          donation_value,
          donation_monthref,
          donation_day_to_receive,
          donation_day_received,
          collector: collector_code_id (collector_name)
        `)
        .gte("donation_monthref", startDate)
        .lt("donation_monthref", endDate);

      if (donationsError) throw donationsError;

      // Criar um mapa de doações por donor_id
      const donationsMap = {};
      donationsData?.forEach((donation) => {
        if (!donationsMap[donation.donor_id]) {
          donationsMap[donation.donor_id] = [];
        }
        donationsMap[donation.donor_id].push(donation);
      });

      // Criar lista unificada de doadores com informações de status
      const donorsList = [];

      mensalData?.forEach((mensal) => {
        const donations = donationsMap[mensal.donor_id] || [];

        // Obter o coletador (nome) da última doação com coletador deste doador no mês
        let collectorName = null;
        for (let i = donations.length - 1; i >= 0; i--) {
          const currentCollectorName = donations[i]?.collector?.collector_name;
          if (currentCollectorName) {
            collectorName = currentCollectorName;
            break;
          }
        }
        
        // Verificar se há alguma doação impressa para este doador no mês
        const hasPrintedDonation = donations.some(
          (d) => d.donation_print === true || d.donation_print === "Sim"
        );

        // Verificar se há alguma doação recebida para este doador no mês
        const hasReceivedDonation = donations.some(
          (d) => d.donation_received === true || d.donation_received === "Sim"
        );

        const donorInfo = {
          donor_id: mensal.donor_id,
          donor_name: mensal.donor?.donor_name || "N/A",
          donor_tel_1: mensal.donor?.donor_tel_1 || "N/A",
          donor_mensal_day: mensal.donor_mensal_day || "N/A",
          donor_mensal_monthly_fee: mensal.donor_mensal_monthly_fee || 0,
          donations: donations,
          total_value: donations.reduce((sum, d) => sum + (d.donation_value || 0), 0),
          movements_count: donations.length,
          isPrinted: hasPrintedDonation,
          isReceived: hasReceivedDonation,
          collector_name: collectorName,
        };

        donorsList.push(donorInfo);
      });

      setAllDonors(donorsList);
    } catch (error) {
      console.error("Erro ao buscar histórico do mês:", error.message);
      alert("Erro ao buscar dados. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (donors) => {
    return donors.reduce((sum, donor) => sum + donor.total_value, 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Fechar popups ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusPopupRef.current && !statusPopupRef.current.contains(event.target)) {
        setShowStatusPopup(false);
      }
      if (collectorPopupRef.current && !collectorPopupRef.current.contains(event.target)) {
        setShowCollectorPopup(false);
      }
    };

    if (showStatusPopup || showCollectorPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusPopup, showCollectorPopup]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setShowStatusPopup(false);
  };

  const handleCollectorFilter = (collectorName) => {
    setCollectorFilter(collectorName);
    setShowCollectorPopup(false);
  };

  const toggleRowExpansion = (donorId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(donorId)) {
      newExpandedRows.delete(donorId);
    } else {
      newExpandedRows.add(donorId);
    }
    setExpandedRows(newExpandedRows);
  };

  const getStatusLabel = (donor) => {
    if (donor.movements_count === 0) {
      return 'nao_gerado';
    }
    return donor.isReceived ? 'recebida' : 'aberto';
  };

  const getFilteredAndSortedData = () => {
    let filtered = allDonors;

    // Aplicar filtro de status
    if (statusFilter) {
      filtered = filtered.filter((donor) => {
        const donorStatus = getStatusLabel(donor);
        return donorStatus === statusFilter;
      });
    }

    // Aplicar filtro de coletador
    if (collectorFilter) {
      filtered = filtered.filter((donor) => donor.collector_name === collectorFilter);
    }

    // Aplicar ordenação
    if (!sortConfig.key) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'day') {
        aValue = a.donor_mensal_day || 0;
        bValue = b.donor_mensal_day || 0;
      }

      if (sortConfig.key === 'name') {
        aValue = (a.donor_name || '').toLowerCase();
        bValue = (b.donor_name || '').toLowerCase();
      }

      if (sortConfig.key === 'phone') {
        aValue = (a.donor_tel_1 || '').toLowerCase();
        bValue = (b.donor_tel_1 || '').toLowerCase();
      }

      if (sortConfig.key === 'monthly_fee') {
        aValue = parseFloat(a.donor_mensal_monthly_fee || 0);
        bValue = parseFloat(b.donor_mensal_monthly_fee || 0);
      }

      if (sortConfig.key === 'movements') {
        aValue = a.movements_count || 0;
        bValue = b.movements_count || 0;
      }

      if (sortConfig.key === 'value') {
        aValue = parseFloat(a.total_value || 0);
        bValue = parseFloat(b.total_value || 0);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const dataToShow = getFilteredAndSortedData();
  const collectorOptions = Array.from(
    new Set(
      allDonors
        .map((donor) => donor.collector_name)
        .filter((name) => !!name)
    )
  ).sort();

  return (
    <div className={styles.monthHistory}>
      <div className={styles.monthHistoryHeader}>
        <div className={styles.inputGroup}>
          <label htmlFor="month">Mês</label>
          <input
            type="month"
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
        <div className={styles.button}>
          <button onClick={fetchMonthHistory} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      <div className={styles.monthHistoryContent}>
        {/* Tabela Unificada */}
        <div className={styles.tableSection}>
          <h2 className={styles.tableTitle}>
            Doadores ({dataToShow.length})
          </h2>
          <div className={styles.tableContainer}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th
                    className={styles.sortable}
                    onClick={() => handleSort('day')}
                    style={{ cursor: 'pointer' }}
                  >
                    Dia
                    <span className={styles.sortArrow}>
                      {sortConfig.key === 'day' ? (
                        sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
                      ) : ' ↕'}
                    </span>
                  </th>
                  <th
                    className={styles.sortable}
                    onClick={() => handleSort('name')}
                    style={{ cursor: 'pointer' }}
                  >
                    Doador
                    <span className={styles.sortArrow}>
                      {sortConfig.key === 'name' ? (
                        sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
                      ) : ' ↕'}
                    </span>
                  </th>
                  <th
                    className={styles.sortable}
                    onClick={() => handleSort('phone')}
                    style={{ cursor: 'pointer' }}
                  >
                    Telefone
                    <span className={styles.sortArrow}>
                      {sortConfig.key === 'phone' ? (
                        sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
                      ) : ' ↕'}
                    </span>
                  </th>
                  <th
                    className={styles.sortable}
                    onClick={() => handleSort('monthly_fee')}
                    style={{ cursor: 'pointer' }}
                  >
                    Mensalidade
                    <span className={styles.sortArrow}>
                      {sortConfig.key === 'monthly_fee' ? (
                        sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
                      ) : ' ↕'}
                    </span>
                  </th>
                  <th
                    className={styles.sortable}
                    onClick={() => handleSort('movements')}
                    style={{ cursor: 'pointer' }}
                  >
                    Movimentos
                    <span className={styles.sortArrow}>
                      {sortConfig.key === 'movements' ? (
                        sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
                      ) : ' ↕'}
                    </span>
                  </th>
                  <th
                    className={styles.statusHeader}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCollectorPopup(!showCollectorPopup);
                    }}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    Coletador
                    {collectorFilter && (
                      <span className={styles.filterIndicator}>●</span>
                    )}
                    {showCollectorPopup && (
                      <div
                        ref={collectorPopupRef}
                        className={styles.statusPopup}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className={`${styles.popupOption} ${collectorFilter === null ? styles.popupOptionActive : ''}`}
                          onClick={() => handleCollectorFilter(null)}
                        >
                          Todos
                        </div>
                        {collectorOptions.map((name) => (
                          <div
                            key={name}
                            className={`${styles.popupOption} ${collectorFilter === name ? styles.popupOptionActive : ''}`}
                            onClick={() => handleCollectorFilter(name)}
                          >
                            {name}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                  <th
                    className={styles.sortable}
                    onClick={() => handleSort('value')}
                    style={{ cursor: 'pointer' }}
                  >
                    Valor
                    <span className={styles.sortArrow}>
                      {sortConfig.key === 'value' ? (
                        sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
                      ) : ' ↕'}
                    </span>
                  </th>
                  <th 
                    className={styles.statusHeader}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowStatusPopup(!showStatusPopup);
                    }}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    Status
                    {statusFilter && (
                      <span className={styles.filterIndicator}>●</span>
                    )}
                    {showStatusPopup && (
                      <div 
                        ref={statusPopupRef}
                        className={styles.statusPopup}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div 
                          className={`${styles.popupOption} ${statusFilter === null ? styles.popupOptionActive : ''}`}
                          onClick={() => handleStatusFilter(null)}
                        >
                          Todos
                        </div>
                        <div 
                          className={`${styles.popupOption} ${statusFilter === 'aberto' ? styles.popupOptionActive : ''}`}
                          onClick={() => handleStatusFilter('aberto')}
                        >
                          Aberto
                        </div>
                        <div 
                          className={`${styles.popupOption} ${statusFilter === 'recebida' ? styles.popupOptionActive : ''}`}
                          onClick={() => handleStatusFilter('recebida')}
                        >
                          Recebida
                        </div>
                        <div 
                          className={`${styles.popupOption} ${statusFilter === 'nao_gerado' ? styles.popupOptionActive : ''}`}
                          onClick={() => handleStatusFilter('nao_gerado')}
                        >
                          Não gerado
                        </div>
                      </div>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataToShow.length > 0 ? (
                  dataToShow.map((donor) => {
                    const isExpanded = expandedRows.has(donor.donor_id);
                    return (
                      <React.Fragment key={donor.donor_id}>
                        <tr 
                          onClick={() => toggleRowExpansion(donor.donor_id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ textAlign: 'center', width: '40px' }}>
                            <span className={styles.expandArrow}>
                              {isExpanded ? '▼' : '▶'}
                            </span>
                          </td>
                          <td>{donor.donor_mensal_day}</td>
                          <td>{donor.donor_name}</td>
                          <td>{donor.donor_tel_1}</td>
                          <td>{formatCurrency(donor.donor_mensal_monthly_fee)}</td>
                          <td>{donor.movements_count}</td>
                          <td>{donor.collector_name || "-"}</td>
                          <td>{formatCurrency(donor.total_value)}</td>
                          <td>
                            {donor.movements_count === 0 ? (
                              <span className={`${styles.statusBadge} ${styles.statusNotGenerated}`}>
                                ○ Não gerado
                              </span>
                            ) : (
                              <span className={`${styles.statusBadge} ${donor.isReceived ? styles.statusSuccess : styles.statusPending}`}>
                                {donor.isReceived ? "✓ Recebida" : "○ Aberto"}
                              </span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && donor.donations && donor.donations.length > 0 && (
                          <tr>
                            <td colSpan="9" className={styles.expandedContent}>
                              <div className={styles.donationsContainer}>
                                <h4 className={styles.donationsTitle}>Movimentos do Doador</h4>
                                <table className={styles.donationsTable}>
                                  <thead>
                                    <tr>
                                      <th>Recibo</th>
                                      <th>Valor</th>
                                      <th>Mês Ref.</th>
                                      <th>Data Receber</th>
                                      <th>Data Recebida</th>
                                      <th>Coletador</th>
                                      <th>Impresso</th>
                                      <th>Recebido</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {donor.donations.map((donation) => (
                                      <tr key={donation.receipt_donation_id || Math.random()}>
                                        <td>{donation.receipt_donation_id || "-"}</td>
                                        <td>{formatCurrency(donation.donation_value || 0)}</td>
                                        <td>
                                          {donation.donation_monthref
                                            ? new Date(donation.donation_monthref).toLocaleDateString("pt-BR", {
                                                month: "2-digit",
                                                year: "numeric",
                                                timeZone: "UTC"
                                              })
                                            : "-"}
                                        </td>
                                        <td>
                                          {donation.donation_day_to_receive
                                            ? new Date(donation.donation_day_to_receive).toLocaleDateString("pt-BR", {
                                                timeZone: "UTC"
                                              })
                                            : "-"}
                                        </td>
                                        <td>
                                          {donation.donation_day_received
                                            ? new Date(donation.donation_day_received).toLocaleDateString("pt-BR", {
                                                timeZone: "UTC"
                                              })
                                            : "-"}
                                        </td>
                                        <td>{donation.collector?.collector_name || "-"}</td>
                                        <td>
                                          {donation.donation_print === true || donation.donation_print === "Sim" ? (
                                            <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>
                                              ✓ Sim
                                            </span>
                                          ) : (
                                            <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                                              ○ Não
                                            </span>
                                          )}
                                        </td>
                                        <td>
                                          {donation.donation_received === true || donation.donation_received === "Sim" ? (
                                            <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>
                                              ✓ Sim
                                            </span>
                                          ) : (
                                            <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                                              ○ Não
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      {loading
                        ? "Carregando..."
                        : "Nenhum doador encontrado"}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="8" style={{ textAlign: "right", fontWeight: "bold" }}>
                    Total:
                  </td>
                  <td style={{ fontWeight: "bold" }}>
                    {formatCurrency(calculateTotal(dataToShow))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthHistory;
