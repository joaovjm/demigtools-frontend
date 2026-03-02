import supabase from "./superBaseClient";

/**
 * Registra uma atividade no histórico do doador
 * @param {Object} params - Parâmetros da atividade
 * @param {number} params.donor_id - ID do doador
 * @param {string} params.operator_code_id - ID do operador que realizou a ação
 * @param {string} params.action_type - Tipo de ação: 'donor_edit', 'donation_create', 'donation_edit', 'donation_delete', 'donor_access'
 * @param {string} params.action_description - Descrição detalhada da ação
 * @param {Object} params.old_values - Valores antigos (para edições)
 * @param {Object} params.new_values - Valores novos (para edições)
 * @param {number} params.related_donation_id - ID da doação relacionada (se aplicável)
 * @returns {Promise<Object>} Resultado da operação
 */
export async function logDonorActivity({
  donor_id,
  operator_code_id,
  action_type,
  action_description,
  old_values = null,
  new_values = null,
  related_donation_id = null,
}) {
  try {
    const { data, error } = await supabase
      .from("donor_activity_log")
      .insert([
        {
          donor_id,
          operator_code_id,
          action_type,
          action_description,
          old_values,
          new_values,
          related_donation_id,
        },
      ])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao registrar atividade do doador:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Busca o histórico de atividades de um doador
 * @param {number} donor_id - ID do doador
 * @param {number} limit - Limite de registros (padrão: 100)
 * @returns {Promise<Array>} Lista de atividades
 */
export async function getDonorActivityLog(donor_id, limit = 100) {
  try {
    // Buscar atividades
    const { data, error } = await supabase
      .from("donor_activity_log")
      .select("*")
      .eq("donor_id", donor_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Buscar códigos únicos de operadores
    const operatorCodes = [...new Set(data.map(activity => activity.operator_code_id).filter(Boolean))];
    
    if (operatorCodes.length === 0) return data;

    // Buscar nomes dos operadores
    const { data: operators, error: operatorsError } = await supabase
      .from("operator")
      .select("operator_code_id, operator_name")
      .in("operator_code_id", operatorCodes);

    if (operatorsError) {
      console.error("Erro ao buscar operadores:", operatorsError.message);
      return data; // Retorna dados mesmo sem nomes dos operadores
    }

    // Criar mapa de código -> nome
    const operatorMap = {};
    if (operators) {
      operators.forEach(op => {
        operatorMap[op.operator_code_id] = op.operator_name;
      });
    }

    // Adicionar nomes dos operadores às atividades
    const dataWithOperators = data.map(activity => ({
      ...activity,
      operator: activity.operator_code_id ? {
        operator_code_id: activity.operator_code_id,
        operator_name: operatorMap[activity.operator_code_id] || null
      } : null
    }));

    return dataWithOperators;
  } catch (error) {
    console.error("Erro ao buscar histórico do doador:", error.message);
    return [];
  }
}

/**
 * Cria uma descrição amigável para cada tipo de ação
 * @param {string} action_type - Tipo de ação
 * @param {Object} new_values - Valores novos (opcional)
 * @returns {string} Descrição amigável
 */
export function getActionDescription(action_type, new_values = {}) {
  const descriptions = {
    donor_access: "Acessou o doador",
    donor_edit: "Editou informações do doador",
    donation_create: `Criou uma doação${new_values?.donation_value ? ` no valor de R$ ${new_values.donation_value}` : ""}`,
    donation_edit: "Editou uma doação",
    donation_delete: `Deletou uma doação${new_values?.donation_value ? ` no valor de R$ ${new_values.donation_value}` : ""}`,
  };

  return descriptions[action_type] || "Realizou uma ação";
}

/**
 * Compara dois objetos e retorna apenas os campos que foram alterados
 * @param {Object} oldValues - Valores antigos
 * @param {Object} newValues - Valores novos
 * @returns {Object} Objeto com apenas os campos alterados {campo: {old: valor_antigo, new: valor_novo}}
 */
export function getChangedFields(oldValues, newValues) {
  if (!oldValues || !newValues) return null;

  const changes = {};
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

  allKeys.forEach((key) => {
    const oldValue = oldValues[key];
    const newValue = newValues[key];

    // Compara valores (considera null e undefined como iguais para simplificar)
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = {
        old: oldValue,
        new: newValue,
      };
    }
  });

  return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * Traduz nomes de campos técnicos para nomes amigáveis em português
 * @param {string} fieldName - Nome do campo técnico
 * @returns {string} Nome amigável do campo
 */
export function getFieldLabel(fieldName) {
  const labels = {
    // Donor fields
    nome: "Nome",
    tipo: "Tipo",
    cpf: "CPF",
    email: "Email",
    endereco: "Endereço",
    cidade: "Cidade",
    bairro: "Bairro",
    telefone1: "Telefone 1",
    telefone2: "Telefone 2",
    telefone3: "Telefone 3",
    dia: "Dia do Mensal",
    mensalidade: "Mensalidade",
    media: "Média",
    observacao: "Observação",
    referencia: "Referência",
    
    // Donation fields
    donation_value: "Valor",
    donation_extra: "Extra",
    donation_day_to_receive: "Data para Receber",
    donation_day_contact: "Data de Contato",
    donation_description: "Descrição",
    donation_monthref: "Mês Referente",
    donation_campain: "Campanha",
    operator_code_id: "Operador",
    collector_code_id: "Coletador",
    donation_print: "Impresso",
    donation_received: "Recebido",
    receipt_donation_id: "Recibo Nº",
  };

  return labels[fieldName] || fieldName;
}

/**
 * Formata um valor para exibição amigável
 * @param {any} value - Valor a ser formatado
 * @returns {string} Valor formatado
 */
export function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "(vazio)";
  }
  
  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }
  
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  
  // Formatar datas no formato YYYY-MM-DD
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  
  return String(value);
}

