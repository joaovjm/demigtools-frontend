import React, { useEffect, useState } from "react";
import styles from "./checkprint.module.css";
import { getDonationsPrint, getDonationsPrinted } from "../../services/printService";
import { FaAngleRight } from "react-icons/fa";
import { getCollector } from "../../helper/getCollector";
import supabase from "../../helper/superBaseClient";
import { toast } from "react-toastify";
import { getReceiptPrint } from "../../helper/getReceiptPrint";
import GenerateReceiptPDF from "../../components/GenerateReceiptPDF";
import ModalPrintedPackages from "../../components/modals/ModalPrintedPackages";

const CheckPrint = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(startDate);
  const [selectType, setSelectType] = useState("Todos");
  const [printers, setPrinters] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [config, setConfig] = useState([]);
  const [isOpen, setIsOpen] = useState();
  const [receiptPrint, setReceiptPrint] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [donationsPrinted, setDonationsPrinted] = useState([]);
  const [printedPackagesModalOpen, setPrintedPackagesModalOpen] = useState(false);
  const [originalDonations, setOriginalDonations] = useState([]);
  const [generating, setGenerating] = useState(false);
  const fetchCollectors = async () => {
    const response = await getCollector();
    setCollectors(response);
  };

  const fetchReceiptPrint = async () => {
    const response = await getReceiptPrint();
    setReceiptPrint(response);
  };

  const fetchDonationsPrinted = async () => {
    const response = await getDonationsPrinted();
    setDonationsPrinted(response);
  }

  useEffect(() => {
    fetchCollectors();
    fetchReceiptPrint();
    fetchDonationsPrinted();
  }, []);

  const handleDate = async (item, date) => {
    if (item === "startDate") {
      setStartDate(date);
      setEndDate(date);
    }
    if (item === "endDate") {
      setEndDate(date);
    }
  };

  const fetchDonationsNoPrint = async () => {
    setLoading("search");
    if (startDate === "" || endDate === "") {
      toast.warning("Data de início e fim são obrigatórias");
      setLoading("");
      return;
    }
    setPrinters([]);
    const response = await getDonationsPrint(startDate, endDate, selectType);
    setPrinters(response);
    // Armazenar os dados originais do banco para comparação posterior
    if (response?.length > 0) {
      setOriginalDonations(response?.map(item => ({
        receipt_donation_id: item.receipt_donation_id,
        // Usa o valor original do banco (antes da modificação pelo serviço)
        collector_code_id: item.original_collector_code_id !== undefined 
          ? item.original_collector_code_id 
          : item.collector_code_id
      })));
      const { data, error } = await supabase.from("receipt_config").select();
      if (error) throw error;
      if (!error) {
        setConfig(data[0]);
      }
      
    }
    setLoading("");

  };

  const selected = (id, collector) => {
    const collectorName = collectors.find(
      (f) => f.collector_code_id === Number(collector)
    );
    setPrinters((prev) =>
      prev.map((item) =>
        item.receipt_donation_id === id
          ? {
            ...item,
            collector_code_id: collector,
            collector: { collector_name: collectorName.collector_name },
          }
          : item
      )
    );
  };

  const handlePrint = () => {
    if (isOpen) {
      setIsOpen(null);
      return;
    }
    setIsOpen(true);
  };

  const handleGenerateReceiptPDF = async () => {
    setGenerating(true);
    // Verificar quais doações tiveram o coletador alterado
    const donationsToUpdate = printers.filter(print => {
      const original = originalDonations.find(
        orig => orig.receipt_donation_id === print.receipt_donation_id
      );
      if (!original) return false;
      // Normalizar valores para comparação (convertendo para número ou null)
      const originalCollector = original.collector_code_id ? Number(original.collector_code_id) : null;
      const currentCollector = print.collector_code_id ? Number(print.collector_code_id) : null;
      // Verifica se o coletador foi alterado (comparando com o valor original)
      return originalCollector !== currentCollector;
    });

    // Atualizar as doações que tiveram o coletador alterado
    if (donationsToUpdate.length > 0) {
      try {
        const updatePromises = donationsToUpdate.map(donation =>
          supabase
            .from("donation")
            .update({ collector_code_id: donation.collector_code_id })
            .eq("receipt_donation_id", donation.receipt_donation_id)
        );

        const results = await Promise.all(updatePromises);
        const errors = results.filter(result => result.error);

        if (errors.length > 0) {
          toast.error(`Erro ao atualizar ${errors.length} doação(ões)`);
        } else {
          toast.success(`${donationsToUpdate.length} doação(ões) atualizada(s) com sucesso`);
        }
      } catch (error) {
        console.error("Erro ao atualizar coletadores:", error);
        toast.error("Erro ao atualizar coletadores das doações");
      }
    }

    await GenerateReceiptPDF({
      cards: printers,
      receiptConfig: config,
      setOk: setOk,
    });
    setGenerating(false);
  };

  return (
    <main className={styles.checkprintContainer}>
      <div className={styles.checkprintContent}>
        {/* Header Section */}
        <header className={styles.checkprintHeader}>
          <h2 className={styles.checkprintTitle}>🖨️ Verificação de Impressão</h2>
          <div className={styles.checkprintActions}>
            <div
              className={styles.checkprintStatsCard}
              onClick={() => setPrintedPackagesModalOpen(true)}
            >
              <div className={styles.statsIcon}>📦</div>
              <div className={styles.statsContent}>
                <span className={styles.statsLabel}>Pacotes Impressos</span>
                <span className={styles.statsValue}>{donationsPrinted?.length || 0}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Search Section */}
        <div className={styles.checkprintSearchSection}>
          <div className={styles.checkprintSearchForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Data Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDate("startDate", e.target.value)}
                  className={styles.checkprintInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Data Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleDate("endDate", e.target.value)}
                  className={styles.checkprintInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tipo</label>
                <select
                  value={selectType}
                  onChange={(e) => setSelectType(e.target.value)}
                  className={styles.checkprintSelect}
                >
                  <option value="Todos">Todos</option>
                  <option value="Avulso">Avulso</option>
                  <option value="Mensal">Mensal</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <button
                  onClick={fetchDonationsNoPrint}
                  disabled={loading}
                  className={`${styles.checkprintBtn} ${styles.primary}`}
                >
                  {loading === "search" ? "Buscando..." : "🔍 Buscar"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {printers?.length > 0 && (
          <div className={styles.checkprintResultsSection}>
            <div className={styles.checkprintResultsHeader}>
              <div className={styles.resultsStats}>
                <div className={styles.statsItem}>
                  <span className={styles.statsLabel}>Fichas Encontradas</span>
                  <span className={styles.statsValue}>{printers?.length}</span>
                </div>
              </div>
              <div className={styles.resultsActions}>
                <button
                  className={`${styles.checkprintBtn} ${ok ? styles.success : styles.primary}`}
                  onClick={handleGenerateReceiptPDF}
                  disabled={ok || generating}
                >
                  {ok ? "✅ Impresso" : "🖨️ Gerar e Imprimir"}
                </button>
                <button
                  onClick={handlePrint}
                  className={[styles.checkprintToggleBtn, isOpen ? styles.open : null]
                    .filter(Boolean)
                    .join(" ")}
                  title={isOpen ? "Ocultar detalhes" : "Mostrar detalhes"}
                >
                  <FaAngleRight />
                </button>
              </div>
            </div>

            {isOpen && (
              <div className={styles.checkprintResultsContent}>
                <div className={styles.checkprintCardsGrid}>
                  {printers?.map((print) => (
                    <div
                      key={print.receipt_donation_id}
                      className={styles.checkprintCard}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.receiptBadge}>
                          #{print.receipt_donation_id}
                        </div>
                        <div className={styles.valueAmount}>
                          {print.donation_value.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </div>
                      </div>

                      <div className={styles.cardContent}>
                        <div className={styles.cardSection}>
                          <h4>Doador</h4>
                          <div className={styles.donorInfo}>
                            <span className={styles.donorName}>{print.donor.donor_name}</span>
                            <span className={styles.donorAddress}>{print.donor.donor_address}</span>
                            <span className={styles.donorNeighborhood}>{print.donor.donor_neighborhood}</span>
                          </div>
                        </div>

                        {print.donation_description && (
                          <div className={styles.cardSection}>
                            <h4>Observação</h4>
                            <p className={styles.donationDescription}>{print.donation_description}</p>
                          </div>
                        )}

                        <div className={styles.cardSection}>
                          <h4>Coletador</h4>
                          <select
                            value={print.collector_code_id || ""}
                            onChange={(e) =>
                              selected(print.receipt_donation_id, e.target.value)
                            }
                            disabled={ok}
                            className={styles.checkprintSelect}
                          >
                            <option value="" disabled>
                              Selecione um coletador...
                            </option>
                            {collectors?.map((collector) => (
                              <option
                                key={collector.collector_code_id}
                                value={collector.collector_code_id || ""}
                              >
                                {collector.collector_name || ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Pacotes Impressos */}
      {printedPackagesModalOpen && (
        <ModalPrintedPackages setModalOpen={setPrintedPackagesModalOpen} />
      )}

    </main>
  );
};

export default CheckPrint;
