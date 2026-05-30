import { fetchOperatorWorkSummary } from "../api/dashboardApi.js";

const filterName = (operatorWork) => {
  const operator = [
    ...new Map(
      (operatorWork || []).map((op) => [
        op.operator_name?.operator_name,
        { name: op.operator_name?.operator_name, id: op.operator_code_id },
      ])
    ).values(),
  ];
  return operator;
};

const filterValueReceived = (operatorWork, metode) => {
  const countDonation = (operatorWork || []).reduce((acc, item) => {
    const name = item.operator_name?.operator_name;
    if (item.donation_received === "Sim") {
      acc[name] =
        (acc[name] || 0) + (metode === "count" ? 1 : item.donation_value);
      return acc;
    }
    return acc;
  }, {});

  return countDonation;
};

const filterValueExtraReceived = (operatorWork, metode) => {
  const countDonation = (operatorWork || []).reduce((acc, item) => {
    const name = item.operator_name?.operator_name;
    if (item.donation_received === "Sim") {
      acc[name] =
        (acc[name] || 0) + (metode === "count" ? 1 : item.donation_extra);
      return acc;
    }
    return acc;
  }, {});

  return countDonation;
};

const filterValueNotReceived = (operatorWork, metode) => {
  const countDonation = (operatorWork || []).reduce((acc, item) => {
    const name = item.operator_name?.operator_name;
    if (item.donation_received !== "Sim") {
      acc[name] =
        (acc[name] || 0) + (metode === "count" ? 1 : item.donation_value);
    }
    return acc;
  }, {});

  return countDonation;
};

export const operatorWorkService = async ({ startDate, endDate }) => {
  const operatorWork = await fetchOperatorWorkSummary({
    startDate,
    endDate,
    kind: "operadores",
  });

  const names = filterName(operatorWork);
  const countReceived = filterValueReceived(operatorWork, "count");
  const addValueReceived = filterValueReceived(operatorWork);
  const countNotReceived = filterValueNotReceived(operatorWork, "count");
  const addValueNotReceived = filterValueNotReceived(operatorWork);
  const addValueExtraReceived = filterValueExtraReceived(operatorWork);

  return {
    names,
    countReceived,
    addValueReceived,
    countNotReceived,
    addValueNotReceived,
    addValueExtraReceived,
  };
};
