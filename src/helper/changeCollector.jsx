import supabase from "./superBaseClient";

let resolver;
let setReason = "";

export const changeCollector = async (
  collector_code_id,
  receipt_donation_id,
  dateFormat,
  setOpenReason,
) => {

  try {
 
    const { data, error } = await supabase
      .from("donation")
      .select("donation_received")
      .eq("receipt_donation_id", receipt_donation_id);

    if (error) throw error;

    
    if (data[0].donation_received === "Não") {
      if (collector_code_id === 10) {
        setOpenReason(true);
     
        await new Promise((resolve) => {
          resolver = resolve;
        });

        setOpenReason(false);
       

     
        const { data, error } = await supabase
          .from("donor_confirmation_reason")
          .upsert(
            {
              receipt_donation_id: receipt_donation_id,
              donor_confirmation_reason: setReason,
            }, {onConflict: "receipt_donation_id" }
          )
          .select();

       
      }
        
      const { data, error } = await supabase
        .from("donation")
        .update([
          {
            collector_code_id: collector_code_id,
            donation_day_to_receive: dateFormat,
          },
        ])
        .eq("receipt_donation_id", receipt_donation_id)
        .select();

   
      return "Ok";
    } else {
      return "Yes";
    }
  } catch (error) {
    return 0;
  }
};

export const handleReasonButtonPressed = (reason) => {
    if (reason !== "") {
        setReason = reason;
        resolver()
        resolver = null;
    } else (
        console.log("Reason not provided")
    )
}
