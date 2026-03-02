import supabase from "../helper/superBaseClient";

export async function getDonationsPrint(startDate, endDate, donationType = "Todos") {
  let newCollectorInDonation = [];
  try {
    //pega as doações que não foram impressas e não foram recebidas
    const { data: dateDonations, error } = await supabase
      .from("donation")
      .select(
        `*, ult_collector, collector_ult: ult_collector(collector_name), collector: collector_code_id(collector_name), donor: donor_id(donor_id, donor_name, donor_address, donor_city, donor_neighborhood, donor_tel_1, donor_type, donor_observation: donor_observation_donor_id_fkey(donor_observation), donor_reference:donor_reference_donor_id_fkey(donor_reference), donor_mensal(donor_mensal_day, active)), operator: operator_code_id(operator_name)`
      )
      .eq("donation_print", "Não")
      .eq("donation_received", "Não")
      .gte("donation_day_to_receive", startDate)
      .lte("donation_day_to_receive", endDate);

    if (error) {
    } else {
      // Filtra por tipo de doador (donor_type) se não for "Todos"
      let filteredDonations = dateDonations;
      if (donationType !== "Todos") {
        filteredDonations = dateDonations.filter(
          (donation) => donation.donor?.donor_type === donationType
        );
      }
      newCollectorInDonation = filteredDonations;
      const donor_id = filteredDonations.map((item) => item?.donor?.donor_id);
      //Verificar se o doador já tem uma doação recebida e retorna
      if (donor_id.length > 0) {
        for (let id of donor_id) {
          // Busca as últimas doações recebidas para encontrar um coletador válido (diferente de 10 e 11)
          const { data: donationData, error: donationDataError } =
            await supabase
              .from("donation")
              .select(
                "donor_id, donation_received, collector: collector_code_id(collector_code_id, collector_name)"
              )
              .eq("donor_id", id)
              .eq("donation_received", "Sim")
              .order("donation_day_received", { ascending: false })
              .limit(10);

          if (donationDataError) {
          } else {
            if (donationData?.length > 0) {
              // Busca o primeiro coletador que não seja 10 ou 11
              const validCollector = donationData.find(
                (donation) => 
                  donation.collector?.collector_code_id !== 10 && 
                  donation.collector?.collector_code_id !== 11
              );

              if (validCollector) {
                newCollectorInDonation = newCollectorInDonation.map((item) =>
                  item.donor.donor_id === validCollector.donor_id
                    ? {
                        ...item,
                        original_collector_code_id: item.collector_code_id, // Preserva o valor original do banco
                        collector_code_id:
                          validCollector.collector.collector_code_id,
                        collector: {
                          collector_name:
                            validCollector.collector.collector_name,
                        },
                        ult_collector: validCollector.collector.collector_code_id,
                        collector_ult: {
                          collector_name:
                            validCollector.collector.collector_name,
                        },
                      }
                    : item
                );
              }
            }
          }
        }
      }

      const ordered = newCollectorInDonation.sort((a, b) => {
        if (a.collector_code_id === 22) return 1;
        if (b.collector_code_id === 22) return -1;

        return a.collector_code_id - b.collector_code_id;
      });

      return ordered;
    }
  } catch (error) {
  }
}

export async function getDonationsPrinted() {
  try {
  const { data, error } = await supabase.storage
    .from("receiptPdfToPrint")
    .list("Print Checked", {
      limit: 100,
      offset: 0,
      sortBy: {
        column: "name",
        order: "asc",
      },
    });
    if (error) throw error;

    return data;
  } catch (error) {
  }
}
