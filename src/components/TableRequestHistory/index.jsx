import { useState, useMemo } from "react";
import styles from "./tablerequesthistory.module.css";
import ModalOperatorActivity from "../ModalOperatorActivity";
import { ACTIVITY_TYPES } from "../../services/operatorActivityService";

const TableRequestHistory = ({
  operatorActivities = { grouped: {} },
  dateFilter = {},
}) => {
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Calcula as contagens de leads a partir das atividades
  const calculateLeadsCounts = (counts) => {
    const leadsNA = (counts?.[ACTIVITY_TYPES.LEAD_NOT_ANSWERED] || 0);
    const leadsNP = (counts?.[ACTIVITY_TYPES.LEAD_CANNOT_HELP] || 0);
    const leadsScheduled = (counts?.[ACTIVITY_TYPES.LEAD_SCHEDULED] || 0);
    const leadsSuccess = (counts?.[ACTIVITY_TYPES.LEAD_SUCCESS] || 0) + 
                         (counts?.[ACTIVITY_TYPES.LEAD_DONATION_FROM_SCHEDULED] || 0);
    const totalLeads = leadsNA + leadsNP + leadsScheduled + leadsSuccess;
    
    return { leadsNA, leadsNP, leadsScheduled, leadsSuccess, totalLeads };
  };

  // Calcula as contagens de requisição (excluindo leads)
  const calculateRequisicaoCounts = (counts) => {
    const reqNA = counts?.[ACTIVITY_TYPES.NOT_ANSWERED] || 0;
    const reqNP = counts?.[ACTIVITY_TYPES.CANNOT_HELP] || 0;
    const reqScheduled = counts?.[ACTIVITY_TYPES.SCHEDULED] || 0;
    const newDonation = counts?.[ACTIVITY_TYPES.NEW_DONATION] || 0;
    const worklistClicks = counts?.[ACTIVITY_TYPES.WORKLIST_CLICK] || 0;
    const whatsapp = counts?.[ACTIVITY_TYPES.WHATSAPP] || 0;
    const totalRequisicao = reqNA + reqNP + reqScheduled + newDonation + worklistClicks + whatsapp;
    
    return { reqNA, reqNP, reqScheduled, newDonation, worklistClicks, whatsapp, totalRequisicao };
  };

  // Processa dados de atividades das operadoras
  const combinedData = useMemo(() => {
    const allOperators = Object.keys(operatorActivities.grouped || {});

    return allOperators.map((name) => {
      const activityData = operatorActivities.grouped?.[name] || {};
      const counts = activityData.counts || {};
      
      const requisicaoCounts = calculateRequisicaoCounts(counts);
      const leadsCounts = calculateLeadsCounts(counts);

      return {
        operatorName: name,
        operatorId: activityData.operatorId,
        // Atividades de Requisição
        ...requisicaoCounts,
        // Atividades de Leads
        ...leadsCounts,
        // Contagens originais para o modal
        activityCounts: counts,
        // Total geral
        totalGeral: requisicaoCounts.totalRequisicao + leadsCounts.totalLeads,
      };
    });
  }, [operatorActivities]);

  // Ordenação
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return combinedData;

    return [...combinedData].sort((a, b) => {
      const aValue = a[sortConfig.key] || 0;
      const bValue = b[sortConfig.key] || 0;

      if (sortConfig.direction === "asc") {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
  }, [combinedData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleRowClick = (operatorData) => {
    setSelectedOperator({
      operatorId: operatorData.operatorId,
      operatorName: operatorData.operatorName,
      activityCounts: operatorData.activityCounts,
      totalRequisicao: operatorData.totalRequisicao,
      totalLeads: operatorData.totalLeads,
    });
    setIsModalOpen(true);
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // Calcula totais
  const totals = useMemo(() => {
    return sortedData.reduce(
      (acc, item) => ({
        // Requisição
        reqNA: acc.reqNA + (item.reqNA || 0),
        reqNP: acc.reqNP + (item.reqNP || 0),
        reqScheduled: acc.reqScheduled + (item.reqScheduled || 0),
        newDonation: acc.newDonation + (item.newDonation || 0),
        worklistClicks: acc.worklistClicks + (item.worklistClicks || 0),
        whatsapp: acc.whatsapp + (item.whatsapp || 0),
        totalRequisicao: acc.totalRequisicao + (item.totalRequisicao || 0),
        // Leads
        leadsNA: acc.leadsNA + (item.leadsNA || 0),
        leadsNP: acc.leadsNP + (item.leadsNP || 0),
        leadsScheduled: acc.leadsScheduled + (item.leadsScheduled || 0),
        leadsSuccess: acc.leadsSuccess + (item.leadsSuccess || 0),
        totalLeads: acc.totalLeads + (item.totalLeads || 0),
        // Geral
        totalGeral: acc.totalGeral + (item.totalGeral || 0),
      }),
      {
        reqNA: 0,
        reqNP: 0,
        reqScheduled: 0,
        newDonation: 0,
        worklistClicks: 0,
        whatsapp: 0,
        totalRequisicao: 0,
        leadsNA: 0,
        leadsNP: 0,
        leadsScheduled: 0,
        leadsSuccess: 0,
        totalLeads: 0,
        totalGeral: 0,
      }
    );
  }, [sortedData]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          Histórico de Atividades - Requisição & Leads
        </h3>
        <p className={styles.subtitle}>
          Clique em uma linha para ver o histórico detalhado
        </p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr className={styles.headerGroupRow}>
              <th className={styles.th} rowSpan="2">Operador</th>
              <th className={`${styles.th} ${styles.groupHeader} ${styles.requisicaoGroup}`} colSpan="6">
                Requisição
              </th>
              <th className={`${styles.th} ${styles.groupHeader} ${styles.leadsGroup}`} colSpan="4">
                Leads
              </th>
              <th className={styles.th} rowSpan="2">
                <span className={styles.thContent}>
                  Total
                  <span className={styles.sortArrow} onClick={() => handleSort("totalGeral")}>
                    {getSortIndicator("totalGeral")}
                  </span>
                </span>
              </th>
            </tr>
            <tr>
              {/* Requisição */}
              <th
                className={`${styles.th} ${styles.sortable} ${styles.subHeader}`}
                onClick={() => handleSort("worklistClicks")}
              >
                <span className={styles.thContent}>
                  Acessos
                  <span className={styles.sortArrow}>
                    {getSortIndicator("worklistClicks")}
                  </span>
                </span>
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${styles.subHeader}`}
                onClick={() => handleSort("reqNA")}
              >
                <span className={styles.thContent}>
                  N/A
                  <span className={styles.sortArrow}>
                    {getSortIndicator("reqNA")}
                  </span>
                </span>
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${styles.subHeader}`}
                onClick={() => handleSort("reqNP")}
              >
                <span className={styles.thContent}>
                  N/P
                  <span className={styles.sortArrow}>
                    {getSortIndicator("reqNP")}
                  </span>
                </span>
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${styles.subHeader}`}
                onClick={() => handleSort("reqScheduled")}
              >
                <span className={styles.thContent}>
                  Agend.
                  <span className={styles.sortArrow}>
                    {getSortIndicator("reqScheduled")}
                  </span>
                </span>
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${styles.subHeader}`}
                onClick={() => handleSort("whatsapp")}
              >
                <span className={styles.thContent}>
                  Whats
                  <span className={styles.sortArrow}>
                    {getSortIndicator("whatsapp")}
                  </span>
                </span>
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${styles.subHeader}`}
                onClick={() => handleSort("newDonation")}
              >
                <span className={styles.thContent}>
                  Doações
                  <span className={styles.sortArrow}>
                    {getSortIndicator("newDonation")}
                  </span>
                </span>
              </th>
              {/* Leads */}
              <th
                className={`${styles.th} ${styles.sortable} ${styles.subHeader}`}
                onClick={() => handleSort("leadsNA")}
              >
                <span className={styles.thContent}>
                  N/A
                  <span className={styles.sortArrow}>
                    {getSortIndicator("leadsNA")}
                  </span>
                </span>
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${styles.subHeader}`}
                onClick={() => handleSort("leadsNP")}
              >
                <span className={styles.thContent}>
                  N/P
                  <span className={styles.sortArrow}>
                    {getSortIndicator("leadsNP")}
                  </span>
                </span>
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${styles.subHeader}`}
                onClick={() => handleSort("leadsScheduled")}
              >
                <span className={styles.thContent}>
                  Agend.
                  <span className={styles.sortArrow}>
                    {getSortIndicator("leadsScheduled")}
                  </span>
                </span>
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${styles.subHeader}`}
                onClick={() => handleSort("leadsSuccess")}
              >
                <span className={styles.thContent}>
                  Sucesso
                  <span className={styles.sortArrow}>
                    {getSortIndicator("leadsSuccess")}
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan="12" className={styles.emptyRow}>
                  <div className={styles.emptyState}>
                    <p>Nenhuma atividade registrada</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr
                  key={item.operatorName}
                  className={styles.tr}
                  onClick={() => handleRowClick(item)}
                >
                  <td className={styles.td}>
                    <span className={styles.operatorName}>
                      {item.operatorName}
                    </span>
                  </td>
                  {/* Requisição */}
                  <td className={`${styles.td} ${styles.requisicaoCell}`}>
                    <span className={`${styles.badge} ${styles.neutral}`}>
                      {item.worklistClicks}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.requisicaoCell}`}>
                    <span className={`${styles.badge} ${styles.warning}`}>
                      {item.reqNA}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.requisicaoCell}`}>
                    <span className={`${styles.badge} ${styles.danger}`}>
                      {item.reqNP}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.requisicaoCell}`}>
                    <span className={`${styles.badge} ${styles.info}`}>
                      {item.reqScheduled}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.requisicaoCell}`}>
                    <span className={`${styles.badge} ${styles.whatsapp}`}>
                      {item.whatsapp}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.requisicaoCell}`}>
                    <span className={`${styles.badge} ${styles.success}`}>
                      {item.newDonation}
                    </span>
                  </td>
                  {/* Leads */}
                  <td className={`${styles.td} ${styles.leadsCell}`}>
                    <span className={`${styles.badge} ${styles.warning}`}>
                      {item.leadsNA}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.leadsCell}`}>
                    <span className={`${styles.badge} ${styles.danger}`}>
                      {item.leadsNP}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.leadsCell}`}>
                    <span className={`${styles.badge} ${styles.info}`}>
                      {item.leadsScheduled}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.leadsCell}`}>
                    <span className={`${styles.badge} ${styles.successAlt}`}>
                      {item.leadsSuccess}
                    </span>
                  </td>
                  {/* Total */}
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${styles.total}`}>
                      {item.totalGeral}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {sortedData.length > 0 && (
            <tfoot className={styles.tableFoot}>
              <tr className={styles.totalRow}>
                <td className={styles.td}>
                  <strong>Total</strong>
                </td>
                {/* Requisição */}
                <td className={`${styles.td} ${styles.requisicaoCell}`}>
                  <span className={`${styles.badge} ${styles.neutral}`}>
                    {totals.worklistClicks}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.requisicaoCell}`}>
                  <span className={`${styles.badge} ${styles.warning}`}>
                    {totals.reqNA}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.requisicaoCell}`}>
                  <span className={`${styles.badge} ${styles.danger}`}>
                    {totals.reqNP}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.requisicaoCell}`}>
                  <span className={`${styles.badge} ${styles.info}`}>
                    {totals.reqScheduled}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.requisicaoCell}`}>
                  <span className={`${styles.badge} ${styles.whatsapp}`}>
                    {totals.whatsapp}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.requisicaoCell}`}>
                  <span className={`${styles.badge} ${styles.success}`}>
                    {totals.newDonation}
                  </span>
                </td>
                {/* Leads */}
                <td className={`${styles.td} ${styles.leadsCell}`}>
                  <span className={`${styles.badge} ${styles.warning}`}>
                    {totals.leadsNA}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.leadsCell}`}>
                  <span className={`${styles.badge} ${styles.danger}`}>
                    {totals.leadsNP}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.leadsCell}`}>
                  <span className={`${styles.badge} ${styles.info}`}>
                    {totals.leadsScheduled}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.leadsCell}`}>
                  <span className={`${styles.badge} ${styles.successAlt}`}>
                    {totals.leadsSuccess}
                  </span>
                </td>
                {/* Total */}
                <td className={styles.td}>
                  <span className={`${styles.badge} ${styles.total}`}>
                    {totals.totalGeral}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {isModalOpen && selectedOperator && (
        <ModalOperatorActivity
          operator={selectedOperator}
          dateFilter={dateFilter}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOperator(null);
          }}
        />
      )}
    </div>
  );
};

export default TableRequestHistory;
