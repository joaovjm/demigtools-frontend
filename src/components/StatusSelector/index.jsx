import { useState, useEffect } from 'react';
import styles from './statusSelector.module.css';
import { AVAILABLE_STATUS, REQUEST_STATUS } from '../../constants/requestStatus';
import { toggleStatus, hasStatus, normalizeStatus } from '../../utils/statusUtils';

/**
 * Componente para seleção de múltiplos status
 * Permite seleção/desseleção individual de cada status
 * Status "Agendado" é exclusivo e substitui todos os outros quando selecionado
 */
const StatusSelector = ({ currentStatuses = [], onStatusChange }) => {
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  useEffect(() => {
    setSelectedStatuses(normalizeStatus(currentStatuses));
  }, [currentStatuses]);

  const handleStatusToggle = (statusValue) => {
    const newStatuses = toggleStatus(selectedStatuses, statusValue);
    setSelectedStatuses(newStatuses);
    
    if (onStatusChange) {
      onStatusChange(newStatuses);
    }
  };

  return (
    <div className={styles.statusSelectorContainer}>
      <h4 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}>🏷️</span>
        Status da Requisição
      </h4>
      
      <div className={styles.statusGrid}>
        {AVAILABLE_STATUS.map(({ value, label }) => {
          const isSelected = hasStatus(selectedStatuses, value);
          const isAgendado = value === REQUEST_STATUS.AGENDADO;
          
          return (
            <button
              key={value}
              type="button"
              className={`${styles.statusButton} ${
                isSelected ? styles.selected : ''
              } ${styles[`status${value}`]}`}
              onClick={() => handleStatusToggle(value)}
              title={isAgendado ? 'Ao selecionar Agendado, os outros status serão removidos' : ''}
            >
              <div className={styles.statusButtonContent}>
                <span className={styles.checkbox}>
                  {isSelected ? '✓' : ''}
                </span>
                <span className={styles.statusLabel}>{label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedStatuses.length > 0 && (
        <div className={styles.selectedStatusesPreview}>
          <strong>Status selecionados:</strong>
          <div className={styles.statusTagsContainer}>
            {selectedStatuses.map(status => (
              <span key={status} className={`${styles.statusTag} ${styles[`tag${status}`]}`}>
                {AVAILABLE_STATUS.find(s => s.value === status)?.label || status}
                <button
                  type="button"
                  className={styles.removeStatusBtn}
                  onClick={() => handleStatusToggle(status)}
                  title="Remover status"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusSelector;
