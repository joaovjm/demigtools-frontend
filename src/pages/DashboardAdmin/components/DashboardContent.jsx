import styles from "../dashboardadmin.module.css";
import { CARD_IDS, VIEW_TYPES } from "../constants";

// Componentes de Cards
import OperatorCard from "../../../components/cards/OperatorCard";
import CollectorCard from "../../../components/cards/CollectorCard";
import ConfirmationCard from "../../../components/cards/ConfirmationCard";
import SchedulingCard from "../../../components/cards/SchedulingCard";
import ReceivedCard from "../../../components/cards/ReceivedCard";

// Componentes de Tabelas
import TableConfirmation from "../../../components/TableConfirmation";
import TableInOpen from "../../../components/TableInOpen";
import TableScheduled from "../../../components/TableScheduled";
import TableReceived from "../../../components/TableReceived";
import TableRequestHistory from "../../../components/TableRequestHistory";

// Componente auxiliar
import ViewTypeSelector from "./ViewTypeSelector";

/**
 * Renderiza o card lateral de operadores baseado no tipo ativo
 */
const OperatorSidebar = ({
  active,
  viewType,
  data: {
    donationsReceived,
    donationConfirmation,
    fullNotReceivedDonations,
    scheduled,
    scheduledDonations,
    scheduledFromTable,
  },
  setDonationFilterPerId,
}) => {
  switch (active) {
    case CARD_IDS.RECEIVED:
      return (
        <ReceivedCard
          operatorCount={donationsReceived}
          setDonationFilterPerId={setDonationFilterPerId}
        />
      );
    case CARD_IDS.IN_CONFIRMATION:
      return (
        <ConfirmationCard
          operatorCount={donationConfirmation}
          setDonationFilterPerId={setDonationFilterPerId}
        />
      );
    case CARD_IDS.IN_OPEN:
      return viewType === VIEW_TYPES.OPERATOR ? (
        <OperatorCard
          operatorCount={fullNotReceivedDonations}
          setDonationFilterPerId={setDonationFilterPerId}
        />
      ) : (
        <CollectorCard
          operatorCount={fullNotReceivedDonations}
          setDonationFilterPerId={setDonationFilterPerId}
        />
      );
    case CARD_IDS.IN_SCHEDULED:
      return (
        <SchedulingCard
          operatorCount={[...(scheduled || []), ...(scheduledDonations || []), ...(scheduledFromTable || [])]}
          setDonationFilterPerId={setDonationFilterPerId}
        />
      );
    default:
      return null;
  }
};

/**
 * Renderiza a tabela principal baseada no tipo ativo
 */
const MainTable = ({
  active,
  viewType,
  donationFilterPerId,
  tableLoading,
  data: {
    donationsReceived,
    donationConfirmation,
    fullNotReceivedDonations,
    scheduled,
    scheduledDonations,
    scheduledFromTable,
  },
  handlers: {
    setModalOpen,
    setDonationConfirmationOpen,
    setDonationOpen,
    setScheduledOpen,
    setNowScheduled,
  },
}) => {
  const isLoading =
    (active === CARD_IDS.RECEIVED && tableLoading?.received) ||
    (active === CARD_IDS.IN_CONFIRMATION &&
      tableLoading?.inConfirmation) ||
    (active === CARD_IDS.IN_OPEN && tableLoading?.inOpen) ||
    (active === CARD_IDS.IN_SCHEDULED && tableLoading?.inScheduled);

  const TableSkeleton = () => (
    <div className={styles.tableSkeleton}>
      <div className={styles.tableSkeletonHeader} />
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className={styles.tableSkeletonLine} />
      ))}
    </div>
  );

  if (isLoading) return <TableSkeleton />;

  switch (active) {
    case CARD_IDS.RECEIVED:
      return (
        <TableReceived
          donationsOperator={
            donationFilterPerId
              ? donationsReceived.filter(
                  (d) => d.operator_code_id === donationFilterPerId
                )
              : donationsReceived
          }
        />
      );
    case CARD_IDS.IN_CONFIRMATION:
      return (
        <TableConfirmation
          donationConfirmation={donationConfirmation}
          setModalOpen={setModalOpen}
          setDonationConfirmationOpen={setDonationConfirmationOpen}
          donationFilterPerId={donationFilterPerId}
          showOpenedColumn={true}
        />
      );
    case CARD_IDS.IN_OPEN:
      return (
        <TableInOpen
          fullNotReceivedDonations={fullNotReceivedDonations}
          setDonationOpen={setDonationOpen}
          setModalOpen={setModalOpen}
          donationFilterPerId={donationFilterPerId}
          filterType={viewType}
        />
      );
    case CARD_IDS.IN_SCHEDULED:
      return (
        <TableScheduled
          scheduled={scheduled}
          scheduledDonations={scheduledDonations}
          scheduledFromTable={scheduledFromTable}
          setModalOpen={setModalOpen}
          setScheduledOpen={setScheduledOpen}
          setNowScheduled={setNowScheduled}
          donationFilterPerId={donationFilterPerId}
        />
      );
    default:
      return null;
  }
};

/**
 * Conteúdo principal do dashboard baseado no card selecionado
 */
const DashboardContent = ({
  active,
  viewType,
  onViewTypeChange,
  donationFilterPerId,
  data,
  handlers,
  operatorActivities,
  dateFilter,
  tableLoading,
}) => {
  const LeadsSkeleton = () => (
    <div className={styles.divLeads}>
      <div className={styles.tableSkeleton}>
        <div className={styles.tableSkeletonHeader} />
        {Array.from({ length: 10 }).map((_, idx) => (
          <div key={idx} className={styles.tableSkeletonLine} />
        ))}
      </div>
    </div>
  );

  // O histórico de "Leads" só deve ser carregado/exibido quando o card Leads estiver ativo
  if (active === CARD_IDS.LEADS) {
    if (tableLoading?.leads) {
      return (
        <section className={styles.sectionGrafic}>
          <LeadsSkeleton />
        </section>
      );
    }

    return (
      <section className={styles.sectionGrafic}>
        <div className={styles.divLeads}>
          <TableRequestHistory
            operatorActivities={operatorActivities}
            dateFilter={dateFilter}
          />
        </div>
      </section>
    );
  }

  if (!active) return null;

  return (
    <section className={styles.sectionGrafic}>
      {/* Seletor de tipo de visualização apenas para "Em Aberto" */}
      {active === CARD_IDS.IN_OPEN && (
        <ViewTypeSelector
          viewType={viewType}
          onViewTypeChange={onViewTypeChange}
        />
      )}

      <div className={styles.sectionTableAndInfo}>
        {/* Sidebar com cards de operadores */}
        <div className={styles.sectionOperators}>
          <OperatorSidebar
            active={active}
            viewType={viewType}
            data={data}
            setDonationFilterPerId={handlers.setDonationFilterPerId}
          />
        </div>

        {/* Tabela principal */}
        <div className={styles.sectionTable}>
          <MainTable
            active={active}
            viewType={viewType}
            donationFilterPerId={donationFilterPerId}
            data={data}
            handlers={handlers}
            tableLoading={tableLoading}
          />
        </div>
      </div>
    </section>
  );
};

export default DashboardContent;

