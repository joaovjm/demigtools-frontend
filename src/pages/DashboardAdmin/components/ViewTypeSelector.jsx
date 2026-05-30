import styles from "../dashboardadmin.module.css";
import { VIEW_TYPES } from "../constants";

/**
 * Componente para selecionar o tipo de visualização (Operadora/Coletor)
 */
const ViewTypeSelector = ({ viewType, onViewTypeChange }) => {
  return (
    <div className={styles.viewTypeSelector}>
      <button
        className={`${styles.viewTypeButton} ${
          viewType === VIEW_TYPES.OPERATOR ? styles.active : ""
        }`}
        onClick={() => onViewTypeChange(VIEW_TYPES.OPERATOR)}
      >
        Por Operadora
      </button>
      <button
        className={`${styles.viewTypeButton} ${
          viewType === VIEW_TYPES.COLLECTOR ? styles.active : ""
        }`}
        onClick={() => onViewTypeChange(VIEW_TYPES.COLLECTOR)}
      >
        Por Coletor
      </button>
    </div>
  );
};

export default ViewTypeSelector;

