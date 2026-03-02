import { useState, useEffect, useMemo } from "react";
import styles from "./modaloperatoractivity.module.css";
import { getOperatorActivityById, ACTIVITY_LABELS, ACTIVITY_TYPES } from "../../services/operatorActivityService";

// Tipos de atividades de leads
const LEAD_ACTIVITY_TYPES = [
  ACTIVITY_TYPES.LEAD_NOT_ANSWERED,
  ACTIVITY_TYPES.LEAD_CANNOT_HELP,
  ACTIVITY_TYPES.LEAD_SCHEDULED,
  ACTIVITY_TYPES.LEAD_SUCCESS,
  ACTIVITY_TYPES.LEAD_DONATION_FROM_SCHEDULED,
];

// Tipos de atividades de requisição
const REQUISICAO_ACTIVITY_TYPES = [
  ACTIVITY_TYPES.WORKLIST_CLICK,
  ACTIVITY_TYPES.NEW_DONATION,
  ACTIVITY_TYPES.SCHEDULED,
  ACTIVITY_TYPES.NOT_ANSWERED,
  ACTIVITY_TYPES.CANNOT_HELP,
  ACTIVITY_TYPES.WHATSAPP,
];

const ModalOperatorActivity = ({ operator, dateFilter = {}, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("requisicao");

  useEffect(() => {
    const fetchData = async () => {
      if (!operator?.operatorId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const activitiesData = await getOperatorActivityById(operator.operatorId, {
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
        });
        setActivities(activitiesData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [operator?.operatorId, dateFilter.startDate, dateFilter.endDate]);

  // Separa atividades de requisição e leads
  const requisicaoActivities = useMemo(() => 
    activities.filter(a => REQUISICAO_ACTIVITY_TYPES.includes(a.activity_type)),
    [activities]
  );

  const leadsActivities = useMemo(() => 
    activities.filter(a => LEAD_ACTIVITY_TYPES.includes(a.activity_type)),
    [activities]
  );

  // Filtra atividades baseado na tab e filtro selecionados
  const filteredActivities = useMemo(() => {
    const currentActivities = activeTab === "requisicao" ? requisicaoActivities : leadsActivities;
    if (filter === "all") return currentActivities;
    return currentActivities.filter(a => a.activity_type === filter);
  }, [activeTab, requisicaoActivities, leadsActivities, filter]);

  // Calcula contagens para a tab de leads
  const leadsActivityCounts = useMemo(() => ({
    [ACTIVITY_TYPES.LEAD_NOT_ANSWERED]: leadsActivities.filter(a => a.activity_type === ACTIVITY_TYPES.LEAD_NOT_ANSWERED).length,
    [ACTIVITY_TYPES.LEAD_CANNOT_HELP]: leadsActivities.filter(a => a.activity_type === ACTIVITY_TYPES.LEAD_CANNOT_HELP).length,
    [ACTIVITY_TYPES.LEAD_SCHEDULED]: leadsActivities.filter(a => a.activity_type === ACTIVITY_TYPES.LEAD_SCHEDULED).length,
    [ACTIVITY_TYPES.LEAD_SUCCESS]: leadsActivities.filter(a => 
      a.activity_type === ACTIVITY_TYPES.LEAD_SUCCESS || 
      a.activity_type === ACTIVITY_TYPES.LEAD_DONATION_FROM_SCHEDULED
    ).length,
  }), [leadsActivities]);

  const getActivityIcon = (type) => {
    const icons = {
      // Requisição
      [ACTIVITY_TYPES.WORKLIST_CLICK]: "📋",
      [ACTIVITY_TYPES.NEW_DONATION]: "💰",
      [ACTIVITY_TYPES.SCHEDULED]: "📅",
      [ACTIVITY_TYPES.NOT_ANSWERED]: "📵",
      [ACTIVITY_TYPES.CANNOT_HELP]: "❌",
      [ACTIVITY_TYPES.WHATSAPP]: "💬",
      // Leads
      [ACTIVITY_TYPES.LEAD_NOT_ANSWERED]: "📵",
      [ACTIVITY_TYPES.LEAD_CANNOT_HELP]: "❌",
      [ACTIVITY_TYPES.LEAD_SCHEDULED]: "📅",
      [ACTIVITY_TYPES.LEAD_SUCCESS]: "✅",
      [ACTIVITY_TYPES.LEAD_DONATION_FROM_SCHEDULED]: "🎯",
    };
    return icons[type] || "📌";
  };

  const getActivityClass = (type) => {
    const classes = {
      // Requisição
      [ACTIVITY_TYPES.NEW_DONATION]: styles.success,
      [ACTIVITY_TYPES.SCHEDULED]: styles.info,
      [ACTIVITY_TYPES.NOT_ANSWERED]: styles.warning,
      [ACTIVITY_TYPES.CANNOT_HELP]: styles.danger,
      [ACTIVITY_TYPES.WHATSAPP]: styles.whatsapp,
      [ACTIVITY_TYPES.WORKLIST_CLICK]: styles.neutral,
      // Leads
      [ACTIVITY_TYPES.LEAD_SUCCESS]: styles.successAlt,
      [ACTIVITY_TYPES.LEAD_DONATION_FROM_SCHEDULED]: styles.successAlt,
      [ACTIVITY_TYPES.LEAD_SCHEDULED]: styles.info,
      [ACTIVITY_TYPES.LEAD_NOT_ANSWERED]: styles.warning,
      [ACTIVITY_TYPES.LEAD_CANNOT_HELP]: styles.danger,
    };
    return classes[type] || "";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>
              {operator?.operatorName || "Operadora"}
            </h2>
            <p className={styles.subtitle}>Histórico de Atividades</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "requisicao" ? styles.activeTab : ""}`}
            onClick={() => { setActiveTab("requisicao"); setFilter("all"); }}
          >
            <span className={styles.tabIcon}>📋</span>
            Requisição
            <span className={styles.tabBadge}>{requisicaoActivities.length}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === "leads" ? styles.activeTab : ""}`}
            onClick={() => { setActiveTab("leads"); setFilter("all"); }}
          >
            <span className={styles.tabIcon}>👤</span>
            Leads
            <span className={styles.tabBadge}>{leadsActivities.length}</span>
          </button>
        </div>

        {/* Stats Bar - Requisição */}
        {activeTab === "requisicao" && (
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {operator?.activityCounts?.[ACTIVITY_TYPES.NEW_DONATION] || 0}
              </span>
              <span className={styles.statLabel}>Doações</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {operator?.activityCounts?.[ACTIVITY_TYPES.SCHEDULED] || 0}
              </span>
              <span className={styles.statLabel}>Agendamentos</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {operator?.activityCounts?.[ACTIVITY_TYPES.NOT_ANSWERED] || 0}
              </span>
              <span className={styles.statLabel}>Não Atendeu</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {operator?.activityCounts?.[ACTIVITY_TYPES.CANNOT_HELP] || 0}
              </span>
              <span className={styles.statLabel}>Não Pode</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {operator?.activityCounts?.[ACTIVITY_TYPES.WHATSAPP] || 0}
              </span>
              <span className={styles.statLabel}>Whatsapp</span>
            </div>
          </div>
        )}

        {/* Stats Bar - Leads */}
        {activeTab === "leads" && (
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {leadsActivityCounts[ACTIVITY_TYPES.LEAD_SUCCESS]}
              </span>
              <span className={styles.statLabel}>Sucesso</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {leadsActivityCounts[ACTIVITY_TYPES.LEAD_SCHEDULED]}
              </span>
              <span className={styles.statLabel}>Agendados</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {leadsActivityCounts[ACTIVITY_TYPES.LEAD_NOT_ANSWERED]}
              </span>
              <span className={styles.statLabel}>Não Atendeu</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {leadsActivityCounts[ACTIVITY_TYPES.LEAD_CANNOT_HELP]}
              </span>
              <span className={styles.statLabel}>Não Pode</span>
            </div>
          </div>
        )}

        {/* Filtros - Requisição */}
        {activeTab === "requisicao" && (
          <div className={styles.filters}>
            <button
              className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
              onClick={() => setFilter("all")}
            >
              Todos
            </button>
            <button
              className={`${styles.filterBtn} ${filter === ACTIVITY_TYPES.NEW_DONATION ? styles.active : ""}`}
              onClick={() => setFilter(ACTIVITY_TYPES.NEW_DONATION)}
            >
              Doações
            </button>
            <button
              className={`${styles.filterBtn} ${filter === ACTIVITY_TYPES.SCHEDULED ? styles.active : ""}`}
              onClick={() => setFilter(ACTIVITY_TYPES.SCHEDULED)}
            >
              Agendamentos
            </button>
            <button
              className={`${styles.filterBtn} ${filter === ACTIVITY_TYPES.NOT_ANSWERED ? styles.active : ""}`}
              onClick={() => setFilter(ACTIVITY_TYPES.NOT_ANSWERED)}
            >
              Não Atendeu
            </button>
            <button
              className={`${styles.filterBtn} ${filter === ACTIVITY_TYPES.CANNOT_HELP ? styles.active : ""}`}
              onClick={() => setFilter(ACTIVITY_TYPES.CANNOT_HELP)}
            >
              Não Pode
            </button>
          </div>
        )}

        {/* Filtros - Leads */}
        {activeTab === "leads" && (
          <div className={styles.filters}>
            <button
              className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
              onClick={() => setFilter("all")}
            >
              Todos
            </button>
            <button
              className={`${styles.filterBtn} ${filter === ACTIVITY_TYPES.LEAD_SUCCESS ? styles.active : ""}`}
              onClick={() => setFilter(ACTIVITY_TYPES.LEAD_SUCCESS)}
            >
              Sucesso
            </button>
            <button
              className={`${styles.filterBtn} ${filter === ACTIVITY_TYPES.LEAD_SCHEDULED ? styles.active : ""}`}
              onClick={() => setFilter(ACTIVITY_TYPES.LEAD_SCHEDULED)}
            >
              Agendados
            </button>
            <button
              className={`${styles.filterBtn} ${filter === ACTIVITY_TYPES.LEAD_NOT_ANSWERED ? styles.active : ""}`}
              onClick={() => setFilter(ACTIVITY_TYPES.LEAD_NOT_ANSWERED)}
            >
              Não Atendeu
            </button>
            <button
              className={`${styles.filterBtn} ${filter === ACTIVITY_TYPES.LEAD_CANNOT_HELP ? styles.active : ""}`}
              onClick={() => setFilter(ACTIVITY_TYPES.LEAD_CANNOT_HELP)}
            >
              Não Pode
            </button>
          </div>
        )}

        <div className={styles.body}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Carregando dados...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>{activeTab === "requisicao" ? "📭" : "👤"}</span>
              <p>Nenhuma atividade {activeTab === "requisicao" ? "de requisição" : "de lead"} encontrada</p>
            </div>
          ) : (
            <div className={styles.activityList}>
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`${styles.activityItem} ${getActivityClass(activity.activity_type)}`}
                >
                  <div className={styles.activityIcon}>
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityHeader}>
                      <span className={styles.activityType}>
                        {ACTIVITY_LABELS[activity.activity_type]}
                      </span>
                      <span className={styles.activityTime}>
                        {formatDate(activity.created_at)}
                      </span>
                    </div>
                    {activity.donor_name && (
                      <p className={styles.activityDonor}>
                        <strong>{activeTab === "leads" ? "Nome:" : "Doador:"}</strong> {activity.donor_name}
                      </p>
                    )}
                    {activity.request_name && (
                      <p className={styles.activityRequest}>
                        <strong>Pacote:</strong> {activity.request_name}
                      </p>
                    )}
                    {activity.metadata && (
                      <div className={styles.activityMeta}>
                        {activity.metadata.donationValue && (
                          <span>
                            <strong>Valor:</strong> R$ {activity.metadata.donationValue}
                          </span>
                        )}
                        {activity.metadata.value && (
                          <span>
                            <strong>Valor:</strong> R$ {activity.metadata.value}
                          </span>
                        )}
                        {activity.metadata.scheduledDate && (
                          <span>
                            <strong>Data Agendada:</strong> {activity.metadata.scheduledDate}
                          </span>
                        )}
                        {activity.metadata.date && (
                          <span>
                            <strong>Data:</strong> {activity.metadata.date}
                          </span>
                        )}
                        {activity.metadata.observation && (
                          <span>
                            <strong>Obs:</strong> {activity.metadata.observation}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.totalCount}>
            Total: {filteredActivities.length} {activeTab === "requisicao" ? "atividades" : "atividades de leads"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ModalOperatorActivity;

