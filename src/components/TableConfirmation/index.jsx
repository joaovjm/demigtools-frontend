import React, { useState, useEffect } from "react";
import styles from "./tableconfirmation.module.css";
import { DataSelect } from "../DataTime";
import { logDonationOpenedUpsert } from "../../helper/donationOpenedLog";
import supabase from "../../helper/superBaseClient";

const TableConfirmation = ({
  donationConfirmation,
  setModalOpen,
  setDonationConfirmationOpen,
  donationFilterPerId,
  showOpenedColumn = false,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [expandedDonors, setExpandedDonors] = useState({});
  const [openedLogs, setOpenedLogs] = useState({});

  // Busca os logs de abertura se showOpenedColumn estiver ativo
  useEffect(() => {
    const fetchOpenedLogs = async () => {
      if (!showOpenedColumn || donationConfirmation.length === 0) return;

      try {
        const receiptIds = donationConfirmation.map(d => d.receipt_donation_id);
        
        const { data, error } = await supabase
          .from("donation_opened_log")
          .select("receipt_donation_id, opened_at")
          .in("receipt_donation_id", receiptIds);

        if (error) throw error;

        // Cria um mapa de receipt_donation_id -> opened_at
        const logsMap = {};
        data.forEach(log => {
          logsMap[log.receipt_donation_id] = log.opened_at;
        });
        
        setOpenedLogs(logsMap);
      } catch (error) {
        console.error("Erro ao buscar logs de abertura:", error);
      }
    };

    fetchOpenedLogs();
  }, [showOpenedColumn, donationConfirmation]);

  const handleClick = async (donation) => {
    // Registra a data e hora que a doação foi aberta
    await logDonationOpenedUpsert(donation.receipt_donation_id);
    
    setDonationConfirmationOpen({
      id: donation.receipt_donation_id,
      donor_id: donation.donor_id,
      name: donation.donor_name,
      value: donation.donation_value,
      reason: donation.donor_confirmation_reason,
      address: donation.donor_address,
      phone: donation.donor_tel_1,
      phone2: donation.donor_tel_2,
      phone3: donation.donor_tel_3,
      extra: donation.donation_extra,
      day_contact: donation.donation_day_contact,
      day_to_receive: donation.donation_day_to_receive,
      print: donation.donation_print,
      monthref: donation.donation_monthref,
      description: donation.donation_description,
      operator_code_id: donation.operator_code_id,
      collector_code_id: donation.collector_code_id,
      donation_received: donation.donation_received,
      confirmation_scheduled: donation.confirmation_scheduled,
      confirmation_status: donation.confirmation_status,
    });
    setModalOpen(true);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleExpand = (donorId) => {
    setExpandedDonors(prev => ({
      ...prev,
      [donorId]: !prev[donorId]
    }));
  };

  // Formata a data/hora de abertura
  const formatOpenedDate = (receiptId) => {
    if (!openedLogs[receiptId]) return '-';
    
    return new Date(openedLogs[receiptId]).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filterDonationConfirmation = donationConfirmation.filter(
    (dc) => dc.operator_code_id === donationFilterPerId
  );

  const getFilteredData = () => {
    return donationFilterPerId ? filterDonationConfirmation : donationConfirmation;
  };

  // Agrupa doações por doador
  const groupByDonor = (donations) => {
    const grouped = {};
    donations.forEach(donation => {
      const donorId = donation.donor_id;
      if (!grouped[donorId]) {
        grouped[donorId] = {
          donor_id: donorId,
          donor_name: donation.donor_name,
          donor_mensal_day: donation.donor_mensal_day,
          donations: [],
          totalValue: 0,
          latestDate: null,
        };
      }
      grouped[donorId].donations.push(donation);
      grouped[donorId].totalValue += parseFloat(donation.donation_value || 0);
      
      const donationDate = new Date(donation.donation_day_to_receive || 0);
      if (!grouped[donorId].latestDate || donationDate > grouped[donorId].latestDate) {
        grouped[donorId].latestDate = donationDate;
        grouped[donorId].latestDateStr = donation.donation_day_to_receive;
      }
    });
    return Object.values(grouped);
  };

  const getSortedGroupedData = () => {
    const filtered = getFilteredData();
    const grouped = groupByDonor(filtered);

    if (!sortConfig.key) {
      return grouped;
    }

    return [...grouped].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'date') {
        aValue = a.latestDate ? a.latestDate.getTime() : 0;
        bValue = b.latestDate ? b.latestDate.getTime() : 0;
      }

      if (sortConfig.key === 'day') {
        aValue = a.donor_mensal_day || 0;
        bValue = b.donor_mensal_day || 0;
      }

      if (sortConfig.key === 'value') {
        aValue = a.totalValue;
        bValue = b.totalValue;
      }

      if (sortConfig.key === 'name') {
        aValue = (a.donor_name || '').toLowerCase();
        bValue = (b.donor_name || '').toLowerCase();
      }

      if (sortConfig.key === 'opened') {
        // Para grupos com múltiplas doações, usa a mais recente abertura
        const aFirstDonation = a.donations[0];
        const bFirstDonation = b.donations[0];
        aValue = openedLogs[aFirstDonation?.receipt_donation_id] 
          ? new Date(openedLogs[aFirstDonation.receipt_donation_id]).getTime() 
          : 0;
        bValue = openedLogs[bFirstDonation?.receipt_donation_id] 
          ? new Date(openedLogs[bFirstDonation.receipt_donation_id]).getTime() 
          : 0;
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

  const groupedData = getSortedGroupedData();
  const totalDonations = getFilteredData().length;

  return (
    <div className={styles.tableConfirmationContainer}>
      <div className={styles.tableConfirmationContent}>
        {groupedData.length > 0 ? (
          <div className={styles.tableConfirmationWrapper}>
            <div className={styles.tableConfirmationHeader}>
              <div className={styles.tableConfirmationStats}>
                <span className={styles.statsItem}>
                  <strong>{groupedData.length}</strong> {groupedData.length === 1 ? 'doador' : 'doadores'} · <strong>{totalDonations}</strong> {totalDonations === 1 ? 'confirmação' : 'confirmações'}
                </span>
                <span className={styles.statsItem}>
                  Total: <strong>
                    {groupedData.reduce((acc, item) => acc + item.totalValue, 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </strong>
                </span>
              </div>
            </div>

            <div className={styles.tableConfirmationScroll}>
              <table className={styles.tableConfirmation}>
                <thead>
                  <tr className={styles.tableConfirmationHeadRow}>
                    <th
                      className={`${styles.tableConfirmationHead} ${styles.sortable}`}
                      onClick={() => handleSort('date')}
                      style={{ cursor: 'pointer' }}
                    >
                      Data
                      <span className={styles.sortArrow}>
                        {sortConfig.key === 'date' ? (
                          sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th
                      className={`${styles.tableConfirmationHead} ${styles.sortable}`}
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
                      className={`${styles.tableConfirmationHead} ${styles.sortable}`}
                      onClick={() => handleSort('name')}
                      style={{ cursor: 'pointer' }}
                    >
                      Nome
                      <span className={styles.sortArrow}>
                        {sortConfig.key === 'name' ? (
                          sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th
                      className={`${styles.tableConfirmationHead} ${styles.sortable}`}
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
                    <th className={styles.tableConfirmationHead}>Operador</th>
                    <th className={styles.tableConfirmationHead}>Motivo</th>
                    <th className={styles.tableConfirmationHead}>Status</th>
                    <th className={styles.tableConfirmationHead}>Agendado</th>
                    {showOpenedColumn && (
                      <th
                        className={`${styles.tableConfirmationHead} ${styles.sortable}`}
                        onClick={() => handleSort('opened')}
                        style={{ cursor: 'pointer' }}
                      >
                        Aberta em
                        <span className={styles.sortArrow}>
                          {sortConfig.key === 'opened' ? (
                            sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
                          ) : ' ↕'}
                        </span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {groupedData.map((group) => {
                    const hasMultiple = group.donations.length > 1;
                    const isExpanded = expandedDonors[group.donor_id];
                    const firstDonation = group.donations[0];

                    return (
                      <React.Fragment key={group.donor_id}>
                        {/* Linha principal do doador */}
                        <tr
                          className={`${styles.tableConfirmationRow} ${hasMultiple ? styles.groupRow : ''} ${isExpanded ? styles.groupRowExpanded : ''}`}
                          onClick={() => {
                            if (hasMultiple) {
                              toggleExpand(group.donor_id);
                            } else {
                              handleClick(firstDonation);
                            }
                          }}
                        >
                          <td className={styles.tableConfirmationCell}>
                            <span className={styles.dateInfo}>
                              {DataSelect(group.latestDateStr)}
                            </span>
                          </td>
                          <td className={styles.tableConfirmationCell}>
                            <span className={styles.dayInfo}>
                              {group.donor_mensal_day ? `Dia ${group.donor_mensal_day}` : '-'}
                            </span>
                          </td>
                          <td className={styles.tableConfirmationCell}>
                            <span className={styles.donorName}>
                              {hasMultiple && (
                                <span className={styles.expandIcon}>
                                  {isExpanded ? '▼' : '▶'}
                                </span>
                              )}
                              {group.donor_name}
                              {hasMultiple && (
                                <span className={styles.donationCount}>
                                  {group.donations.length}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className={styles.tableConfirmationCell}>
                            <span className={styles.valueAmount}>
                              {group.totalValue.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          </td>
                          <td className={styles.tableConfirmationCell}>
                            <span className={styles.operatorText}>
                              {firstDonation.operator_name}
                            </span>
                          </td>
                          <td className={styles.tableConfirmationCell}>
                            <span className={styles.reasonText}>
                              {hasMultiple ? `${group.donations.length} doações` : firstDonation.donor_confirmation_reason}
                            </span>
                          </td>
                          <td className={styles.tableConfirmationCell}>
                            {hasMultiple ? (
                              <span className={styles.statusMultiple}>Múltiplas</span>
                            ) : (
                              <span className={`${styles.statusBadge} ${firstDonation.confirmation_status === 'Agendado' ? styles.statusScheduled : firstDonation.confirmation_status === 'Não Atendeu' ? styles.statusNotAttended : styles.statusNone}`}>
                                {firstDonation.confirmation_status || '-'}
                              </span>
                            )}
                          </td>
                          <td className={styles.tableConfirmationCell}>
                            <span className={styles.scheduleDate}>
                              {hasMultiple ? '-' : (firstDonation.confirmation_scheduled ? DataSelect(firstDonation.confirmation_scheduled) : '-')}
                            </span>
                          </td>
                          {showOpenedColumn && (
                            <td className={styles.tableConfirmationCell}>
                              <span className={styles.openedDate}>
                                {hasMultiple ? '-' : formatOpenedDate(firstDonation.receipt_donation_id)}
                              </span>
                            </td>
                          )}
                        </tr>

                        {/* Linhas expandidas para doações individuais */}
                        {hasMultiple && isExpanded && group.donations.map((donation) => (
                          <tr
                            className={`${styles.tableConfirmationRow} ${styles.subRow}`}
                            key={donation.receipt_donation_id}
                            onClick={() => handleClick(donation)}
                          >
                            <td className={styles.tableConfirmationCell}>
                              <span className={styles.dateInfo}>
                                {DataSelect(donation.donation_day_to_receive)}
                              </span>
                            </td>
                            <td className={styles.tableConfirmationCell}>
                              <span className={styles.dayInfo}>
                                {donation.donor_mensal_day ? `Dia ${donation.donor_mensal_day}` : '-'}
                              </span>
                            </td>
                            <td className={styles.tableConfirmationCell}>
                              <span className={styles.subRowIndicator}>↳</span>
                              <span className={styles.donorNameSub}>
                                {donation.donor_name}
                              </span>
                            </td>
                            <td className={styles.tableConfirmationCell}>
                              <span className={styles.valueAmount}>
                                {parseFloat(donation.donation_value || 0).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                            </td>
                            <td className={styles.tableConfirmationCell}>
                              <span className={styles.reasonText}>
                                {donation.donor_confirmation_reason}
                              </span>
                            </td>
                            <td className={styles.tableConfirmationCell}>
                              <span className={`${styles.statusBadge} ${donation.confirmation_status === 'Agendado' ? styles.statusScheduled : donation.confirmation_status === 'Não Atendeu' ? styles.statusNotAttended : styles.statusNone}`}>
                                {donation.confirmation_status || '-'}
                              </span>
                            </td>
                            <td className={styles.tableConfirmationCell}>
                              <span className={styles.scheduleDate}>
                                {donation.confirmation_scheduled ? DataSelect(donation.confirmation_scheduled) : '-'}
                              </span>
                            </td>
                            {showOpenedColumn && (
                              <td className={styles.tableConfirmationCell}>
                                <span className={styles.openedDate}>
                                  {formatOpenedDate(donation.receipt_donation_id)}
                                </span>
                              </td>
                            )}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.tableConfirmationEmpty}>
            <div className={styles.emptyIcon}>✅</div>
            <h4>Nenhuma confirmação pendente</h4>
            <p>Não há fichas a serem confirmadas no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableConfirmation;
