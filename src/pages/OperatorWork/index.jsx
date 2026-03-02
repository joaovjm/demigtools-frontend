import React, { useState } from "react";
import styles from "./operatorwork.module.css";
import { operatorWorkService } from "../../services/operatorWorkService";
import TableOperatorAndCollectorWork from "../../components/TableOperatorAndCollectorWork";
import { toast } from "react-toastify";
import { collectorWorkService } from "../../services/collectorWorkService";
import ModalOperatorsAndCollectorsWork from "../../components/modals/ModalOperatorsAndCollectorsWork";

const OperatorWork = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filter, setFilter] = useState("");
  const [relatory, setRelatory] = useState();
  const [click, setClick] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleGenerate = async () => {
    if ([startDate, endDate, filter].some((v) => v === "")) {
      toast.warning("Selecione as datas de inicio e fim!");
      return;
    }
    if (endDate < startDate) {
      toast.warning("A data final não pode ser menor que a data inicial");
      return;
    }

    if (filter === "Operadores") {
      setRelatory(null);
      const response = await operatorWorkService({startDate: startDate, endDate: endDate});
      setRelatory(response);
    } else if (filter === "Coletadores") {
      setRelatory(null);
      const response = await collectorWorkService({startDate: startDate, endDate: endDate});
      setRelatory(response);
    }
  };

  return (
    <div className={styles.operatorWorkContainer}>
      <div className={styles.operatorWorkContent}>
        <h3 className={styles.operatorWorkTitle}>Relatório de Trabalho</h3>
        
        {/* Seção de Filtros */}
        <div className={styles.operatorWorkFilters}>
          <div className={styles.operatorWorkForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Data de Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.operatorWorkInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Data de Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.operatorWorkInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tipo de Relatório</label>
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  className={styles.operatorWorkSelect}
                >
                  <option value="" disabled>Selecione o tipo...</option>
                  <option value="Operadores">Operadores</option>
                  <option value="Coletadores">Coletadores</option>
                </select>
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button 
                onClick={handleGenerate} 
                className={`${styles.operatorWorkBtn} ${styles.primary}`}
                disabled={!startDate || !endDate || !filter}
              >
                Gerar Relatório
              </button>
            </div>
          </div>
        </div>

        {/* Seção de Resultados */}
        {relatory && relatory.names.length !== 0 && (
          <div className={styles.operatorWorkResults}>
            <TableOperatorAndCollectorWork
              relatory={relatory}
              setClick={setClick}
              setTableDonationOpen={setModalOpen}
              filter={filter}
            />
          </div>
        )}

        {/* Estado Vazio */}
        {(!relatory || !relatory.names || relatory.names.length === 0) && (startDate && endDate && filter) && (
          <div className={styles.operatorWorkEmpty}>
            <div className={styles.emptyIcon}>📊</div>
            <h4>Nenhum dado encontrado</h4>
            <p>Não há registros para o período e filtro selecionados.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <ModalOperatorsAndCollectorsWork
          click={click}
          startDate={startDate}
          endDate={endDate}
          filter={filter}
          setModalOpen={setModalOpen}
        />
      )}
    </div>
  );
};

export default OperatorWork;
