import { useState, useEffect, useCallback, useContext } from "react";
import { UserContext } from "../context/UserContext";
import getDonationNotReceived from "../helper/getDonationNotReceived";
import getAllDonationsReceived from "../helper/getAllDonationsReceived";
import getScheduledLeads from "../helper/getScheduledLeads";
import getOperatorMeta from "../helper/getOperatorMeta";
import { leadsHistoryService } from "../services/leadsHistoryService";
import { getOperatorActivities } from "../services/operatorActivityService";

/**
 * Hook customizado para gerenciar os dados do Dashboard Admin
 * @param {Object} options - Opções de configuração
 * @returns {Object} Dados e funções do dashboard
 */
const useDashboardData = ({ startDate, endDate }) => {
  const { operatorData } = useContext(UserContext);
  const caracterOperator = JSON.parse(localStorage.getItem("operatorData"));

  // Estados para doações
  const [confirmations, setConfirmations] = useState(null);
  const [valueConfirmations, setValueConfirmations] = useState(null);
  const [openDonations, setOpenDonations] = useState(null);
  const [valueOpenDonations, setValueOpenDonations] = useState(null);
  const [donationConfirmation, setDonationConfirmation] = useState([]);
  const [fullNotReceivedDonations, setFullNotReceivedDonations] = useState([]);

  // Estados para doações recebidas
  const [valueReceived, setValueReceived] = useState(0);
  const [donationsReceived, setDonationsReceived] = useState([]);

  // Estados para agendamentos
  const [scheduling, setScheduling] = useState(0);
  const [scheduled, setScheduled] = useState([]);

  // Estados para meta
  const [meta, setMeta] = useState([]);

  // Estados para leads
  const [leadsData, setLeadsData] = useState({
    operator: [],
    schedule: {},
    leadsNA: {},
    leadsNP: {},
    leadsSuccess: {},
    countLeads: {},
  });

  // Estados para atividades das operadoras
  const [operatorActivities, setOperatorActivities] = useState({
    activities: [],
    grouped: {},
  });

  // Estado de loading
  const [loading, setLoading] = useState(false);

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
   * Busca dados de leads
   */
  const fetchLeads = useCallback(async () => {
    try {
      const { operator, scheduled, leadsNA, leadsNP, leadsSuccess, countLeads } =
        await leadsHistoryService();
      
      setLeadsData({
        operator,
        schedule: scheduled,
        leadsNA,
        leadsNP,
        leadsSuccess,
        countLeads,
      });
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
    }
  }, []);

  /**
   * Busca atividades das operadoras
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
   * Atualiza todos os dados do dashboard
   */
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDonations(),
        fetchLeads(),
        fetchOperatorActivities(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchDonations, fetchLeads, fetchOperatorActivities]);

  // Busca meta inicial
  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  // Busca dados quando dependências mudam
  useEffect(() => {
    refreshAll();
  }, [operatorData, meta, startDate, endDate]);

  return {
    // Dados de doações
    confirmations,
    valueConfirmations,
    openDonations,
    valueOpenDonations,
    donationConfirmation,
    fullNotReceivedDonations,

    // Dados de doações recebidas
    valueReceived,
    donationsReceived,

    // Dados de agendamentos
    scheduling,
    scheduled,

    // Dados de meta
    meta,

    // Dados de leads
    leadsData,

    // Dados de atividades
    operatorActivities,

    // Estado e funções
    loading,
    refreshAll,
    fetchDonations,
    fetchLeads,
    fetchOperatorActivities,
  };
};

export default useDashboardData;

