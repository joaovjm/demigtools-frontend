import supabase from "./superBaseClient";
import { logDonorActivity } from "./logDonorActivity";

const cancelDonation = async ({ donation, operatorCodeId }) => {
  console.log(donation)
  try {
    const { data, error } = await supabase
      .from("donation_canceled")
      .insert(donation);

    if (error) throw error;

    if (!error) {
      const { data: donationData, error: donationError } = await supabase
        .from("donation")
        .delete()
        .eq("receipt_donation_id", donation.receipt_donation_id);
      if (donationError) throw donationError;

      // Registrar cancelamento de doação no histórico
      if (operatorCodeId && donation.donor_id) {
        
        await logDonorActivity({
          donor_id: donation.donor_id,
          operator_code_id: operatorCodeId,
          action_type: "donation_delete",
          action_description: `Cancelou uma doação no valor de R$ ${donation.donation_value}`,
          old_values: {
            donation_value: donation.donation_value,
            donation_extra: donation.donation_extra,
            donation_day_to_receive: donation.donation_day_to_receive,
            donation_monthref: donation.donation_monthref,
            donation_description: donation.donation_description,
            operator_code_id: donation.operator_code_id,
            collector_code_id: donation.collector_code_id,
            donation_print: donation.donation_print,
            donation_received: donation.donation_received,
            receipt_donation_id: donation.receipt_donation_id,
          },
          related_donation_id: null,
        });
      }
    }

    return "OK"
  } catch (donationError) {
    console.error("Erroao cancelar doação:", donationError);
  }
};

export default cancelDonation;
