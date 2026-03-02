import supabase from "./superBaseClient";

export const getMaxAndMedDonations = async (id, requestName) => {
  let maxPeriod = [];
  let startPeriod = "";
  let endPeriod = "";
  let maxGeneral = [];
  let total = 0;
  let penultimate = [];
  let countNotReceived = 0;
  let history = [];

  try {
    const { data: DonationPeriod, error: ErrorPeriod } = await supabase
      .from("request_name")
      .select("start_period_request, end_period_request")
      .eq("name", requestName)
      .single();
    if (ErrorPeriod) {
      console.log(ErrorPeriod.message);
    }
    if (DonationPeriod) {
      startPeriod = DonationPeriod.start_period_request;
      endPeriod = DonationPeriod.end_period_request;
    }
  } catch (error) {
    console.log(error.message);
  }

  try {
    const { data, error } = await supabase
      .from("donation")
      .select("donation_value, donation_day_received, donation_received, donation_description")
      .eq("donor_id", id)
      .order("donation_day_received", { ascending: false });
    if (error) {
      console.log(error.message);
    }

    if (data.length > 0) {
      for (let item of data) {
        if (item?.donation_received === "Sim") break;
        if (item?.donation_received === "Não") countNotReceived++;
      }
      
      for (let i = 0; i < data.length; i++) {
        if (
          data[i]?.donation_day_received >= startPeriod &&
          data[i]?.donation_day_received <= endPeriod
        ) {
          if (data[i]?.donation_value > maxPeriod[0]?.value || maxPeriod.length === 0) {
            maxPeriod = [
              {
                value: data[i]?.donation_value,
                day: data[i]?.donation_day_received,
                description: data[i]?.donation_description,
              },
            ];
          }
        }
        if (
          (data[i]?.donation_value > maxGeneral[0]?.value ||
            maxGeneral.length === 0) &&
          data[i]?.donation_received === "Sim"
        ) {
          maxGeneral = [
            {
              value: data[i]?.donation_value,
              day: data[i]?.donation_day_received,
              description: data[i]?.donation_description,
            },
          ];
        }
        if (data[i]?.donation_received === "Sim" && penultimate.length === 0) {
          penultimate = [
            {
              value: data[i]?.donation_value,
              day: data[i]?.donation_day_received,
              description: data[i]?.donation_description,
            },
          ];
        }
        if (data[i]?.donation_received === "Sim") {
          history.push({
            value: data[i]?.donation_value,
            day: data[i]?.donation_day_received,
            description: data[i]?.donation_description,
          });
        }
        total += data[i].donation_value;
      }

      
    }

    // Get last 3 donations
    const lastThreeDonations = history.slice(0, 3);

    return { maxGeneral, maxPeriod, penultimate, countNotReceived, lastThreeDonations};
  } catch (error) {
    console.log(error.message);
  }
};
