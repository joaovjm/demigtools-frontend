import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import styles from "./dashboardadmin.module.css";

// Context
import { UserContext } from "../../context/UserContext";

// Components
import DateRangePicker from "../../components/DateRangePicker";
import { DashboardCards, DashboardContent, DashboardModals } from "./components";

// Helpers & Services
import getDonationNotReceived from "../../helper/getDonationNotReceived";
import getAllDonationsReceived from "../../helper/getAllDonationsReceived";
import getScheduledLeads from "../../helper/getScheduledLeads";
import getOperatorMeta from "../../helper/getOperatorMeta";
import { getOperatorActivities } from "../../services/operatorActivityService";

// Constants
import { CARD_IDS, VIEW_TYPES, STATUS_MESSAGES, TOAST_CONFIG } from "./constants";

/**
 * Dashboard Admin - Página principal do administrador
 */
const Dashboard = () => {
  const caracterOperator = JSON.parse(localStorage.getItem("operatorData"));
  const { operatorData } = useContext(UserContext);
  const receivedCardRef = useRef(null);

  // Estados de UI
  const [active, setActive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewType, setViewType] = useState(VIEW_TYPES.OPERATOR);
  const [donationFilterPerId, setDonationFilterPerId] = useState("");
  const [status, setStatus] = useState();

  // Estados do DateRangePicker
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerPosition, setDatePickerPosition] = useState({ top: 0, left: 0 });

  // Estados de dados de doações
  const [confirmations, setConfirmations] = useState(null);
  const [valueConfirmations, setValueConfirmations] = useState(null);
  const [openDonations, setOpenDonations] = useState(null);
  const [valueOpenDonations, setValueOpenDonations] = useState(null);
  const [donationConfirmation, setDonationConfirmation] = useState([]);
  const [fullNotReceivedDonations, setFullNotReceivedDonations] = useState([]);

  // Estados de doações recebidas
  const [valueReceived, setValueReceived] = useState(0);
  const [donationsReceived, setDonationsReceived] = useState([]);

  // Estados de agendamentos
  const [scheduling, setScheduling] = useState(0);
  const [scheduled, setScheduled] = useState([]);
  const [scheduledDonations, setScheduledDonations] = useState([]);
  const [nowScheduled, setNowScheduled] = useState(null);

  // Estados de modais
  const [donationConfirmationOpen, setDonationConfirmationOpen] = useState([]);
  const [donationOpen, setDonationOpen] = useState([]);
  const [scheduledOpen, setScheduledOpen] = useState([]);

  // Estado de atividades das operadoras (inclui atividades de leads)
  const [operatorActivities, setOperatorActivities] = useState({
    activities: [],
    grouped: {},
  });

  // Estado de meta
  const [meta, setMeta] = useState([]);

  /**
   * Busca dados de doações
   */
  const fetchDonations = useCallback(async () => {
    if (!caracterOperator) return;

    try {
      await getDonationNotReceived(
        setConfirmations,
        setValueConfirmations,
        setOpenDonations,
        setValueOpenDonations,
        setDonationConfirmation,
        setFullNotReceivedDonations,
        caracterOperator.operator_code_id,
        caracterOperator.operator_type,
        startDate,
        endDate
      );

      const receivedData = await getAllDonationsReceived({ startDate, endDate });
      setValueReceived(receivedData.totalValue);
      setDonationsReceived(receivedData.donation);

      await getScheduledLeads(null, setScheduled, setScheduling);
    } catch (error) {
      console.error("Erro ao buscar doações:", error);
    }
  }, [caracterOperator?.operator_code_id, startDate, endDate]);

  /**
   * Busca atividades das operadoras (inclui atividades de leads)
   */
  const fetchOperatorActivities = useCallback(async () => {
    try {
      const activities = await getOperatorActivities({ startDate, endDate });
      setOperatorActivities(activities);
    } catch (error) {
      console.error("Erro ao buscar atividades:", error);
    }
  }, [startDate, endDate]);

  /**
   * Busca meta dos operadores
   */
  const fetchMeta = useCallback(async () => {
    try {
      const metaInfo = await getOperatorMeta();
      setMeta(metaInfo);
    } catch (error) {
      console.error("Erro ao buscar meta:", error);
    }
  }, []);

  /**
   * Exibe toast de status
   */
  const showStatusToast = useCallback(() => {
    if (status === "OK") {
      toast.success(STATUS_MESSAGES.OK, TOAST_CONFIG);
    } else if (status === "Update OK") {
      toast.success(STATUS_MESSAGES.UPDATE_OK, TOAST_CONFIG);
    }
    setStatus(null);
  }, [status]);

  // Efeito para buscar meta inicial
  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  // Efeito para buscar dados quando dependências mudam
  useEffect(() => {
    fetchDonations();
    fetchOperatorActivities();
    showStatusToast();
  }, [active, modalOpen, status, operatorData, meta, startDate, endDate]);

  /**
   * Handler para clique no card
   */
  const handleClickCard = useCallback((e) => {
    setActive(e.currentTarget.id);
    setDonationFilterPerId(null);
    setViewType(VIEW_TYPES.OPERATOR);
  }, []);

  /**
   * Handler para mudança de tipo de visualização
   */
  const handleViewTypeChange = useCallback((type) => {
    setViewType(type);
    setDonationFilterPerId(null);
  }, []);

  /**
   * Handler para menu de contexto do card Recebido
   */
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

    // Ajustes de posição para não sair da tela
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

  /**
   * Handler para seleção de data
   */
  const handleDateSelect = useCallback((start, end) => {
    setStartDate(start || null);
    setEndDate(end || null);
  }, []);

  /**
   * Handler para fechar modal
   */
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  // Dados agregados para os componentes
  const cardData = {
    valueReceived,
    confirmations,
    valueConfirmations,
    openDonations,
    valueOpenDonations,
  };

  const contentData = {
    donationsReceived,
    donationConfirmation,
    fullNotReceivedDonations,
    scheduled,
    scheduledDonations,
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
      {/* Cards do Dashboard */}
      <DashboardCards
        active={active}
        onCardClick={handleClickCard}
        receivedCardRef={receivedCardRef}
        onReceivedContextMenu={handleReceivedCardContextMenu}
        data={cardData}
        totalActivities={operatorActivities.activities?.length || 0}
      />

      {/* DateRangePicker para filtro de datas */}
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

      {/* Conteúdo Principal */}
      <DashboardContent
        active={active}
        viewType={viewType}
        onViewTypeChange={handleViewTypeChange}
        donationFilterPerId={donationFilterPerId}
        data={contentData}
        handlers={modalHandlers}
        operatorActivities={operatorActivities}
        dateFilter={{ startDate, endDate }}
      />

      {/* Modais */}
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
