import React, { useState, useEffect } from "react";
import styles from "./donorActivityHistory.module.css";
import { 
  getDonorActivityLog, 
  getChangedFields, 
  getFieldLabel, 
  formatValue 
} from "../../helper/logDonorActivity";
import { FaHistory, FaUser, FaClock, FaInfoCircle } from "react-icons/fa";

const DonorActivityHistory = ({ donorId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadActivities();
  }, [donorId]);

  const loadActivities = async () => {
    setLoading(true);
    const data = await getDonorActivityLog(donorId);
    setActivities(data);
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case "donor_access":
        return "👁️";
      case "donor_edit":
        return "✏️";
      case "donation_create":
        return "➕";
      case "donation_edit":
        return "📝";
      case "donation_delete":
        return "🗑️";
      default:
        return "📌";
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case "donor_access":
        return "#6c757d"; // Cinza
      case "donor_edit":
        return "#ffc107"; // Amarelo
      case "donation_create":
        return "#28a745"; // Verde
      case "donation_edit":
        return "#17a2b8"; // Azul
      case "donation_delete":
        return "#dc3545"; // Vermelho
      default:
        return "#6c757d";
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderChanges = (activity) => {
    // Se for uma criação ou deleção, mostrar apenas new_values ou old_values
    if (activity.action_type === "donation_create") {
      if (!activity.new_values) return null;
      
      return (
        <div className={styles.changesContainer}>
          <h4>Dados da Doação Criada:</h4>
          <div className={styles.inlineDetails}>
            {Object.entries(activity.new_values).map(([key, value], index, arr) => (
              <span key={key} className={styles.inlineItem}>
                <span className={styles.fieldName}>{getFieldLabel(key)}:</span>
                <span className={styles.newValue}>{formatValue(value)}</span>
                {index < arr.length - 1 && <span className={styles.separator}> • </span>}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (activity.action_type === "donation_delete") {
      if (!activity.old_values) return null;
      
      return (
        <div className={styles.changesContainer}>
          <h4>Dados da Doação Deletada:</h4>
          <div className={styles.inlineDetails}>
            {Object.entries(activity.old_values).map(([key, value], index, arr) => (
              <span key={key} className={styles.inlineItem}>
                <span className={styles.fieldName}>{getFieldLabel(key)}:</span>
                <span className={styles.oldValue}>{formatValue(value)}</span>
                {index < arr.length - 1 && <span className={styles.separator}> • </span>}
              </span>
            ))}
          </div>
        </div>
      );
    }

    // Para edições, mostrar apenas os campos alterados
    if (activity.action_type === "donor_edit" || activity.action_type === "donation_edit") {
      const changes = getChangedFields(activity.old_values, activity.new_values);
      
      if (!changes) return null;

      return (
        <div className={styles.changesContainer}>
          <h4>Campos Alterados:</h4>
          <div className={styles.changesList}>
            {Object.entries(changes).map(([fieldName, { old, new: newValue }]) => (
              <div key={fieldName} className={styles.changeItem}>
                <div className={styles.fieldName}>{getFieldLabel(fieldName)}</div>
                <div className={styles.valueComparison}>
                  <div className={styles.oldValueBox}>
                    <span className={styles.label}>Antes:</span>
                    <span className={styles.oldValue}>{formatValue(old)}</span>
                  </div>
                  <span className={styles.arrow}>→</span>
                  <div className={styles.newValueBox}>
                    <span className={styles.label}>Depois:</span>
                    <span className={styles.newValue}>{formatValue(newValue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando histórico...</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <FaHistory size={48} color="#ccc" />
          <h3>Nenhuma atividade registrada</h3>
          <p>As ações realizadas neste doador aparecerão aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>
          <FaHistory /> Histórico de Atividades
        </h3>
        <p className={styles.subtitle}>
          Total de {activities.length} atividade{activities.length !== 1 ? "s" : ""} registrada{activities.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className={styles.timeline}>
        {activities.map((activity) => (
          <div key={activity.id} className={styles.activityCard}>
            <div
              className={styles.activityHeader}
              style={{ borderLeftColor: getActionColor(activity.action_type) }}
            >
              <div className={styles.activityIcon}>
                <span style={{ fontSize: "24px" }}>
                  {getActionIcon(activity.action_type)}
                </span>
              </div>

              <div className={styles.activityContent}>
                <div className={styles.activityTitle}>
                  {activity.action_description}
                </div>

                <div className={styles.activityMeta}>
                  <span className={styles.metaItem}>
                    <FaUser size={12} />
                    <strong>Operador:</strong> {activity.operator_code_id}
                    {activity.operator?.operator_name && ` - ${activity.operator.operator_name}`}
                  </span>
                  <span className={styles.metaItem}>
                    <FaClock size={12} />
                    <strong>Data:</strong> {formatDate(activity.created_at)}
                  </span>
                  {activity.related_donation_id && (
                    <span className={styles.metaItem}>
                      <FaInfoCircle size={12} />
                      <strong>Doação ID:</strong> {activity.related_donation_id}
                    </span>
                  )}
                </div>

                {(activity.old_values || activity.new_values) && (
                  <button
                    className={styles.detailsButton}
                    onClick={() => toggleExpand(activity.id)}
                  >
                    {expandedId === activity.id ? "Ocultar" : "Ver"} detalhes
                  </button>
                )}
              </div>
            </div>

            {expandedId === activity.id && renderChanges(activity)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonorActivityHistory;

