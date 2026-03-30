import { fetchOperatorWorkSummary } from "../api/dashboardApi.js";

const filterName = (collectorWork) => {
  const collector = [
    ...new Map(
      (collectorWork || []).map((cl) => [
        cl.collector_code_id,
        { name: cl.collector_name?.collector_name, id: cl.collector_code_id },
      ])
    ).values(),
  ];

  return collector;
};

const filterValueReceived = (collectorWork, method) => {
  return (collectorWork || []).reduce((acc, item) => {
    if (item.donation_received === "Sim") {
      const name = item.collector_name?.collector_name;
      acc[name] =
        (acc[name] || 0) + (method === "count" ? 1 : item.donation_value);
    }
    return acc;
  }, {});
};

const filterValueNotReceived = (collectorWork, method) => {
  return (collectorWork || []).reduce((acc, item) => {
    if (item.donation_received !== "Sim") {
      const name = item.collector_name?.collector_name;
      acc[name] =
        (acc[name] || 0) + (method === "count" ? 1 : item.donation_value);
    }
    return acc;
  }, {});
};

export const collectorWorkService = async ({ startDate, endDate }) => {
  const collectorWork = await fetchOperatorWorkSummary({
    startDate,
    endDate,
    kind: "coletadores",
  });

  const names = filterName(collectorWork);
  const countReceived = filterValueReceived(collectorWork, "count");
  const addValueReceived = filterValueReceived(collectorWork);
  const countNotReceived = filterValueNotReceived(collectorWork, "count");
  const addValueNotReceived = filterValueNotReceived(collectorWork);

  return {
    names,
    countReceived,
    addValueReceived,
    countNotReceived,
    addValueNotReceived,
  };
};
