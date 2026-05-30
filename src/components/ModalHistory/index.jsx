import React, { useEffect, useState } from "react";
import style from "./modalhistory.module.css";
import { fetchLeadsHistory as fetchLeadsHistoryApi } from "../../api/leadsApi.js";

const ModalHistory = ({ onClose, operatorData }) => {
  const [leadsHistory, setLeadsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const resp = await fetchLeadsHistoryApi({
          operatorCodeId: operatorData.operator_code_id,
        });
        setLeadsHistory(resp?.data ?? []);
      } catch (error) {
        console.log(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [operatorData.operator_code_id]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "ativo":
      case "contactado":
        return "status-success";
      case "pendente":
      case "aguardando":
        return "status-pending";
      case "inativo":
      case "cancelado":
        return "status-inactive";
      default:
        return "status-default";
    }
  };

  const formatStatus = (status) => {
    const statusMap = {
      ativo: "✓ Ativo",
      contactado: "✓ Contactado",
      pendente: "○ Pendente",
      aguardando: "○ Aguardando",
      inativo: "✗ Inativo",
      cancelado: "✗ Cancelado",
    };
    return statusMap[status?.toLowerCase()] || status || "—";
  };

  const formatDate = (value) => {
    if (value == null || value === "") return "—";
    const s = String(value).trim();
    // Só data (YYYY-MM-DD): evitar interpretação como UTC meia-noite (vira 21h no BR em muitos browsers)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, mo, da] = s.split("-").map(Number);
      const localDay = new Date(y, mo - 1, da);
      if (Number.isNaN(localDay.getTime())) return "—";
      return localDay.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={style.modalhistory}>
      <div className={style.modalhistorycontent}>
        <div className={style.modalhistoryheader}>
          <div className={style.headerInfo}>
            <h1 className={style.modalhistorytitle}>📋 Histórico de Leads</h1>
            <p className={style.operatorInfo}>
              Operador: <strong>{operatorData.operator_name}</strong> (
              {operatorData.operator_code_id})
            </p>
          </div>
          <div className={style.statsItem}>
            <span className={style.statsNumber}>{leadsHistory.length}</span>
            <span className={style.statsLabel}>
              {leadsHistory.length === 1 ? "Lead" : "Leads"}
            </span>
          </div>
          <button
            onClick={onClose}
            className={style.closeButton}
            title="Fechar modal"
          >
            ✕
          </button>
        </div>

        <div className={style.modalhistorybody}>
          {loading ? (
            <div className={style.loadingState}>
              <div className={style.loadingSpinner}></div>
              <p>Carregando histórico de leads...</p>
            </div>
          ) : leadsHistory.length > 0 ? (
            <>

              {/* Table Section */}
              <div className={style.tableWrapper}>
                <div className={style.tableScroll}>
                  <table className={style.leadsTable}>
                    <thead>
                      <tr className={style.tableHeaderRow}>
                        <th className={style.tableHeader}>Nome</th>
                        <th className={style.tableHeader}>Telefone</th>
                        <th className={style.tableHeader}>Data de Acesso</th>
                        <th className={style.tableHeader}>Status</th>
                        <th className={style.tableHeader}>Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadsHistory.map((lead, index) => (
                        <tr
                          key={lead.leads_id}
                          className={`${style.tableRow} ${
                            index % 2 === 0 ? style.evenRow : style.oddRow
                          }`}
                        >
                          <td className={style.tableCell}>
                            <div className={style.leadName}>
                              <strong>{lead.leads_name || "—"}</strong>
                              {lead.leads_id && (
                                <span className={style.leadId}>
                                  #{lead.leads_id}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={style.tableCell}>
                            <div className={style.phoneInfo}>
                              <span className={style.primaryPhone}>
                                {lead.leads_tel_1 || "—"}
                              </span>
                              {lead.leads_tel_2 && (
                                <span className={style.secondaryPhone}>
                                  {lead.leads_tel_2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={style.tableCell}>
                            <span className={style.dateInfo}>
                              {formatDate(lead.leads_date_accessed)}
                            </span>
                          </td>
                          <td className={style.tableCell}>
                            <span
                              className={`${style.statusBadge} ${
                                style[getStatusColor(lead.leads_status)]
                              }`}
                            >
                              {formatStatus(lead.leads_status)}
                            </span>
                          </td>
                          <td className={style.tableCell}>
                            <span className={style.observations}>
                              {lead.leads_observations || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className={style.emptyState}>
              <div className={style.emptyIcon}>📋</div>
              <h4>Nenhum lead encontrado</h4>
              <p>Este operador ainda não possui leads registrados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalHistory;
