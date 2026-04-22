import { forwardRef } from "react";
import styles from "../dashboardadmin.module.css";
import { CARD_IDS } from "../constants";

/**
 * Card individual do dashboard
 */
const DashboardCard = forwardRef(({ 
  id, 
  title, 
  active, 
  onClick, 
  onContextMenu, 
  children 
}, ref) => (
  <div
    ref={ref}
    id={id}
    className={`${styles.divCard} ${active === id ? styles.active : ""}`}
    onClick={onClick}
    onContextMenu={onContextMenu}
  >
    <div className={styles.divHeader}>
      <h3 className={styles.h3Header}>{title}</h3>
    </div>
    <div className={styles.divBody}>
      {children}
    </div>
  </div>
));

DashboardCard.displayName = "DashboardCard";

/**
 * Componente que renderiza todos os cards do dashboard
 */
const DashboardCards = ({
  active,
  onCardClick,
  receivedCardRef,
  onReceivedContextMenu,
  totalActivities = 0,
  data: {
    valueReceived = 0,
    confirmations = 0,
    valueConfirmations = 0,
    openDonations = 0,
    valueOpenDonations = 0,
  },
}) => {
  return (
    <section className={styles.sectionHeader}>
      <div className={styles.sectionHeaderItem}>
        {/* Card Recebido */}
        <DashboardCard
          ref={receivedCardRef}
          id={CARD_IDS.RECEIVED}
          title="Recebido"
          active={active}
          onClick={onCardClick}
          onContextMenu={onReceivedContextMenu}
        >
          <p>R$ {valueReceived?.toFixed(2)}</p>
        </DashboardCard>

        {/* Card Em Confirmação */}
        <DashboardCard
          id={CARD_IDS.IN_CONFIRMATION}
          title="Em Confirmação"
          active={active}
          onClick={onCardClick}
        >
          <p>{confirmations}</p>
          <p>R$ {valueConfirmations}</p>
        </DashboardCard>

        {/* Card Em Aberto */}
        <DashboardCard
          id={CARD_IDS.IN_OPEN}
          title="Em Aberto"
          active={active}
          onClick={onCardClick}
        >
          <p>{openDonations}</p>
          <p>R$ {valueOpenDonations}</p>
        </DashboardCard>

        {/* Card Requisição */}
        <DashboardCard
          id={CARD_IDS.LEADS}
          title="Requisição & Leads"
          active={active}
          onClick={onCardClick}
        >
          <p style={{ display: "flex", justifyContent: "center" }}>
            {totalActivities}
          </p>
        </DashboardCard>
      </div>
    </section>
  );
};

export default DashboardCards;

