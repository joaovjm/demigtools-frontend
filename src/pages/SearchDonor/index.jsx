// React and Hooks
import React, { useState } from "react";
import { useNavigate } from "react-router";

//Components and Helpers
import fetchDonors from "../../services/searchDonorService"
import { DonorCard } from "../../components/cards/DonorCard";
import ModalEditLead from "../../components/ModalEditLead";
import { navigateWithNewTab } from "../../utils/navigationUtils";

//Styles
import styles from "./searchdonor.module.css";
import { SearchForm } from "../../components/forms/SearchForm";
import { ModalMergeDonators } from "../../components/modals/ModalMergeDonators";

const SearchDonor = () => {
  const [selectedValue, setSelectValue] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [donor, setDonor] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalEditLeadOpen, setIsModalEditLeadOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [isModalMergeDonatorsOpen, setIsModalMergeDonatorsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchDonor = async (e) => {
    e.preventDefault();
    await fetchDonors(searchTerm, selectedValue, setLoading, setDonor);
  };

  const handleDonorClick = (id, isLead = false, event) => {
    if (isLead) {
      setSelectedLeadId(id);
      setIsModalEditLeadOpen(true);
    } else {
      navigateWithNewTab(event, `/donor/${id}`, navigate);
    }
  };

  const handleAddDonorClick = (event) => {
    navigateWithNewTab(event, "/newdonor", navigate);
  };

  const handleMergeDonatorsClick = () => {
    setIsModalMergeDonatorsOpen(true);
  };

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <h2 className={styles.title}>Buscar Doador</h2>
        </header>

        {/* Search Section */}
        <div className={styles.searchSection}>
          <SearchForm
            searchTerm={searchTerm}
            selectedValue={selectedValue}
            loading={loading}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            setSelectedValue={setSelectValue}
            onSearchSubmit={handleSearchDonor}
            styles={styles}
          />
        </div>

        {/* Results Section */}
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsStats}>
              <span className={styles.statsLabel}>
                {loading ? "Buscando..." : donor?.length > 0 ? "Resultados" : "Nenhum resultado"}
              </span>
              {!loading && donor?.length > 0 && (
                <span className={styles.statsValue}>{donor.length}</span>
              )}
            </div>
            <div className={styles.resultsActions}>
              {donor?.length > 1 ? (
                <button type="button" className={styles.btnPrimary} onClick={handleMergeDonatorsClick}>
                  Mesclar Doadores
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={(e) => handleAddDonorClick(e)}
                  title="Ctrl+Click para abrir em nova aba"
                >
                  Adicionar Doador
                </button>
              )}
            </div>
          </div>

          <div className={styles.resultsContent}>
            {loading ? (
              <div className={styles.loadingState}>Buscando...</div>
            ) : donor?.length > 0 ? (
              <div className={styles.cardGrid}>
                {donor.map((donors) => (
                  <div key={donors.donor_id} className={styles.fadeIn}>
                    <DonorCard donor={donors} onClick={handleDonorClick} />
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🔍</span>
                <p>Nenhum doador encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Edit Lead */}
      <ModalEditLead
        isOpen={isModalEditLeadOpen}
        onClose={() => {
          setIsModalEditLeadOpen(false);
          setSelectedLeadId(null);
        }}
        leadId={selectedLeadId}
        initialEditMode={false}
      />

      <ModalMergeDonators
        isOpen={isModalMergeDonatorsOpen}
        onClose={() => {
          setIsModalMergeDonatorsOpen(false);
        }}
        donors={donor}
      />
    </main>
  );
};

export default SearchDonor;
