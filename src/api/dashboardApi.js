import apiClient from "../services/apiClient.js";

/**
 * Única chamada HTTP para montar o Dashboard Admin (backend agrega em paralelo).
 */
export async function fetchDashboard({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
}) {
  const { data: envelope } = await apiClient.get("/dashboard", {
    params: {
      operator_code_id: operatorCodeId,
      operator_type: operatorType,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });

  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida do dashboard");
  }

  return envelope.data;
}

export async function fetchDashboardCards({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
}) {
  const { data: envelope } = await apiClient.get("/dashboard/cards", {
    params: {
      operator_code_id: operatorCodeId,
      operator_type: operatorType,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });

  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida do dashboard");
  }

  return envelope.data;
}

export async function fetchDashboardLeadsTable({ startDate, endDate }) {
  const { data: envelope } = await apiClient.get("/dashboard/table/leads", {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });

  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida do leads");
  }

  return envelope.data;
}

export async function fetchDashboardReceivedTable({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
}) {
  const { data: envelope } = await apiClient.get("/dashboard/table/received", {
    params: {
      operator_code_id: operatorCodeId,
      operator_type: operatorType,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });

  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida do received");
  }

  return envelope.data;
}

export async function fetchDashboardConfirmationTable({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
}) {
  const { data: envelope } = await apiClient.get(
    "/dashboard/table/inConfirmation",
    {
      params: {
        operator_code_id: operatorCodeId,
        operator_type: operatorType,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
    }
  );

  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida do inConfirmation");
  }

  return envelope.data;
}

export async function fetchDashboardOpenTable({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
}) {
  const { data: envelope } = await apiClient.get("/dashboard/table/inOpen", {
    params: {
      operator_code_id: operatorCodeId,
      operator_type: operatorType,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });

  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida do inOpen");
  }

  return envelope.data;
}

export async function fetchDashboardScheduledTable({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
}) {
  const { data: envelope } = await apiClient.get(
    "/dashboard/table/inScheduled",
    {
      params: {
        operator_code_id: operatorCodeId,
        operator_type: operatorType,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
    }
  );

  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida do inScheduled");
  }

  return envelope.data;
}

/** Relatório diário da página Doações Recebidas (uma linha por dia). */
export async function fetchDonationsReceivedDaily({ startDate, endDate }) {
  const { data: envelope } = await apiClient.get(
    "/dashboard/donations-received/daily",
    {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    }
  );

  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida do relatório");
  }

  return envelope.data;
}

/** Tabela do modal Operadores/Coletadores (OperatorWork). */
export async function fetchDonationsByEntityWork({
  filterType,
  entityId,
  startDate,
  endDate,
  donationReceived,
}) {
  const { data: envelope } = await apiClient.get(
    "/dashboard/donations-received/by-entity",
    {
      params: {
        filter_type: filterType,
        entity_id: entityId,
        start_date: startDate,
        end_date: endDate,
        donation_received: donationReceived ?? undefined,
      },
    }
  );

  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida ao carregar doações");
  }

  return envelope.data;
}

/** Tabela principal do OperatorWork (agregação por operador ou coletor). */
export async function fetchOperatorWorkSummary({ startDate, endDate, kind }) {
  const { data: envelope } = await apiClient.get("/dashboard/operator-work/summary", {
    params: {
      start_date: startDate,
      end_date: endDate,
      kind,
    },
  });

  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error(envelope?.message || "Resposta inválida do relatório de trabalho");
  }

  return envelope.data;
}

export async function fetchWorkHistory({
  operatorCodeId,
  donationReceived,
  startDate,
  endDate,
}) {
  const { data: envelope } = await apiClient.get("/dashboard/work-history", {
    params: {
      operator_code_id: operatorCodeId,
      donation_received: donationReceived,
      start_date: startDate,
      end_date: endDate,
    },
  });

  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error(envelope?.message || "Resposta inválida do histórico");
  }

  return envelope.data;
}

export async function fetchMonthHistory({ selectedMonth }) {
  const { data: envelope } = await apiClient.get("/dashboard/month-history", {
    params: {
      selected_month: selectedMonth,
    },
  });

  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error(envelope?.message || "Resposta inválida do histórico mensal");
  }

  return envelope.data;
}
