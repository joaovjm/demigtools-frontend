import { useState } from "react";
import supabase from "./superBaseClient";


export const useDonation = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    onConfirm: null,
  });

  const receiveDonation = async (date, collector, search, setTableReceipt) => {
    //Busca do Nome do Doador
  
    try {
      const { data, error } = await supabase
        .from("donation")
        .select(
          `     donation_value,
                  donation_received,
                  collector_code_id,
                  donation_worklist,
                  donor_id,
                  operator_code_id,
                  donor:donor_id (donor_name)`
        )
        .eq("receipt_donation_id", search);

      if (error) throw error;

      if (data.length > 0) {
        const { donation_value, donor, donation_received, collector_code_id, donation_worklist, donor_id, operator_code_id } =
          data[0];
        const name = donor?.donor_name;
        const value = donation_value;
        const received = donation_received;
        const collectorCode = collector_code_id;

      
        if (received === "Não") {
          if (collectorCode !== collector) {
            return new Promise((resolve) => {
              setModalConfig({
                title: "Confirmação necessária",
                message: "Ficha de outro coletador. Deseja continuar? ",
                onConfirm: () => {
                  performUpdate(date, collector, search, setTableReceipt, {
                    search,
                    name,
                    value,
                  }, donation_worklist, donor_id, operator_code_id).then(resolve);
                  setModalOpen(false);
                },
              });
              setModalOpen(true);
            });
          } else {
            return performUpdate(date, collector, search, setTableReceipt, {
              search,
              name,
              value,
            }, donation_worklist, donor_id, operator_code_id);
          }
        } else {
          return "received";
        }
      } else {
        return "not located";
      }
    } catch (error) {
      console.error("Error: ", error.message);
    }

    //setTimeout(() => {
    //  setMessage("");
    //}, 1000);
  };

  const performUpdate = async (
    date,
    collector,
    search,
    setTableReceipt,
    newItem,
    donation_worklist,
    donor_id,
    operator_code_id
  ) => {
    try {
      const { error: updateError } = await supabase
        .from("donation")
        .update({
          donation_received: "Sim",
          donation_day_received: date,
          collector_code_id: collector,
          donation_deposit_receipt_send: "Não"
        })
        .eq("receipt_donation_id", search);

      if (updateError) throw updateError;

      // Atualiza o request_status se donation_worklist existir

      if (donation_worklist) {
        const { error: requestUpdateError } = await supabase
          .from("request")
          .update({
            request_status: "Recebido"
          })
          .eq("request_name", donation_worklist)
          .eq("donor_id", donor_id);

        if (requestUpdateError) {
          console.error("Erro ao atualizar request:", requestUpdateError.message);
        }
      }

      setTableReceipt((prev) => [...prev, newItem]);
      return "success"
    } catch (error) {
      console.error("Erro na atualização", error.message);
    }

  };

  return { receiveDonation, modalOpen, setModalOpen, modalConfig };
};
