import { useNavigate } from "react-router";
import { FaUser, FaMapMarkerAlt, FaPhone, FaDollarSign, FaExclamationTriangle, FaEye } from "react-icons/fa";
import styles from "./modaldonationinopen.module.css";
import { navigateWithNewTab } from "../../utils/navigationUtils";

const ModalDonationInOpen = ({ donationOpen, onClose }) => {
  const navigate = useNavigate();
  
  return (
    <main className={styles.modalDonationInOpenContainer}>
      <div className={styles.modalDonationInOpen}>
        <div className={styles.modalDonationInOpenContent}>
          <div className={styles.modalDonationInOpenHeader}>
            <div className={styles.modalTitleSection}>
              <h2 className={styles.modalTitle}>
                <FaExclamationTriangle />
                Doação em Aberto
              </h2>
              <span className={styles.receiptNumber}>
                Recibo: #{donationOpen.receipt_donation_id}
              </span>
            </div>
            <button
              onClick={() => onClose()}
              className={styles.btnCloseModal}
              title="Fechar"
            >
              ✕
            </button>
          </div>

          <div className={styles.modalDonationInOpenBody}>
            <div className={styles.donationInfoSection}>
              <h3>Informações da Doação</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <FaDollarSign />
                    Valor
                  </div>
                  <div className={styles.infoValue}>
                    R$ {donationOpen.donation_value},00
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <FaExclamationTriangle />
                    Motivo
                  </div>
                  <div className={styles.infoValue.reason}>
                    {donationOpen.donation_confirmation_reason}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.donorInfoSection}>
              <h3>Dados do Doador</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <FaUser />
                    Nome
                  </div>
                  <div className={styles.infoValue}>
                    {donationOpen.donor_name}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <FaMapMarkerAlt />
                    Endereço
                  </div>
                  <div className={styles.infoValue}>
                    {donationOpen.donor_address}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <FaPhone />
                    Telefone 1
                  </div>
                  <div className={styles.infoValue}>
                    {donationOpen.donor_tel_1}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <FaPhone />
                    Telefone 2
                  </div>
                  <div className={styles.infoLabel}>
                    {donationOpen.donor_tel_2 || "*****-****"}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <FaPhone />
                    Telefone 3
                  </div>
                  <div className={styles.infoValue}>
                    {donationOpen.donor_tel_3 || "*****-****"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalDonationInOpenFooter}>
            <button
              onClick={(e) => navigateWithNewTab(e, `/donor/${donationOpen.donor_id}`, navigate)}
              className={styles.btnViewDonor}
              title="Ctrl+Click para abrir em nova aba"
            >
              <FaEye />
              Abrir Doador
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ModalDonationInOpen;
