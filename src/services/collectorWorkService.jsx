import getCollectorPerReceived from "../helper/getReceiveDonationPerCollector";

const filterName = async (collectorWork) => {

  const collector = [
    ...new Map(
      collectorWork?.map((cl) => [
        cl.collector_code_id,
        { name: cl.collector_name?.collector_name, id: cl.collector_code_id },
      ])
    ).values(),
  ];

  return collector;
};

const filterValueReceived = async (collectorWork, method) => {
  const filterValueReceived = collectorWork?.reduce((acc, item) => {
    if (item.donation_received === "Sim") {
      const name = item.collector_name?.collector_name;
      acc[name] =
        (acc[name] || 0) + (method === "count" ? 1 : item.donation_value);
    }
    return acc;
  }, {});

  return filterValueReceived;
};

const filterValueNotReceived = async (collectorWork, method) => {
  const filterValueNotReceived = collectorWork?.reduce((acc, item) => {
    if (item.donation_received !== "Sim") {
      const name = item.collector_name?.collector_name;
      acc[name] =
        (acc[name] || 0) + (method === "count" ? 1 : item.donation_value);
    }
    return acc;
  }, {});

  return filterValueNotReceived;
};

export const collectorWorkService = async ({startDate, endDate}) => {
  const collectorWork = await getCollectorPerReceived(startDate, endDate);
  const names = await filterName(collectorWork);
  const countReceived = await filterValueReceived(collectorWork, "count");
  const addValueReceived = await filterValueReceived(collectorWork);
  const countNotReceived = await filterValueNotReceived(collectorWork, "count");
  const addValueNotReceived = await filterValueNotReceived(collectorWork);

  return {
    names,
    countReceived,
    addValueReceived,
    countNotReceived,
    addValueNotReceived,
  };
};
