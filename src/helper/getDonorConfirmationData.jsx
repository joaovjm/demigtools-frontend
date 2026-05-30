import supabase from "./superBaseClient";

export const getDonorConfirmationData = async (donorId) => {
  let countNotReceived = 0;
  let lastThreeDonations = [];
  let donorMensalDay = null;
  let donorMonthlyFee = null;

  try {
    // Buscar informações do doador mensal
    const { data: donorData, error: donorError } = await supabase
      .from("donor_mensal")
      .select("donor_mensal_day, donor_mensal_monthly_fee")
      .eq("donor_id", donorId)
      .single();

    if (donorError && donorError.code !== 'PGRST116') {
      console.log("Erro ao buscar donor mensal:", donorError.message);
    }

    if (donorData) {
      donorMensalDay = donorData.donor_mensal_day;
      donorMonthlyFee = donorData.donor_mensal_monthly_fee;
    }

    // Buscar doações do doador
    const { data: donations, error: donationsError } = await supabase
      .from("donation")
      .select("donation_value, donation_day_received, donation_received, donation_description")
      .eq("donor_id", donorId)
      .order("donation_day_received", { ascending: false });

    if (donationsError) {
      console.log("Erro ao buscar doações:", donationsError.message);
    }

    if (donations && donations.length > 0) {
      // Contar doações não recebidas a partir da mais recente
      for (let item of donations) {
        if (item?.donation_received === "Sim") break;
        if (item?.donation_received === "Não") countNotReceived++;
      }

      // Pegar as últimas 3 doações recebidas
      const receivedDonations = donations.filter(
        (donation) => donation.donation_received === "Sim"
      );
      lastThreeDonations = receivedDonations.slice(0, 3).map((donation) => ({
        value: donation.donation_value,
        day: donation.donation_day_received,
        description: donation.donation_description,
      }));
    }

    return {
      donorMensalDay,
      donorMonthlyFee,
      countNotReceived,
      lastThreeDonations,
    };
  } catch (error) {
    console.log("Erro ao buscar dados de confirmação:", error.message);
    return {
      donorMensalDay: null,
      donorMonthlyFee: null,
      countNotReceived: 0,
      lastThreeDonations: [],
    };
  }
};

