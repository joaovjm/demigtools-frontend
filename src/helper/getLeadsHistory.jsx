import supabase from "./superBaseClient";

/**
 * Tipos de status de leads
 */
export const LEADS_STATUS_TYPES = {
  SCHEDULED: "agendado",
  NOT_ANSWERED: "Não Atendeu",
  CANNOT_HELP: "Não pode ajudar",
  SUCCESS: "Sucesso",
};

/**
 * Labels amigáveis para os status de leads
 */
export const LEADS_STATUS_LABELS = {
  [LEADS_STATUS_TYPES.SCHEDULED]: "Agendado",
  [LEADS_STATUS_TYPES.NOT_ANSWERED]: "Não Atendeu",
  [LEADS_STATUS_TYPES.CANNOT_HELP]: "Não Pode Ajudar",
  [LEADS_STATUS_TYPES.SUCCESS]: "Sucesso",
};

/**
 * Busca leads com filtro de data opcional
 */
const getLeads = async (startDate, endDate) => {
  try {
    let query = supabase
      .from("leads")
      .select(
        "id, operator_code_id, operator_name: operator_code_id(operator_name), leads_status, leads_name, leads_phone, leads_date_accessed, created_at"
      )
      .or(
        "leads_status.eq.agendado, leads_status.eq.Não pode ajudar, leads_status.eq.Não Atendeu, leads_status.eq.Sucesso"
      )
      .order("leads_date_accessed", { ascending: false });

    if (startDate) {
      query = query.gte("leads_date_accessed", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("leads_date_accessed", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.log("Erro: ", error.message);
    return [];
  }
};

/**
 * Busca histórico de leads agrupado por operador
 */
export const getLeadsHistory = async (startDate, endDate) => {
  const leads = await getLeads(startDate, endDate);

  return { leads };
};

/**
 * Agrupa leads por operador com contagens por status
 */
export const getLeadsGroupedByOperator = async (startDate, endDate) => {
  const leads = await getLeads(startDate, endDate);

  const grouped = leads.reduce((acc, lead) => {
    // Usa o nome do operador ou fallback para o ID
    const operatorName = lead.operator_name?.operator_name || `Operador ${lead.operator_code_id}`;
    
    // Se não tiver nem nome nem ID, ignora o lead
    if (!operatorName || !lead.operator_code_id) return acc;

    if (!acc[operatorName]) {
      acc[operatorName] = {
        operatorId: lead.operator_code_id,
        operatorName: operatorName,
        leads: [],
        counts: {
          [LEADS_STATUS_TYPES.SCHEDULED]: 0,
          [LEADS_STATUS_TYPES.NOT_ANSWERED]: 0,
          [LEADS_STATUS_TYPES.CANNOT_HELP]: 0,
          [LEADS_STATUS_TYPES.SUCCESS]: 0,
        },
        total: 0,
      };
    }

    acc[operatorName].leads.push(lead);
    
    // Contabiliza o status do lead
    if (lead.leads_status) {
      // Verifica se o status existe nas chaves de counts
      if (acc[operatorName].counts.hasOwnProperty(lead.leads_status)) {
        acc[operatorName].counts[lead.leads_status] += 1;
        // Incrementa o total apenas quando o status é reconhecido
        acc[operatorName].total += 1;
      } else {
        // Log para debug caso apareça um status inesperado
        console.warn(`Status de lead não reconhecido: "${lead.leads_status}"`);
      }
    }

    return acc;
  }, {});

  return { leads, grouped };
};

/**
 * Busca leads de um operador específico
 */
export const getLeadsByOperatorId = async (operatorId, { startDate, endDate } = {}) => {
  try {
    let query = supabase
      .from("leads")
      .select(
        "id, operator_code_id, leads_status, leads_name, leads_phone, leads_date_accessed, created_at"
      )
      .eq("operator_code_id", operatorId)
      .or(
        "leads_status.eq.agendado, leads_status.eq.Não pode ajudar, leads_status.eq.Não Atendeu, leads_status.eq.Sucesso"
      )
      .order("leads_date_accessed", { ascending: false });

    if (startDate) {
      query = query.gte("leads_date_accessed", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("leads_date_accessed", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.log("Erro ao buscar leads do operador:", error.message);
    return [];
  }
};
