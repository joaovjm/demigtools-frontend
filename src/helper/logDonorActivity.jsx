import {
  postDonorActivityLogRequest,
  fetchDonorActivityLog as fetchDonorActivityLogApi,
} from "../api/donorApi";

/**
 * Registra uma atividade no histórico do doador
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
    const data = await postDonorActivityLogRequest({
      donor_id,
      operator_code_id,
      action_type,
      action_description,
      old_values,
      new_values,
      related_donation_id,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao registrar atividade do doador:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Busca o histórico de atividades de um doador
 */
export async function getDonorActivityLog(donor_id, limit = 100) {
  try {
    return await fetchDonorActivityLogApi(donor_id, limit);
  } catch (error) {
    console.error("Erro ao buscar histórico do doador:", error.message);
    return [];
  }
}

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

export function getChangedFields(oldValues, newValues) {
  if (!oldValues || !newValues) return null;

  const changes = {};
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

  allKeys.forEach((key) => {
    const oldValue = oldValues[key];
    const newValue = newValues[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = {
        old: oldValue,
        new: newValue,
      };
    }
  });

  return Object.keys(changes).length > 0 ? changes : null;
}

export function getFieldLabel(fieldName) {
  const labels = {
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

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  return String(value);
}
