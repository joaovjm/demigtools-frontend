import { useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import styles from "./dashboardadmin.module.css";

import { UserContext } from "../../context/UserContext";
import DateRangePicker from "../../components/DateRangePicker";
import { DashboardCards, DashboardContent, DashboardModals } from "./components";
import { CARD_IDS, VIEW_TYPES, STATUS_MESSAGES, TOAST_CONFIG } from "./constants";
import MotivationalPhrases from "../../components/MotivationalPhrases";
import { useDashboardCardsQuery } from "../../hooks/useDashboardCardsQuery";
import {
  useDashboardLeadsTableQuery,
  useDashboardReceivedTableQuery,
  useDashboardConfirmationTableQuery,
  useDashboardOpenTableQuery,
  useDashboardScheduledTableQuery,
} from "../../hooks/useDashboardTableQueries";

import "../Dashboard/index.css";

/**
 * Dashboard Admin — dados via GET /api/dashboard (React Query).
 */
const Dashboard = () => {
  const { operatorData } = useContext(UserContext);
  const receivedCardRef = useRef(null);

  const caracterOperator = useMemo(() => {
    try {
      const raw = localStorage.getItem("operatorData");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [operatorData?.operator_code_id]);

  const operatorCodeId =
    operatorData?.operator_code_id ?? caracterOperator?.operator_code_id;
  const operatorType =
    operatorData?.operator_type ?? caracterOperator?.operator_type ?? "Admin";

  // Evita exibir a tabela de leads no carregamento (o histórico só aparece quando Leads estiver ativo)
  const [active, setActive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const prevModalOpenRef = useRef(modalOpen);
  const [viewType, setViewType] = useState(VIEW_TYPES.OPERATOR);
  const [donationFilterPerId, setDonationFilterPerId] = useState("");
  const [status, setStatus] = useState();

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerPosition, setDatePickerPosition] = useState({ top: 0, left: 0 });

  const [donationConfirmationOpen, setDonationConfirmationOpen] = useState([]);
  const [donationOpen, setDonationOpen] = useState([]);
  const [scheduledOpen, setScheduledOpen] = useState([]);
  const [nowScheduled, setNowScheduled] = useState(null);

  const {
    data: cards,
    isLoading: isCardsLoading,
    isError,
    error,
    refetch: refetchCards,
  } = useDashboardCardsQuery({
    operatorCodeId,
    operatorType,
    startDate,
    endDate,
    enabled: Boolean(operatorCodeId),
  });

  const {
    data: leadsTable,
    refetch: refetchLeadsTable,
    isLoading: isLeadsTableLoading,
    isFetching: isLeadsTableFetching,
  } = useDashboardLeadsTableQuery({
    startDate,
    endDate,
    enabled: active === CARD_IDS.LEADS && Boolean(operatorCodeId),
  });

  const {
    data: receivedTable,
    refetch: refetchReceivedTable,
    isLoading: isReceivedTableLoading,
    isFetching: isReceivedTableFetching,
  } = useDashboardReceivedTableQuery({
    operatorCodeId,
    operatorType,
    startDate,
    endDate,
    enabled: active === CARD_IDS.RECEIVED && Boolean(operatorCodeId),
  });

  const {
    data: confirmationTable,
    refetch: refetchConfirmationTable,
    isLoading: isConfirmationTableLoading,
    isFetching: isConfirmationTableFetching,
  } = useDashboardConfirmationTableQuery({
    operatorCodeId,
    operatorType,
    startDate,
    endDate,
    enabled: active === CARD_IDS.IN_CONFIRMATION && Boolean(operatorCodeId),
  });

  const {
    data: openTable,
    refetch: refetchOpenTable,
    isLoading: isOpenTableLoading,
    isFetching: isOpenTableFetching,
  } = useDashboardOpenTableQuery({
    operatorCodeId,
    operatorType,
    startDate,
    endDate,
    enabled: active === CARD_IDS.IN_OPEN && Boolean(operatorCodeId),
  });

  const {
    data: scheduledTable,
    refetch: refetchScheduledTable,
    isLoading: isScheduledTableLoading,
    isFetching: isScheduledTableFetching,
  } = useDashboardScheduledTableQuery({
    operatorCodeId,
    operatorType,
    startDate,
    endDate,
    enabled: active === CARD_IDS.IN_SCHEDULED && Boolean(operatorCodeId),
  });

  useEffect(() => {
    if (isError && error?.message) {
      toast.error(error.message);
    }
  }, [isError, error]);

  useEffect(() => {
    if (!status) return;

    if (status === "OK") {
      toast.success(STATUS_MESSAGES.OK, TOAST_CONFIG);
    } else if (status === "Update OK") {
      toast.success(STATUS_MESSAGES.UPDATE_OK, TOAST_CONFIG);
    }

    // Atualiza cards e a tabela ativa após mudança de status no backend
    refetchCards?.();
    if (active === CARD_IDS.LEADS) refetchLeadsTable?.();
    if (active === CARD_IDS.RECEIVED) refetchReceivedTable?.();
    if (active === CARD_IDS.IN_CONFIRMATION) refetchConfirmationTable?.();
    if (active === CARD_IDS.IN_OPEN) refetchOpenTable?.();
    if (active === CARD_IDS.IN_SCHEDULED) refetchScheduledTable?.();

    setStatus(null);
  }, [
    status,
    active,
    refetchCards,
    refetchLeadsTable,
    refetchReceivedTable,
    refetchConfirmationTable,
    refetchOpenTable,
    refetchScheduledTable,
  ]);

  // Atualiza dados quando modais fecham (ações em ModalConfirmations/ModalDonationInOpen
  // não disparam setStatus, mas devem refletir mudanças no dashboard)
  useEffect(() => {
    if (!prevModalOpenRef.current) {
      prevModalOpenRef.current = modalOpen;
      return;
    }

    if (prevModalOpenRef.current && !modalOpen) {
      refetchCards?.();
      if (active === CARD_IDS.LEADS) refetchLeadsTable?.();
      if (active === CARD_IDS.RECEIVED) refetchReceivedTable?.();
      if (active === CARD_IDS.IN_CONFIRMATION) refetchConfirmationTable?.();
      if (active === CARD_IDS.IN_OPEN) refetchOpenTable?.();
      if (active === CARD_IDS.IN_SCHEDULED) refetchScheduledTable?.();
    }

    prevModalOpenRef.current = modalOpen;
  }, [
    modalOpen,
    active,
    refetchCards,
    refetchLeadsTable,
    refetchReceivedTable,
    refetchConfirmationTable,
    refetchOpenTable,
    refetchScheduledTable,
  ]);

  // Garante refresh quando o usuário alterna os cards
  // (especialmente útil se uma query anterior falhou e ficou em erro).
  useEffect(() => {
    if (!operatorCodeId) return;
    if (active === CARD_IDS.LEADS) refetchLeadsTable?.();
    if (active === CARD_IDS.RECEIVED) refetchReceivedTable?.();
    if (active === CARD_IDS.IN_CONFIRMATION) refetchConfirmationTable?.();
    if (active === CARD_IDS.IN_OPEN) refetchOpenTable?.();
    if (active === CARD_IDS.IN_SCHEDULED) refetchScheduledTable?.();
  }, [
    active,
    operatorCodeId,
    refetchLeadsTable,
    refetchReceivedTable,
    refetchConfirmationTable,
    refetchOpenTable,
    refetchScheduledTable,
  ]);

  const handleClickCard = useCallback((e) => {
    setActive(e.currentTarget.id);
    setDonationFilterPerId("");
    setViewType(VIEW_TYPES.OPERATOR);
  }, []);

  const handleViewTypeChange = useCallback((type) => {
    setViewType(type);
    setDonationFilterPerId("");
  }, []);

  const handleReceivedCardContextMenu = useCallback((e) => {
    e.preventDefault();
    if (!receivedCardRef.current) return;

    const rect = receivedCardRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pickerWidth = 280;
    const pickerHeight = 250;

    let left = rect.left;
    let top = rect.bottom + 10;

    if (left + pickerWidth > viewportWidth) {
      left = viewportWidth - pickerWidth - 10;
    }
    if (top + pickerHeight > viewportHeight) {
      top = rect.top - pickerHeight - 10;
    }
    if (left < 10) left = 10;
    if (top < 10) top = 10;

    setDatePickerPosition({ top, left });
    setIsDatePickerOpen(true);
  }, []);

  const handleDateSelect = useCallback((start, end) => {
    setStartDate(start || null);
    setEndDate(end || null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const cardData = {
    valueReceived: cards?.valueReceived ?? 0,
    confirmations: cards?.confirmations ?? 0,
    valueConfirmations: cards?.valueConfirmations ?? 0,
    openDonations: cards?.openDonations ?? 0,
    valueOpenDonations: cards?.valueOpenDonations ?? 0,
  };

  const contentData = {
    donationsReceived: receivedTable ?? [],
    donationConfirmation: confirmationTable ?? [],
    fullNotReceivedDonations: openTable ?? [],
    scheduled: scheduledTable?.scheduled ?? [],
    scheduledDonations: scheduledTable?.scheduledDonations ?? [],
    scheduledFromTable: scheduledTable?.scheduledFromTable ?? [],
  };

  const operatorActivities = leadsTable ?? { grouped: {} };

  const tableLoading = {
    leads: isLeadsTableLoading || isLeadsTableFetching,
    received: isReceivedTableLoading || isReceivedTableFetching,
    inConfirmation: isConfirmationTableLoading || isConfirmationTableFetching,
    inOpen: isOpenTableLoading || isOpenTableFetching,
    inScheduled: isScheduledTableLoading || isScheduledTableFetching,
  };

  const modalHandlers = {
    setModalOpen,
    setDonationConfirmationOpen,
    setDonationOpen,
    setScheduledOpen,
    setNowScheduled,
    setDonationFilterPerId,
  };

  return (
    <main className={styles.mainDashboard}>
      {isCardsLoading && !cards ? (
        <p style={{ padding: "1rem" }}>Carregando dashboard…</p>
      ) : null}

      <DashboardCards
        active={active}
        onCardClick={handleClickCard}
        receivedCardRef={receivedCardRef}
        onReceivedContextMenu={handleReceivedCardContextMenu}
        operatorCodeId={operatorCodeId}
        data={cardData}
        totalActivities={cards?.activitiesTotal ?? 0}
      />

      {isDatePickerOpen && (
        <DateRangePicker
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          onDateSelect={handleDateSelect}
          startDate={startDate}
          endDate={endDate}
          position={datePickerPosition}
        />
      )}

      {!active && (
        <section className="motivational">
          <div className="motivational-card">
            <MotivationalPhrases />
          </div>
        </section>
      )}

      <DashboardContent
        active={active}
        viewType={viewType}
        onViewTypeChange={handleViewTypeChange}
        donationFilterPerId={donationFilterPerId}
        data={contentData}
        handlers={modalHandlers}
        operatorActivities={operatorActivities}
        dateFilter={{ startDate, endDate }}
        tableLoading={tableLoading}
      />

      <DashboardModals
        modalOpen={modalOpen}
        active={active}
        donationConfirmationOpen={donationConfirmationOpen}
        scheduledOpen={scheduledOpen}
        donationOpen={donationOpen}
        nowScheduled={nowScheduled}
        setStatus={setStatus}
        onClose={handleCloseModal}
      />
    </main>
  );
};

export default Dashboard;
