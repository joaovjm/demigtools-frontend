import { getMaxAndMedDonations } from "../helper/getMaxAndMedDonations";
import getWorklistRequests from "../helper/getWorklistRequests";
import supabase from "../helper/superBaseClient";
import { DataNow } from "../components/DataTime";

export async function fetchWorklist() {
  try {
    const { data, error } = await supabase
      .from("request")
      .select()
      .eq("request_active", "True")
      .gte("request_end_date", DataNow("noformated"));
    if (error) console.error(error.message);

    if (data.length > 0) {
      const worklist = [
        ...new Map(
          data.map((dt) => [
            dt.request_name,
            {
              name: dt.request_name,
            },
          ])
        ).values(),
      ];
      return worklist;
    }
  } catch (error) {
    console.error(error.message);
  }
}

export async function worklistRequests(operatorID, workSelect) {
  const response = await getWorklistRequests(operatorID, workSelect);
  return response;
}

export async function fetchMaxAndMedDonations(id, requestName) {
  const {
    maxGeneral,
    maxPeriod,
    penultimate,
    countNotReceived,
    lastThreeDonations,
  } = await getMaxAndMedDonations(id, requestName);
  return {
    maxGeneral,
    maxPeriod,
    penultimate,
    countNotReceived,
    lastThreeDonations,
  };
}
