import supabase from "./superBaseClient";

/**
 * Busca doações agendadas da tabela donation
 * onde confirmation_status = "Agendado"
 * 
 * @param {number} operator_code_id - ID do operador (opcional, null para todos)
 * @param {function} setScheduledDonations - Função para atualizar o estado das doações agendadas
 * @returns {Promise<Array>} Array de doações agendadas
 */
const getScheduledDonations = async (
  operator_code_id,
  setScheduledDonations
) => {
  try {
    let query = supabase
      .from("donation")
      .select(
        `receipt_donation_id, 
         donor_id, 
         operator_code_id,
         confirmation_scheduled,
         confirmation_status,
         confirmation_observation,
         donation_value,
         donation_day_contact,
         donor:donor_id(
           donor_name,
           donor_tel_1,
           donor_address,
           donor_city,
           donor_neighborhood
         ),
         operator_name:operator_code_id(operator_name)`
      )
      .eq("confirmation_status", "Agendado")
      .not("confirmation_scheduled", "is", null)
      .order("confirmation_scheduled", { ascending: true });

    if (operator_code_id) {
      query = query.eq("operator_code_id", operator_code_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching scheduled donations:", error);
      setScheduledDonations([]);
      return [];
    }

    // Transformar os dados para o formato esperado pela TableScheduled
    const formattedData = data.map((donation) => ({
      id: donation.receipt_donation_id,
      donor_id: donation.donor_id,
      operator_code_id: donation.operator_code_id,
      scheduled_date: donation.confirmation_scheduled,
      scheduled_observation: donation.confirmation_observation || null,
      scheduled_tel_success: donation.donor?.donor_tel_1 || null,
      scheduled_value: donation.donation_value,
      donor: donation.donor ? {
        donor_name: donation.donor.donor_name,
        donor_tel_1: donation.donor.donor_tel_1,
        donor_address: donation.donor.donor_address,
        donor_city: donation.donor.donor_city,
        donor_neighborhood: donation.donor.donor_neighborhood,
      } : null,
      operator_name: donation.operator_name?.operator_name || null,
      donation_id: donation.receipt_donation_id,
      source: 'donation_agendada',
    }));

    setScheduledDonations(formattedData);
    return formattedData;
  } catch (error) {
    console.error("Error in getScheduledDonations:", error);
    setScheduledDonations([]);
    return [];
  }
};

export default getScheduledDonations;

