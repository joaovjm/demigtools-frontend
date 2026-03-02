import React from "react";
import { getLeadsHistory } from "../helper/getLeadsHistory";

const getNameOperator = (leads) => {
  const operator = [
    ...new Map(
      leads?.map((history) => [
        history.operator_name.operator_name,
        {
          name: history.operator_name.operator_name,
        },
      ])
    ).values(),
  ];

  return operator;
};

const getLeadsScheduling = (leads) => {
  const scheduled = leads?.reduce((acc, item) => {
    const name = item.operator_name.operator_name;
    if (item.leads_status === "agendado") acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  return scheduled;
};

const getLeadsNA = (leads) => {
  const leadsNA = leads?.reduce((acc, item) => {
    const name = item.operator_name.operator_name;
    if (item.leads_status === "Não Atendeu") acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  return leadsNA;
};

const getLeadsNP = (leads) => {
  const leadsNP = leads?.reduce((acc, item) => {
    const name = item.operator_name.operator_name;
    if (item.leads_status === "Não pode ajudar")
      acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  return leadsNP;
};

const getLeadsSuccess = (leads) => {
  const leadsSuccess = leads?.reduce((acc, item) => {
    const name = item.operator_name.operator_name
    if(item.leads_status === "Sucesso") acc[name] = (acc[name] || 0) + 1
    return acc;
  }, {})

  return leadsSuccess;
}

const getCountLeads = (leads) => {
  const countLeads = leads?.reduce((acc, item) => {
    const name = item.operator_name.operator_name
    acc[name] = (acc[name] || 0) + 1
    return acc;
  }, {})

  return countLeads;
}

export const leadsHistoryService = async () => {
  const { leads } = await getLeadsHistory();
  const operator = getNameOperator(leads);
  const scheduled = getLeadsScheduling(leads);
  const leadsNA = getLeadsNA(leads);
  const leadsNP = getLeadsNP(leads);
  const leadsSuccess = getLeadsSuccess(leads);
  const countLeads = getCountLeads(leads);

  return {
    operator,
    scheduled,
    leadsNA,
    leadsNP,
    leadsSuccess,
    countLeads
  };
};
