export const queryKeys = {
  dashboard: {
    root: ["dashboard"],
    cards: (operatorCodeId, operatorType, startDate, endDate) => [
      "dashboardCards",
      { operatorCodeId, operatorType, startDate, endDate },
    ],
    tableLeads: (startDate, endDate) => ["dashboardTableLeads", { startDate, endDate }],
    tableReceived: (operatorCodeId, operatorType, startDate, endDate) => [
      "dashboardTableReceived",
      { operatorCodeId, operatorType, startDate, endDate },
    ],
    tableConfirmation: (operatorCodeId, operatorType, startDate, endDate) => [
      "dashboardTableConfirmation",
      { operatorCodeId, operatorType, startDate, endDate },
    ],
    tableOpen: (operatorCodeId, operatorType, startDate, endDate) => [
      "dashboardTableOpen",
      { operatorCodeId, operatorType, startDate, endDate },
    ],
    tableScheduled: (operatorCodeId, operatorType, startDate, endDate) => [
      "dashboardTableScheduled",
      { operatorCodeId, operatorType, startDate, endDate },
    ],
    detail: (operatorCodeId, operatorType, startDate, endDate) => [
      "dashboard",
      { operatorCodeId, operatorType, startDate, endDate },
    ],
  },
};
