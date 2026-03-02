import { useEffect, useState } from "react";
import styles from "./createmensaldonation.module.css";
import { DataSelect } from "../../components/DataTime";
import { monthHystoryChecker } from "../../helper/monthHistoryChecker";
import { monthlyfeeGenerator } from "../../helper/monthlyfeeGenerator";
import { GiConfirmed } from "react-icons/gi";
import { FaCalendarAlt, FaBullhorn, FaCog } from "react-icons/fa";
import Loader from "../../components/Loader";
import { getCampains } from "../../helper/getCampains";

const CreateMensalDonation = () => {
  const [mesrefGenerator, setMesrefGenerator] = useState("");
  const [isDisable, setIsDisable] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [contador, setContador] = useState(null);
  const [isLoading, setIsLoading] = useState(false)
  const [campain, setCampain] = useState([]);
  const [campainSelected, setCampainSelected] = useState("");

  const fetchCampains = async () => {
    const response = await getCampains();
    setCampain(response);
  };

  useEffect(() => {
    fetchCampains();
  }, []);

  const onMonthHystoryChecker = async (e) => {
    const value = e.target.value;
    setMesrefGenerator(value);
    setIsDisable(await monthHystoryChecker(value));
    setConfirmed(false);
  };

  const handleGerar = async (e) => {
    e.preventDefault();
    setIsLoading(true)
    const count = await monthlyfeeGenerator({
      mesRefGenerator: mesrefGenerator,
      campain: campainSelected,
    });

    if (count >= 0) {
      setContador(count);
      setConfirmed(true);
    }
    setIsLoading(false)
  };

  return (
    <div className={styles.createMensalDonationContainer}>
      <div className={styles.createMensalDonationContent}>
        <div className={styles.createMensalDonationHeader}>
          <h3 className={styles.createMensalDonationTitle}>
            <FaCog className={styles.titleIcon} />
            Gerador de Mensalidades
          </h3>
          <p className={styles.createMensalDonationSubtitle}>
            Configure e gere mensalidades para campanhas específicas
          </p>
        </div>

        <div className={styles.createMensalDonationForm}>
          {/* Seção de Configuração */}
          <div className={styles.createMensalDonationSection}>
            <h4 className={styles.sectionTitle}>
              <FaCalendarAlt className={styles.sectionIcon} />
              Configuração da Mensalidade
            </h4>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mês Referente *</label>
                <input
                  type="date"
                  value={mesrefGenerator}
                  onChange={onMonthHystoryChecker}
                  className={styles.createMensalDonationInput}
                  placeholder="Selecione o mês"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Campanha *</label>
                <select
                  value={campainSelected}
                  onChange={(e) => setCampainSelected(e.target.value)}
                  className={styles.createMensalDonationSelect}
                >
                  <option value="" disabled>
                    Selecione uma campanha...
                  </option>
                  {campain?.map((cp) => (
                    <option key={cp.id} value={cp.campain_name}>
                      {cp.campain_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                className={`${styles.createMensalDonationBtn} ${styles.primary}`}
                onClick={handleGerar}
                disabled={isDisable || confirmed || !mesrefGenerator || !campainSelected}
              >
                {isLoading ? (
                  <>
                    <Loader />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <FaBullhorn className={styles.btnIcon} />
                    <span>Gerar Mensalidade</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Seção de Status */}
          <div className={styles.createMensalDonationSection}>
            <h4 className={styles.sectionTitle}>
              <GiConfirmed className={styles.sectionIcon} />
              Status da Operação
            </h4>
            
            <div className={styles.statusContainer}>
              {!isDisable && !confirmed && !isLoading && (
                <div className={`${styles.statusMessage} ${styles.info}`}>
                  <div className={styles.statusIcon}>
                    <FaCog />
                  </div>
                  <div className={styles.statusContent}>
                    <h5>Pronto para Gerar</h5>
                    <p>Configure o mês e a campanha para gerar as mensalidades</p>
                  </div>
                </div>
              )}

              {isDisable && (
                <div className={`${styles.statusMessage} ${styles.warning}`}>
                  <div className={styles.statusIcon}>
                    <GiConfirmed />
                  </div>
                  <div className={styles.statusContent}>
                    <h5>Mensalidade Já Gerada</h5>
                    <p>As mensalidades para este mês já foram processadas anteriormente</p>
                  </div>
                </div>
              )}

              {confirmed && (
                <div className={`${styles.statusMessage} ${styles.success}`}>
                  <div className={styles.statusIcon}>
                    <GiConfirmed />
                  </div>
                  <div className={styles.statusContent}>
                    <h5>Mensalidade Gerada com Sucesso!</h5>
                    <p>
                      <strong>{contador}</strong> mensalidades foram criadas para a campanha selecionada
                    </p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className={`${styles.statusMessage} ${styles.loading}`}>
                  <div className={styles.statusIcon}>
                    <Loader />
                  </div>
                  <div className={styles.statusContent}>
                    <h5>Processando...</h5>
                    <p>Gerando mensalidades, aguarde um momento</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMensalDonation;
